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
          <div className="text-sm text-gray-500 dark:text-slate-400">
            {totalOrders} total orders
          </div>
        </div>

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
      </div>
    </DashboardLayout>
  )
}
