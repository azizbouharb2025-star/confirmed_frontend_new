'use client'

import React, { useState, useCallback, useEffect } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import OrdersTable from '@/components/orders/OrdersTable'
import OrderDetailPanel from '@/components/orders/OrderDetailPanel'
import OrderFilters from '@/components/orders/OrderFilters'
import BulkActionsToolbar from '@/components/orders/BulkActionsToolbar'
import StatusBadge from '@/components/ui/StatusBadge'
import { useOrderStore, useSelectedOrders } from '@/stores/orderStore'
import { orderService, downloadCSV } from '@/services/orderService'
import { generateOrdersCSV } from '@/components/orders/BulkActionsToolbar'
import { useLanguage } from '@/hooks/useLanguage'
import api from '@/lib/api'
import logger from '@/lib/logger'
import { formatCurrency } from '@/lib/formatCurrency'
import type { Order, OrderFilters as OrderFiltersType, OrderStatus, BulkResult, OrderStatusSummary, ShopRef, OperatorRef } from '@/types/order'
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
  name?: string
  firstName?: string
  lastName?: string
  email?: string
}

interface CourierOption {
  _id: string
  name: string
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
                  Commande #{order.confirmedId}
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
                    {formatCurrency(order.totalAmount)}
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
  const [couriers, setCouriers] = useState<CourierOption[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const [
    adminSummary,
    setAdminSummary,
  ] = useState<OrderStatusSummary | null>(
    null
  )

  const [
    isAdminActionsOpen,
    setIsAdminActionsOpen,
  ] = useState(false)
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false)
  const [selectedShopId, setSelectedShopId] = useState<string>('')

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
      const response =
        await api.get('/api/admin/operators')

      const items =
        response.data?.operators || []

      setOperators(
        items.map((op: {
          _id: string
          firstName?: string
          lastName?: string
          email?: string
        }) => ({
          _id: op._id,
          name:
            [op.firstName, op.lastName]
              .filter(Boolean)
              .join(' ')
              .trim() ||
            op.email ||
            'Opérateur',
          email: op.email,
        }))
      )
    } catch (err) {
      logger.error('Failed to fetch operators:', err, 'Admin')
    }
  }, [])

  /**
   * Fetch real courier options used by orders.
   */
  const fetchOrderFilterOptions =
    useCallback(async () => {
      try {
        const response =
          await api.get(
            '/api/admin/order-filter-options'
          )

        setCouriers(
          response.data?.couriers ||
          []
        )
      } catch (err) {
        logger.error(
          'Failed to fetch order filter options:',
          err,
          'Admin'
        )
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
        sortBy,
        sortOrder,
      })
      
      setAdminSummary(
        response.summary || null
      )

      setOrders(response.orders)
      setPagination(
        response.total,
        response.totalPages
      )
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch orders'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, filters, selectedShopId, sortBy, sortOrder, setOrders, setPagination, setLoading, setError])

  const handleSortChange = useCallback(
    (field: string, order: 'asc' | 'desc') => {
      setSortBy(field)
      setSortOrder(order)
      setCurrentPage(1)
    },
    [setCurrentPage]
  )

  // Fetch data on mount
  useEffect(() => {
    fetchShops()
    fetchOperators()
    fetchOrderFilterOptions()
  }, [
    fetchShops,
    fetchOperators,
    fetchOrderFilterOptions
  ])

  // Fetch orders when dependencies change
  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  /**
   * Handle order row click - opens detail panel
   */
  const handleOrderSelect = useCallback(
    async (order: Order) => {
      setSelectedOrder(order)
      setIsAdminActionsOpen(false)
      setIsDetailPanelOpen(true)

      try {
        const detailedOrder =
          await orderService.getOrderById(
            order._id
          )

        setSelectedOrder(
          detailedOrder
        )
      } catch (err) {
        logger.error(
          'Failed to fetch complete order detail:',
          err,
          'Admin'
        )
      }
    },
    []
  )

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
  const handleFiltersChange = useCallback(
    (newFilters: OrderFiltersType) => {
      /*
       * Le composant partagé OrderFilters force historiquement
       * status='confirmed' lors d'un changement de filtre IA.
       *
       * En Admin, le PDF exige des filtres combinables.
       * On conserve donc le statut choisi par l'Admin lorsqu'un
       * filtre IA change.
       */
      const aiFiltersChanged =
        JSON.stringify(
          newFilters.aiScoreRange
        ) !==
          JSON.stringify(
            filters.aiScoreRange
          ) ||
        newFilters.aiDecision !==
          filters.aiDecision ||
        newFilters.riskLevel !==
          filters.riskLevel

      const normalizedFilters =
        aiFiltersChanged
          ? {
              ...newFilters,
              status: filters.status,
            }
          : newFilters

      setFilters(
        normalizedFilters
      )
      setCurrentPage(1)
      clearSelection()
    },
    [
      filters,
      setFilters,
      setCurrentPage,
      clearSelection
    ]
  )

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

          {/* KPI réels - toutes les commandes filtrées */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">

            <div className="mb-4">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Supervision des commandes
              </h2>

              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                KPI calculés sur toutes les commandes correspondant aux filtres actifs.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-5 xl:grid-cols-10">

              {[
                ['Total', adminSummary?.total ?? 0],
                ['En attente', adminSummary?.pending ?? 0],
                ['Confirmées', adminSummary?.confirmed ?? 0],
                ['Expédiées', adminSummary?.shipped ?? 0],
                ['Dépôt', adminSummary?.at_depot ?? 0],
                ['En livraison', adminSummary?.out_for_delivery ?? 0],
                ['Livrées', adminSummary?.delivered ?? 0],
                ['Retournées', adminSummary?.returned ?? 0],
                ['Annulées', adminSummary?.cancelled ?? 0],
                ['Reportées', adminSummary?.postponed ?? 0],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-3 dark:border-slate-700 dark:bg-slate-800/60"
                >
                  <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400">
                    {label}
                  </p>

                  <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                    {value}
                  </p>
                </div>
              ))}

            </div>
          </div>


          {/* Filtres Admin complémentaires */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">

              <label className="space-y-1">
                <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                  Boutique
                </span>

                <select
                  value={selectedShopId}
                  onChange={(e) =>
                    handleShopFilterChange(
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
                  data-testid="shop-filter"
                >
                  <option value="">
                    Toutes les boutiques
                  </option>

                  {shops.map(shop => (
                    <option
                      key={shop._id}
                      value={shop._id}
                    >
                      {shop.name}
                    </option>
                  ))}
                </select>
              </label>


              <label className="space-y-1">
                <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                  Opérateur
                </span>

                <select
                  value={
                    filters.operatorId ||
                    ''
                  }
                  onChange={(e) =>
                    handleFiltersChange({
                      ...filters,
                      operatorId:
                        e.target.value ||
                        undefined,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
                >
                  <option value="">
                    Tous les opérateurs
                  </option>

                  {operators.map(operator => {
                    const fullName =
                      [
                        operator.firstName,
                        operator.lastName,
                      ]
                        .filter(Boolean)
                        .join(' ')
                        .trim()

                    return (
                      <option
                        key={operator._id}
                        value={operator._id}
                      >
                        {
                          operator.name ||
                          fullName ||
                          operator.email ||
                          operator._id
                        }
                      </option>
                    )
                  })}
                </select>
              </label>


              <label className="space-y-1">
                <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                  Transporteur
                </span>

                <select
                  value={
                    filters.courier ||
                    ''
                  }
                  onChange={(e) =>
                    handleFiltersChange({
                      ...filters,
                      courier:
                        e.target.value ||
                        undefined,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
                >
                  <option value="">
                    Tous les transporteurs
                  </option>

                  {couriers.map(courier => (
                    <option
                      key={courier._id}
                      value={courier._id}
                    >
                      {courier.name}
                    </option>
                  ))}
                </select>
              </label>


              <label className="space-y-1">
                <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                  Montant min.
                </span>

                <input
                  type="number"
                  min="0"
                  value={
                    filters.minAmount ??
                    ''
                  }
                  onChange={(e) =>
                    handleFiltersChange({
                      ...filters,
                      minAmount:
                        e.target.value === ''
                          ? undefined
                          : Number(
                              e.target.value
                            ),
                    })
                  }
                  placeholder="0"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
                />
              </label>


              <label className="space-y-1">
                <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                  Montant max.
                </span>

                <input
                  type="number"
                  min="0"
                  value={
                    filters.maxAmount ??
                    ''
                  }
                  onChange={(e) =>
                    handleFiltersChange({
                      ...filters,
                      maxAmount:
                        e.target.value === ''
                          ? undefined
                          : Number(
                              e.target.value
                            ),
                    })
                  }
                  placeholder="∞"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
                />
              </label>

            </div>

            <p className="mt-3 text-xs text-gray-500 dark:text-slate-400">
              Ces filtres se combinent avec Statut, Transporteur, Score IA, Période et Recherche.
            </p>

          </div>


          {/* Filters */}
          <OrderFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            showLegacyStatuses
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
              allowStatusUpdate={false}
            />
          )}

          {/* Orders Table with Shop Name Column */}
          <OrdersTable
            orders={orders}
            userRole="admin"
            subscriptionPlan="enterprise"
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
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
            onRetry={handleRetry}
          />

          {/* Même sidebar détaillée que Seller */}
          <OrderDetailPanel
            order={selectedOrder}
            isOpen={isDetailPanelOpen}
            showAdminContext
            onClose={handleCloseDetailPanel}
            onEdit={() => {
              setIsDetailPanelOpen(false)
              setIsAdminActionsOpen(true)
            }}
          />

          {/* Actions réservées à l'Admin */}
          <AdminOrderDetailPanel
            order={selectedOrder}
            isOpen={isAdminActionsOpen}
            onClose={() => {
              setIsAdminActionsOpen(false)

              if (selectedOrder) {
                setIsDetailPanelOpen(true)
              }
            }}
            operators={operators}
            onAssignOperator={handleAssignOperator}
            onStatusOverride={handleStatusOverride}
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
