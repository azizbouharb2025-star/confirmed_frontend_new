'use client'

import React, { useState, useCallback, useEffect } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import OrdersTable from '@/components/orders/OrdersTable'
import OrderFilters from '@/components/orders/OrderFilters'
import BulkActionsToolbar from '@/components/orders/BulkActionsToolbar'
import OrderDetailPanel from '@/components/orders/OrderDetailPanel'
import { useOrderStore, useSelectedOrders } from '@/stores/orderStore'
import { orderService, downloadCSV } from '@/services/orderService'
import { generateOrdersCSV } from '@/components/orders/BulkActionsToolbar'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/hooks/useLanguage'
import type { Order, OrderFilters as OrderFiltersType, OrderStatus, BulkResult } from '@/types/order'
import type { SubscriptionPlan } from '@/types/subscription'

/**
 * Seller Orders Page
 * 
 * Integrates OrdersTable, OrderFilters, BulkActionsToolbar, and OrderDetailPanel
 * to provide a complete order management interface for sellers.
 * 
 * Requirements: 1.1, 2.1, 3.1, 4.1
 * Requirements: 1.2, 1.3, 1.4, 2.4, 2.5 - Subscription-based feature gating
 */

export default function ClientOrdersPage() {
  // Get user from auth store to access subscription plan
  // Requirements: 1.2, 1.3, 1.4, 2.4, 2.5 - Tier-based rendering
  const { user } = useAuth()
  
  // Get subscription plan from user, default to 'starter' if not set
  // This ensures proper feature gating based on user's actual subscription
  const subscriptionPlan: SubscriptionPlan = user?.subscriptionPlan || 'starter'
  
  // Zustand store state and actions
  const {
    orders,
    selectedIds,
    filters,
    isLoading,
    error,
    currentPage,
    totalPages,
    pageSize,
    totalOrders,
    setOrders,
    setSelectedIds,
    setFilters,
    setCurrentPage,
    setLoading,
    setError,
    setPagination,
    clearSelection,
    updateOrder,
  } = useOrderStore()

  // Get selected orders for bulk actions
  const selectedOrders = useSelectedOrders()
  
  // Local state for order detail panel
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false)

  // Manual order modal state
  const { t } = useLanguage()
  const [showManualModal, setShowManualModal] = useState(false)
  const [manualSaving, setManualSaving] = useState(false)
  const [manualError, setManualError] = useState<string | null>(null)
  const [manualSuccess, setManualSuccess] = useState<string | null>(null)
  const [manualForm, setManualForm] = useState({
    orderId: '',
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    items: [{ name: '', quantity: 1, price: 0, sku: '' }] as { name: string; quantity: number; price: number; sku: string }[],
    estimatedDate: '',
    trackingNumber: '',
    carrier: '',
  })
  const [manualFormErrors, setManualFormErrors] = useState<Record<string, string>>({})

  const resetManualForm = () => {
    setManualForm({
      orderId: '', clientName: '', clientPhone: '', clientEmail: '',
      street: '', city: '', state: '', zipCode: '', country: '',
      items: [{ name: '', quantity: 1, price: 0, sku: '' }],
      estimatedDate: '', trackingNumber: '', carrier: '',
    })
    setManualFormErrors({})
    setManualError(null)
  }

  const validateManualForm = (): boolean => {
    const errors: Record<string, string> = {}
    if (!manualForm.orderId.trim()) errors.orderId = t('orders.orderIdRequired')
    if (!manualForm.clientName.trim()) errors.clientName = t('orders.customerNameRequired')
    if (!manualForm.clientPhone.trim()) errors.clientPhone = t('orders.customerPhoneRequired')
    const validItems = manualForm.items.filter(i => i.name.trim() && i.quantity > 0 && i.price > 0)
    if (validItems.length === 0) errors.items = t('orders.itemsRequired')
    setManualFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleManualSubmit = async () => {
    if (!validateManualForm()) return
    setManualSaving(true)
    setManualError(null)

    try {
      const validItems = manualForm.items.filter(i => i.name.trim() && i.quantity > 0 && i.price > 0)
      const totalAmount = validItems.reduce((sum, i) => sum + i.quantity * i.price, 0)

      const payload: Parameters<typeof orderService.createOrder>[0] = {
        orderId: manualForm.orderId,
        clientInfo: {
          name: manualForm.clientName,
          phone: manualForm.clientPhone,
          ...(manualForm.clientEmail && { email: manualForm.clientEmail }),
          ...((manualForm.street || manualForm.city) && {
            address: {
              street: manualForm.street,
              city: manualForm.city,
              state: manualForm.state,
              zipCode: manualForm.zipCode,
              country: manualForm.country,
            }
          }),
        },
        items: validItems.map(i => ({
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          ...(i.sku && { sku: i.sku }),
        })),
        totalAmount,
        ...((manualForm.estimatedDate || manualForm.trackingNumber || manualForm.carrier) && {
          deliveryInfo: {
            ...(manualForm.estimatedDate && { estimatedDate: new Date(manualForm.estimatedDate).toISOString() }),
            ...(manualForm.trackingNumber && { trackingNumber: manualForm.trackingNumber }),
            ...(manualForm.carrier && { carrier: manualForm.carrier }),
          }
        }),
      }

      await orderService.createOrder(payload)
      setManualSuccess(t('orders.createSuccess'))
      setShowManualModal(false)
      resetManualForm()
      fetchOrders()
      setTimeout(() => setManualSuccess(null), 3000)
    } catch (err) {
      const error = err as { message?: string }
      setManualError(error.message || t('orders.failedCreate'))
    } finally {
      setManualSaving(false)
    }
  }

  const addItem = () => setManualForm(prev => ({ ...prev, items: [...prev.items, { name: '', quantity: 1, price: 0, sku: '' }] }))
  const removeItem = (idx: number) => setManualForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }))
  const updateItem = (idx: number, field: string, value: string | number) => {
    setManualForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === idx ? { ...item, [field]: value } : item)
    }))
  }

  /**
   * Fetch orders from API
   * Requirements: 1.1 - Display paginated table
   */
  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await orderService.getOrders({
        page: currentPage,
        limit: pageSize,
        filters,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      })
      
      setOrders(response.orders)
      setPagination(response.total, response.totalPages)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch orders'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, filters, setOrders, setPagination, setLoading, setError])

  // Fetch orders on mount and when dependencies change
  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  /**
   * Handle order row click - opens detail panel
   * Requirements: 4.1 - Display slide-over panel with complete order details
   */
  const handleOrderSelect = useCallback((order: Order) => {
    setSelectedOrder(order)
    setIsDetailPanelOpen(true)
  }, [])

  /**
   * Handle closing the detail panel
   */
  const handleCloseDetailPanel = useCallback(() => {
    setIsDetailPanelOpen(false)
    // Keep selectedOrder for animation, clear after panel closes
    setTimeout(() => setSelectedOrder(null), 300)
  }, [])

  /**
   * Handle filter changes
   * Requirements: 2.1 - Filter and search orders
   */
  const handleFiltersChange = useCallback((newFilters: OrderFiltersType) => {
    setFilters(newFilters)
    clearSelection() // Clear selection when filters change
  }, [setFilters, clearSelection])


  /**
   * Handle page change
   */
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
    clearSelection() // Clear selection when page changes
  }, [setCurrentPage, clearSelection])

  /**
   * Handle retry after error
   * Requirements: 1.6 - Display error message with retry button
   */
  const handleRetry = useCallback(() => {
    fetchOrders()
  }, [fetchOrders])

  /**
   * Handle bulk status update
   * Requirements: 3.3 - Bulk status update with progress indicator
   * Requirements: 3.4 - Display success/failure summary
   * Requirements: 3.6 - Continue processing on partial failure
   */
  const handleBulkStatusUpdate = useCallback(async (status: OrderStatus): Promise<BulkResult> => {
    const result = await orderService.bulkUpdateStatus(selectedIds, status)
    
    // Refresh orders to get updated data
    await fetchOrders()
    
    // Clear selection after bulk action
    if (result.successful > 0) {
      clearSelection()
    }
    
    return result
  }, [selectedIds, fetchOrders, clearSelection])

  /**
   * Handle bulk export
   * Requirements: 3.5 - Generate CSV file containing selected order data
   */
  const handleBulkExport = useCallback(async (ordersToExport: Order[]): Promise<void> => {
    const csvContent = generateOrdersCSV(ordersToExport)
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const filename = `orders-export-${new Date().toISOString().split('T')[0]}.csv`
    downloadCSV(blob, filename)
  }, [])

  /**
   * Handle status update from detail panel
   */
  const _handleStatusUpdate = useCallback(async (status: OrderStatus, notes?: string): Promise<void> => {
    if (!selectedOrder) return
    
    try {
      const updatedOrder = await orderService.updateOrderStatus(selectedOrder._id, status, notes)
      updateOrder(updatedOrder)
      setSelectedOrder(updatedOrder)
    } catch (err) {
      console.error('Failed to update order status:', err)
      throw err
    }
  }, [selectedOrder, updateOrder])

  /**
   * Handle clear selection
   * Requirements: 3.1 - Selection management
   */
  const handleClearSelection = useCallback(() => {
    clearSelection()
  }, [clearSelection])

  // Calculate selection count for toolbar
  const selectionCount = selectedIds.length

  return (
    <DashboardLayout userRole="shop_owner">
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Orders
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowManualModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/25"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
              {t('orders.addManual')}
            </button>
            <div className="text-sm text-gray-500 dark:text-slate-400">
              {totalOrders} total orders
            </div>
          </div>
        </div>

        {/* Success/Error alerts for manual order */}
        {manualSuccess && (
          <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500">
            {manualSuccess}
          </div>
        )}

        {/* Filters - Requirements: 2.1, 2.2, 2.3, 2.4, 2.5 */}
        <OrderFilters
          subscriptionPlan={subscriptionPlan}
          filters={filters}
          onFiltersChange={handleFiltersChange}
        />

        {/* Bulk Actions Toolbar - Requirements: 3.1, 3.3, 3.5 */}
        {selectionCount > 0 && (
          <BulkActionsToolbar
            selectedCount={selectionCount}
            selectedIds={selectedIds}
            selectedOrders={selectedOrders}
            onBulkStatusUpdate={handleBulkStatusUpdate}
            onBulkExport={handleBulkExport}
            onClearSelection={handleClearSelection}
          />
        )}

        {/* Orders Table - Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 3.1, 3.2 */}
        <OrdersTable
          orders={orders}
          userRole="seller"
          subscriptionPlan={subscriptionPlan}
          selectedIds={selectedIds}
          isLoading={isLoading}
          error={error}
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalOrders={totalOrders}
          onOrderSelect={handleOrderSelect}
          onSelectionChange={setSelectedIds}
          onPageChange={handlePageChange}
          onRetry={handleRetry}
        />

        {/* Order Detail Panel - Requirements: 4.1, 4.2, 4.3, 4.4 */}
        <OrderDetailPanel
          order={selectedOrder}
          isOpen={isDetailPanelOpen}
          onClose={handleCloseDetailPanel}
        />

        {/* Manual Order Modal */}
        {showManualModal && (
          <div className="fixed inset-0 dark:bg-black/60 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="dark:bg-slate-900 bg-white rounded-xl shadow-2xl border dark:border-slate-700 border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b dark:border-slate-700 border-gray-200">
                <h2 className="text-xl font-semibold dark:text-white text-gray-900">{t('orders.manualOrder')}</h2>
                <button onClick={() => { setShowManualModal(false); resetManualForm() }} className="p-2 rounded-lg dark:hover:bg-slate-800 hover:bg-gray-100 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </button>
              </div>

              <div className="p-6 space-y-5">
                {manualError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">{manualError}</div>
                )}

                {/* Order ID */}
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white text-gray-900">{t('orders.orderId')} *</label>
                  <input type="text" value={manualForm.orderId} onChange={e => setManualForm(p => ({ ...p, orderId: e.target.value }))} placeholder="ORDER-001" className={`w-full px-4 py-2.5 rounded-lg dark:bg-slate-800 bg-gray-50 border-2 ${manualFormErrors.orderId ? 'border-red-500' : 'dark:border-slate-600 border-gray-300 focus:border-blue-500'} dark:text-white text-gray-900 outline-none transition-all`} />
                  {manualFormErrors.orderId && <p className="text-red-500 text-xs mt-1">{manualFormErrors.orderId}</p>}
                </div>

                {/* Client Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-white text-gray-900">{t('orders.customerName')} *</label>
                    <input type="text" value={manualForm.clientName} onChange={e => setManualForm(p => ({ ...p, clientName: e.target.value }))} className={`w-full px-4 py-2.5 rounded-lg dark:bg-slate-800 bg-gray-50 border-2 ${manualFormErrors.clientName ? 'border-red-500' : 'dark:border-slate-600 border-gray-300 focus:border-blue-500'} dark:text-white text-gray-900 outline-none transition-all`} />
                    {manualFormErrors.clientName && <p className="text-red-500 text-xs mt-1">{manualFormErrors.clientName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-white text-gray-900">{t('orders.customerPhone')} *</label>
                    <input type="tel" value={manualForm.clientPhone} onChange={e => setManualForm(p => ({ ...p, clientPhone: e.target.value }))} className={`w-full px-4 py-2.5 rounded-lg dark:bg-slate-800 bg-gray-50 border-2 ${manualFormErrors.clientPhone ? 'border-red-500' : 'dark:border-slate-600 border-gray-300 focus:border-blue-500'} dark:text-white text-gray-900 outline-none transition-all`} />
                    {manualFormErrors.clientPhone && <p className="text-red-500 text-xs mt-1">{manualFormErrors.clientPhone}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white text-gray-900">{t('orders.customerEmail')}</label>
                  <input type="email" value={manualForm.clientEmail} onChange={e => setManualForm(p => ({ ...p, clientEmail: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg dark:bg-slate-800 bg-gray-50 border-2 dark:border-slate-600 border-gray-300 focus:border-blue-500 dark:text-white text-gray-900 outline-none transition-all" />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-white text-gray-900">{t('orders.addressSection')}</label>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder={t('orders.street')} value={manualForm.street} onChange={e => setManualForm(p => ({ ...p, street: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg dark:bg-slate-800 bg-gray-50 border-2 dark:border-slate-600 border-gray-300 focus:border-blue-500 dark:text-white text-gray-900 outline-none transition-all col-span-2" />
                    <input type="text" placeholder={t('orders.city')} value={manualForm.city} onChange={e => setManualForm(p => ({ ...p, city: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg dark:bg-slate-800 bg-gray-50 border-2 dark:border-slate-600 border-gray-300 focus:border-blue-500 dark:text-white text-gray-900 outline-none transition-all" />
                    <input type="text" placeholder={t('orders.state')} value={manualForm.state} onChange={e => setManualForm(p => ({ ...p, state: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg dark:bg-slate-800 bg-gray-50 border-2 dark:border-slate-600 border-gray-300 focus:border-blue-500 dark:text-white text-gray-900 outline-none transition-all" />
                    <input type="text" placeholder={t('orders.zipCode')} value={manualForm.zipCode} onChange={e => setManualForm(p => ({ ...p, zipCode: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg dark:bg-slate-800 bg-gray-50 border-2 dark:border-slate-600 border-gray-300 focus:border-blue-500 dark:text-white text-gray-900 outline-none transition-all" />
                    <input type="text" placeholder={t('orders.country')} value={manualForm.country} onChange={e => setManualForm(p => ({ ...p, country: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg dark:bg-slate-800 bg-gray-50 border-2 dark:border-slate-600 border-gray-300 focus:border-blue-500 dark:text-white text-gray-900 outline-none transition-all" />
                  </div>
                </div>

                {/* Items */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium dark:text-white text-gray-900">{t('orders.itemsSection')} *</label>
                    <button type="button" onClick={addItem} className="text-sm text-blue-500 hover:text-blue-400">{t('orders.addItem')}</button>
                  </div>
                  {manualFormErrors.items && <p className="text-red-500 text-xs mb-2">{manualFormErrors.items}</p>}
                  <div className="space-y-3">
                    {manualForm.items.map((item, idx) => (
                      <div key={idx} className="flex gap-2 items-start">
                        <input type="text" placeholder={t('orders.itemName')} value={item.name} onChange={e => updateItem(idx, 'name', e.target.value)} className="flex-1 px-3 py-2 rounded-lg dark:bg-slate-800 bg-gray-50 border-2 dark:border-slate-600 border-gray-300 focus:border-blue-500 dark:text-white text-gray-900 outline-none transition-all text-sm" />
                        <input type="number" placeholder={t('orders.itemQty')} value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 0)} min="1" className="w-16 px-3 py-2 rounded-lg dark:bg-slate-800 bg-gray-50 border-2 dark:border-slate-600 border-gray-300 focus:border-blue-500 dark:text-white text-gray-900 outline-none transition-all text-sm" />
                        <input type="number" placeholder={t('orders.itemPrice')} value={item.price || ''} onChange={e => updateItem(idx, 'price', parseFloat(e.target.value) || 0)} min="0" step="0.01" className="w-24 px-3 py-2 rounded-lg dark:bg-slate-800 bg-gray-50 border-2 dark:border-slate-600 border-gray-300 focus:border-blue-500 dark:text-white text-gray-900 outline-none transition-all text-sm" />
                        <input type="text" placeholder={t('orders.itemSku')} value={item.sku} onChange={e => updateItem(idx, 'sku', e.target.value)} className="w-28 px-3 py-2 rounded-lg dark:bg-slate-800 bg-gray-50 border-2 dark:border-slate-600 border-gray-300 focus:border-blue-500 dark:text-white text-gray-900 outline-none transition-all text-sm" />
                        {manualForm.items.length > 1 && (
                          <button type="button" onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-400 text-sm py-2">{t('orders.removeItem')}</button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-sm dark:text-slate-400 text-gray-500">
                    Total: {manualForm.items.reduce((s, i) => s + i.quantity * i.price, 0).toFixed(2)}
                  </div>
                </div>

                {/* Delivery Info */}
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-white text-gray-900">{t('orders.deliverySection')}</label>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="date" placeholder={t('orders.deliveryEstDate')} value={manualForm.estimatedDate} onChange={e => setManualForm(p => ({ ...p, estimatedDate: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg dark:bg-slate-800 bg-gray-50 border-2 dark:border-slate-600 border-gray-300 focus:border-blue-500 dark:text-white text-gray-900 outline-none transition-all" />
                    <input type="text" placeholder={t('orders.carrier')} value={manualForm.carrier} onChange={e => setManualForm(p => ({ ...p, carrier: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg dark:bg-slate-800 bg-gray-50 border-2 dark:border-slate-600 border-gray-300 focus:border-blue-500 dark:text-white text-gray-900 outline-none transition-all" />
                    <input type="text" placeholder={t('orders.trackingNumber')} value={manualForm.trackingNumber} onChange={e => setManualForm(p => ({ ...p, trackingNumber: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg dark:bg-slate-800 bg-gray-50 border-2 dark:border-slate-600 border-gray-300 focus:border-blue-500 dark:text-white text-gray-900 outline-none transition-all col-span-2" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 p-6 border-t dark:border-slate-700 border-gray-200">
                <button type="button" onClick={() => { setShowManualModal(false); resetManualForm() }} className="flex-1 px-4 py-3 dark:bg-slate-800 bg-white dark:text-white text-gray-700 border-2 dark:border-slate-700 border-gray-300 rounded-lg hover:opacity-80 transition-opacity font-medium">
                  {t('orders.cancel')}
                </button>
                <button type="button" onClick={handleManualSubmit} disabled={manualSaving} className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2">
                  {manualSaving ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      {t('orders.saving')}
                    </>
                  ) : t('orders.save')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
