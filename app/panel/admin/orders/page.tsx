'use client'

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import OrdersTable from '@/components/orders/OrdersTable'
import OrderFilters from '@/components/orders/OrderFilters'
import BulkActionsToolbar from '@/components/orders/BulkActionsToolbar'
import OrderDetailPanel from '@/components/orders/OrderDetailPanel'
import StatusBadge from '@/components/ui/StatusBadge'
import { useOrderStore, useSelectedOrders } from '@/stores/orderStore'
import { orderService, downloadCSV } from '@/services/orderService'
import { generateOrdersCSV } from '@/components/orders/BulkActionsToolbar'
import { useLanguage } from '@/hooks/useLanguage'
import api from '@/lib/api'
import logger from '@/lib/logger'
import type { Order, OrderFilters as OrderFiltersType, OrderStatus, BulkResult, ShopRef, OperatorRef } from '@/types/order'
import type { SubscriptionPlan } from '@/types/subscription'
import { clsx } from 'clsx'

/**
 * Admin Orders Management Page
 * 
 * Provides full order management capabilities for administrators including:
 * - View all orders across all shops (Requirements: 6.1)
 * - Filter by shop (Requirements: 6.2)
 * - Assign operators to orders (Requirements: 6.3)
 * - Override order status with reason (Requirements: 6.4)
 * - View order analytics summary (Requirements: 6.5)
 */

interface Shop {
  _id: string
  name: string
}

interface Operator {
  _id: string
  name: string
  email?: string
}

interface OrderAnalytics {
  confirmationRate: number
  averageProcessingTime: number // in hours
  statusDistribution: Record<OrderStatus, number>
  totalOrders: number
}

/**
 * Filter orders by shop ID
 * Property 15: Admin shop filter returns shop-specific orders
 * Validates: Requirements 6.2
 */
export function filterByShop(orders: Order[], shopId: string | undefined): Order[] {
  if (!shopId || shopId === '') {
    return orders
  }
  
  return orders.filter((order) => {
    const orderShopId = typeof order.shopId === 'string' 
      ? order.shopId 
      : (order.shopId as ShopRef)?._id
    return orderShopId === shopId
  })
}

/**
 * Calculate order analytics from orders list
 * Requirements: 6.5
 */
function calculateAnalytics(orders: Order[]): OrderAnalytics {
  const totalOrders = orders.length
  
  if (totalOrders === 0) {
    return {
      confirmationRate: 0,
      averageProcessingTime: 0,
      statusDistribution: {
        pending: 0,
        assigned: 0,
        in_progress: 0,
        confirmed: 0,
        rejected: 0,
        cancelled: 0,
      },
      totalOrders: 0,
    }
  }

  // Calculate status distribution
  const statusDistribution: Record<OrderStatus, number> = {
    pending: 0,
    assigned: 0,
    in_progress: 0,
    confirmed: 0,
    rejected: 0,
    cancelled: 0,
  }
  
  orders.forEach((order) => {
    if (statusDistribution[order.status] !== undefined) {
      statusDistribution[order.status]++
    }
  })
  
  // Calculate confirmation rate
  const confirmedCount = statusDistribution.confirmed
  const processedCount = confirmedCount + statusDistribution.rejected
  const confirmationRate = processedCount > 0 
    ? (confirmedCount / processedCount) * 100 
    : 0
  
  // Calculate average processing time (from creation to confirmation/rejection)
  let totalProcessingTime = 0
  let processedOrders = 0
  
  orders.forEach((order) => {
    if (order.status === 'confirmed' || order.status === 'rejected') {
      const createdAt = new Date(order.createdAt).getTime()
      const updatedAt = new Date(order.updatedAt).getTime()
      const processingTime = (updatedAt - createdAt) / (1000 * 60 * 60) // Convert to hours
      totalProcessingTime += processingTime
      processedOrders++
    }
  })
  
  const averageProcessingTime = processedOrders > 0 
    ? totalProcessingTime / processedOrders 
    : 0
  
  return {
    confirmationRate,
    averageProcessingTime,
    statusDistribution,
    totalOrders,
  }
}

/**
 * Analytics Summary Card Component
 * Requirements: 6.5
 */
function AnalyticsSummary({ analytics }: { analytics: OrderAnalytics }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Total Orders */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow">
        <p className="text-sm text-gray-500 dark:text-slate-400">Total Orders</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.totalOrders}</p>
      </div>
      
      {/* Confirmation Rate */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow">
        <p className="text-sm text-gray-500 dark:text-slate-400">Confirmation Rate</p>
        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
          {analytics.confirmationRate.toFixed(1)}%
        </p>
      </div>
      
      {/* Average Processing Time */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow">
        <p className="text-sm text-gray-500 dark:text-slate-400">Avg Processing Time</p>
        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          {analytics.averageProcessingTime.toFixed(1)}h
        </p>
      </div>
      
      {/* Status Distribution */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow">
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-2">Status Distribution</p>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs px-2 py-1 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
            Pending: {analytics.statusDistribution.pending}
          </span>
          <span className="text-xs px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
            Confirmed: {analytics.statusDistribution.confirmed}
          </span>
          <span className="text-xs px-2 py-1 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
            Rejected: {analytics.statusDistribution.rejected}
          </span>
        </div>
      </div>
    </div>
  )
}


/**
 * Admin Order Detail Panel with operator assignment and status override
 * Requirements: 6.3, 6.4
 */
interface AdminOrderDetailPanelProps {
  order: Order | null
  isOpen: boolean
  onClose: () => void
  operators: Operator[]
  onAssignOperator: (orderId: string, operatorId: string) => Promise<void>
  onStatusOverride: (orderId: string, status: OrderStatus, reason: string) => Promise<void>
}

function AdminOrderDetailPanel({
  order,
  isOpen,
  onClose,
  operators,
  onAssignOperator,
  onStatusOverride,
}: AdminOrderDetailPanelProps) {
  const [selectedOperator, setSelectedOperator] = useState<string>('')
  const [overrideStatus, setOverrideStatus] = useState<OrderStatus | ''>('')
  const [overrideReason, setOverrideReason] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)
  const [isOverriding, setIsOverriding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset state when order changes
  useEffect(() => {
    if (order) {
      const currentOperatorId = typeof order.assignedOperatorId === 'string'
        ? order.assignedOperatorId
        : (order.assignedOperatorId as OperatorRef)?._id || ''
      setSelectedOperator(currentOperatorId)
      setOverrideStatus('')
      setOverrideReason('')
      setError(null)
    }
  }, [order])

  const handleAssignOperator = async () => {
    if (!order || !selectedOperator) return
    
    setIsAssigning(true)
    setError(null)
    try {
      await onAssignOperator(order._id, selectedOperator)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign operator')
    } finally {
      setIsAssigning(false)
    }
  }

  const handleStatusOverride = async () => {
    if (!order || !overrideStatus || !overrideReason.trim()) {
      setError('Please select a status and provide a reason')
      return
    }
    
    setIsOverriding(true)
    setError(null)
    try {
      await onStatusOverride(order._id, overrideStatus, overrideReason)
      setOverrideStatus('')
      setOverrideReason('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to override status')
    } finally {
      setIsOverriding(false)
    }
  }

  if (!order || !isOpen) return null

  const shopName = typeof order.shopId === 'string' 
    ? order.shopId 
    : (order.shopId as ShopRef)?.name || 'Unknown Shop'

  const currentOperatorName = typeof order.assignedOperatorId === 'string'
    ? 'Unknown'
    : (order.assignedOperatorId as OperatorRef)?.name || 'Unassigned'

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 max-w-md w-full bg-white dark:bg-slate-800 shadow-xl">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="px-4 py-4 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Order {order.orderId}
                </h2>
                <p className="text-sm text-gray-500 dark:text-slate-400">Shop: {shopName}</p>
                <div className="mt-1">
                  <StatusBadge status={order.status} size="sm" />
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 dark:text-slate-400 dark:hover:text-slate-300"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>


          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
            {/* Customer Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-2">
                Customer Information
              </h3>
              <dl className="space-y-1">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500 dark:text-slate-400">Name</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">{order.clientInfo.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500 dark:text-slate-400">Phone</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">{order.clientInfo.phone}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500 dark:text-slate-400">Total</dt>
                  <dd className="text-sm font-medium text-green-600 dark:text-green-400">
                    ${order.totalAmount.toFixed(2)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Operator Assignment - Requirements: 6.3 */}
            <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-2">
                Operator Assignment
              </h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-2">
                Current: {currentOperatorName}
              </p>
              <div className="flex gap-2">
                <select
                  value={selectedOperator}
                  onChange={(e) => setSelectedOperator(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg text-sm"
                  data-testid="operator-select"
                >
                  <option value="">Select Operator</option>
                  {operators.map((op) => (
                    <option key={op._id} value={op._id}>{op.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleAssignOperator}
                  disabled={!selectedOperator || isAssigning}
                  className={clsx(
                    'px-4 py-2 rounded-lg text-sm font-medium',
                    'bg-blue-600 text-white hover:bg-blue-700',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                  data-testid="assign-operator-button"
                >
                  {isAssigning ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </div>

            {/* Status Override - Requirements: 6.4 */}
            <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-2">
                Status Override
              </h3>
              <div className="space-y-3">
                <select
                  value={overrideStatus}
                  onChange={(e) => setOverrideStatus(e.target.value as OrderStatus | '')}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg text-sm"
                  data-testid="status-override-select"
                >
                  <option value="">Select New Status</option>
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Reason for status override (required)"
                  rows={3}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg text-sm resize-none"
                  data-testid="override-reason-input"
                />
                <button
                  onClick={handleStatusOverride}
                  disabled={!overrideStatus || !overrideReason.trim() || isOverriding}
                  className={clsx(
                    'w-full px-4 py-2 rounded-lg text-sm font-medium',
                    'bg-orange-600 text-white hover:bg-orange-700',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                  data-testid="override-status-button"
                >
                  {isOverriding ? 'Overriding...' : 'Override Status'}
                </button>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


/**
 * Main Admin Orders Page Component
 */
export default function AdminOrdersPage() {
  const { t } = useLanguage()
  
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
  
  // Local state
  const [shops, setShops] = useState<Shop[]>([])
  const [operators, setOperators] = useState<Operator[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false)
  const [selectedShopId, setSelectedShopId] = useState<string>('')

  // Admin has enterprise-level access
  const subscriptionPlan: SubscriptionPlan = 'enterprise'

  // Calculate analytics from current orders
  const analytics = useMemo(() => calculateAnalytics(orders), [orders])

  /**
   * Fetch shops list for filter dropdown
   */
  const fetchShops = useCallback(async () => {
    try {
      const response = await api.get('/api/shops')
      setShops(response.data.shops || response.data || [])
    } catch (err) {
      logger.error('Failed to fetch shops:', err, 'Admin')
    }
  }, [])

  /**
   * Fetch operators list for assignment
   */
  const fetchOperators = useCallback(async () => {
    try {
      const response = await api.get('/api/users?role=operator')
      setOperators(response.data.users || response.data || [])
    } catch (err) {
      logger.error('Failed to fetch operators:', err, 'Admin')
    }
  }, [])

  /**
   * Fetch orders from API
   * Requirements: 6.1 - Display all orders from all shops
   */
  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Include shopId filter if selected
      const filtersWithShop = {
        ...filters,
        shopId: selectedShopId || undefined,
      }
      
      const response = await orderService.getOrders({
        page: currentPage,
        limit: pageSize,
        filters: filtersWithShop,
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
  }, [currentPage, pageSize, filters, selectedShopId, setOrders, setPagination, setLoading, setError])

  // Fetch data on mount
  useEffect(() => {
    fetchShops()
    fetchOperators()
  }, [fetchShops, fetchOperators])

  // Fetch orders when dependencies change
  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  /**
   * Handle order row click - opens detail panel
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
    setTimeout(() => setSelectedOrder(null), 300)
  }, [])

  /**
   * Handle filter changes
   */
  const handleFiltersChange = useCallback((newFilters: OrderFiltersType) => {
    setFilters(newFilters)
    clearSelection()
  }, [setFilters, clearSelection])

  /**
   * Handle shop filter change
   * Requirements: 6.2 - Filter by shop
   */
  const handleShopFilterChange = useCallback((shopId: string) => {
    setSelectedShopId(shopId)
    setCurrentPage(1)
    clearSelection()
  }, [setCurrentPage, clearSelection])

  /**
   * Handle page change
   */
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
    clearSelection()
  }, [setCurrentPage, clearSelection])

  /**
   * Handle retry after error
   */
  const handleRetry = useCallback(() => {
    fetchOrders()
  }, [fetchOrders])


  /**
   * Handle bulk status update
   */
  const handleBulkStatusUpdate = useCallback(async (status: OrderStatus): Promise<BulkResult> => {
    const result = await orderService.bulkUpdateStatus(selectedIds, status)
    await fetchOrders()
    if (result.successful > 0) {
      clearSelection()
    }
    return result
  }, [selectedIds, fetchOrders, clearSelection])

  /**
   * Handle bulk export
   */
  const handleBulkExport = useCallback(async (ordersToExport: Order[]): Promise<void> => {
    const csvContent = generateOrdersCSV(ordersToExport)
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const filename = `admin-orders-export-${new Date().toISOString().split('T')[0]}.csv`
    downloadCSV(blob, filename)
  }, [])

  /**
   * Handle operator assignment
   * Requirements: 6.3
   */
  const handleAssignOperator = useCallback(async (orderId: string, operatorId: string): Promise<void> => {
    const updatedOrder = await orderService.assignOperator(orderId, operatorId)
    updateOrder(updatedOrder)
    setSelectedOrder(updatedOrder)
  }, [updateOrder])

  /**
   * Handle status override
   * Requirements: 6.4
   */
  const handleStatusOverride = useCallback(async (
    orderId: string, 
    status: OrderStatus, 
    reason: string
  ): Promise<void> => {
    // Log admin action with reason
    logger.info(`Admin status override: Order ${orderId} -> ${status}`, { reason }, 'Admin')
    
    const updatedOrder = await orderService.updateOrderStatus(orderId, status, `[Admin Override] ${reason}`)
    updateOrder(updatedOrder)
    setSelectedOrder(updatedOrder)
  }, [updateOrder])

  /**
   * Handle clear selection
   */
  const handleClearSelection = useCallback(() => {
    clearSelection()
  }, [clearSelection])

  const selectionCount = selectedIds.length

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout userRole="admin">
        <div className="p-6 space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('page.orderManagement') || 'Order Management'}
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                {t('page.orderManagementDesc') || 'Manage all orders across the platform'}
              </p>
            </div>
            <div className="text-sm text-gray-500 dark:text-slate-400">
              {totalOrders} total orders
            </div>
          </div>

          {/* Analytics Summary - Requirements: 6.5 */}
          <AnalyticsSummary analytics={analytics} />

          {/* Shop Filter - Requirements: 6.2 */}
          <div className="flex items-center gap-4 mb-4">
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
              Filter by Shop:
            </label>
            <select
              value={selectedShopId}
              onChange={(e) => handleShopFilterChange(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-sm"
              data-testid="shop-filter"
            >
              <option value="">All Shops</option>
              {shops.map((shop) => (
                <option key={shop._id} value={shop._id}>{shop.name}</option>
              ))}
            </select>
          </div>

          {/* Filters */}
          <OrderFilters
            subscriptionPlan={subscriptionPlan}
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />

          {/* Bulk Actions Toolbar */}
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

          {/* Orders Table with Shop Name Column */}
          <OrdersTable
            orders={orders}
            userRole="admin"
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

          {/* Admin Order Detail Panel */}
          <AdminOrderDetailPanel
            order={selectedOrder}
            isOpen={isDetailPanelOpen}
            onClose={handleCloseDetailPanel}
            operators={operators}
            onAssignOperator={handleAssignOperator}
            onStatusOverride={handleStatusOverride}
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
