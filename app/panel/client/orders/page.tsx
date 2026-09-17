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
import ImportOrdersModal from '@/components/orders/ImportOrdersModal'
import LogisticsExportModal from '@/components/orders/LogisticsExportModal'
import type { Order, OrderFilters as OrderFiltersType, OrderStatus, BulkResult } from '@/types/order'
import type { SubscriptionPlan } from '@/types/subscription'
import type { Product } from '@/types/product'
import { formatCurrency } from '@/lib/formatCurrency'

const TUNISIA_GOVERNORATES = [
  'Ariana',
  'Béja',
  'Ben Arous',
  'Bizerte',
  'Gabès',
  'Gafsa',
  'Jendouba',
  'Kairouan',
  'Kasserine',
  'Kébili',
  'Le Kef',
  'Mahdia',
  'La Manouba',
  'Médenine',
  'Monastir',
  'Nabeul',
  'Sfax',
  'Sidi Bouzid',
  'Siliana',
  'Sousse',
  'Tataouine',
  'Tozeur',
  'Tunis',
  'Zaghouan',
] as const

type ManualOrderItem = {
  productId: string
  name: string
  quantity: number
  price: number
  sku: string
  imageUrl: string
  deliveryFee: number
}

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
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false)

  // Manual order modal state
  const { t } = useLanguage()

  const [showManualModal, setShowManualModal] =
    useState(false)

  const [editingOrder, setEditingOrder] =
    useState<Order | null>(null)

  const [showImportModal, setShowImportModal] =
    useState(false)

  const [
    showLogisticsExportModal,
    setShowLogisticsExportModal
  ] = useState(false)

  const [manualSaving, setManualSaving] =
    useState(false)

  const [manualError, setManualError] =
    useState<string | null>(null)

  const [manualSuccess, setManualSuccess] =
    useState<string | null>(null)

  const [manualFormErrors, setManualFormErrors] =
    useState<Record<string, string>>({})

  const [showProductPicker, setShowProductPicker] =
    useState(false)

  const [shopProducts, setShopProducts] =
    useState<Product[]>([])

  const [productSearch, setProductSearch] =
    useState('')

  const [
    loadingShopProducts,
    setLoadingShopProducts
  ] = useState(false)

  const [
    shopProductsError,
    setShopProductsError
  ] = useState('')

  const [manualForm, setManualForm] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',

    // Adresse libre + gouvernorat.
    street: '',
    state: '',

    // Conservés pour l'édition des anciennes commandes.
    city: '',
    district: '',
    zipCode: '',
    country: '',

    secondaryPhone: '',
    deliveryFee: 0,

    items: [] as ManualOrderItem[],
  })

  const resetManualForm = () => {
    setManualForm({
      clientName: '',
      clientPhone: '',
      clientEmail: '',
      street: '',
      state: '',
      city: '',
      district: '',
      zipCode: '',
      country: '',
      secondaryPhone: '',
      deliveryFee: 0,
      items: [],
    })

    setManualFormErrors({})
    setManualError(null)
    setEditingOrder(null)
    setShowProductPicker(false)
    setProductSearch('')
  }

  /*
   * Charger le vrai catalogue de la boutique.
   *
   * useAuth ne contient volontairement pas shopId.
   * On récupère donc la boutique accessible exactement
   * comme le fait déjà la page Produits.
   */
  useEffect(() => {
    let cancelled = false

    const loadShopProducts = async () => {
      if (
        !showManualModal ||
        editingOrder
      ) {
        return
      }

      setLoadingShopProducts(true)
      setShopProductsError('')
      setShopProducts([])

      try {
        const shops =
          await orderService.getAccessibleShops()

        const shopId =
          shops[0]?._id || ''

        if (!shopId) {
          if (!cancelled) {
            setShopProductsError(
              'Aucune boutique active trouvée pour ce compte.'
            )
          }

          return
        }

        const products =
          await orderService.getShopProducts(
            shopId
          )

        if (!cancelled) {
          setShopProducts(
            products.filter(
              product =>
                product.isActive !== false
            )
          )
        }
      } catch {
        if (!cancelled) {
          setShopProducts([])

          setShopProductsError(
            'Impossible de charger le catalogue produits.'
          )
        }
      } finally {
        if (!cancelled) {
          setLoadingShopProducts(false)
        }
      }
    }

    loadShopProducts()

    return () => {
      cancelled = true
    }
  }, [
    showManualModal,
    editingOrder,
  ])

  const filteredShopProducts =
    shopProducts.filter(product => {
      const query =
        productSearch.trim().toLowerCase()

      if (!query) {
        return true
      }

      return [
        product.name,
        product.sku,
        product.category,
      ].some(value =>
        String(value || '')
          .toLowerCase()
          .includes(query)
      )
    })

  const manualSubtotal =
    manualForm.items.reduce(
      (sum, item) =>
        sum +
        item.quantity *
          item.price,
      0
    )

  const manualTotal =
    manualSubtotal +
    manualForm.deliveryFee

  const validateManualForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!manualForm.clientName.trim()) {
      errors.clientName =
        t('orders.customerNameRequired')
    }

    if (!manualForm.clientPhone.trim()) {
      errors.clientPhone =
        t('orders.customerPhoneRequired')
    }

    if (!editingOrder) {
      if (!manualForm.state) {
        errors.state =
          'Le gouvernorat est obligatoire.'
      }

      if (manualForm.items.length === 0) {
        errors.items =
          'Ajoutez au moins un article.'
      }

      const invalidItem =
        manualForm.items.some(
          item =>
            !item.productId ||
            item.quantity < 1 ||
            item.price < 0
        )

      if (invalidItem) {
        errors.items =
          'Vérifiez la quantité et le prix des articles.'
      }
    }

    setManualFormErrors(errors)

    return (
      Object.keys(errors).length === 0
    )
  }

  const addProductToManualOrder = (
    product: Product
  ) => {
    setManualForm(prev => {
      const existingIndex =
        prev.items.findIndex(
          item =>
            item.productId ===
            product._id
        )

      let items: ManualOrderItem[]

      if (existingIndex >= 0) {
        items = prev.items.map(
          (item, index) =>
            index === existingIndex
              ? {
                  ...item,
                  quantity:
                    item.quantity + 1,
                }
              : item
        )
      } else {
        items = [
          ...prev.items,
          {
            productId: product._id,
            name: product.name,
            quantity: 1,
            price: Number(
              product.price || 0
            ),
            sku: product.sku || '',
            imageUrl:
              product.imageUrl || '',
            deliveryFee: Number(
              product.deliveryFee || 0
            ),
          },
        ]
      }

      /*
       * La commande possède un seul frais de livraison :
       * valeur catalogue la plus élevée des produits.
       */
      const deliveryFee =
        items.length > 0
          ? Math.max(
              ...items.map(
                item =>
                  Number(
                    item.deliveryFee || 0
                  )
              )
            )
          : 0

      return {
        ...prev,
        items,
        deliveryFee,
      }
    })

    setManualFormErrors(prev => {
      const next = { ...prev }
      delete next.items
      return next
    })
  }

  const removeItem = (
    indexToRemove: number
  ) => {
    setManualForm(prev => {
      const items =
        prev.items.filter(
          (_, index) =>
            index !== indexToRemove
        )

      const deliveryFee =
        items.length > 0
          ? Math.max(
              ...items.map(
                item =>
                  Number(
                    item.deliveryFee || 0
                  )
              )
            )
          : 0

      return {
        ...prev,
        items,
        deliveryFee,
      }
    })
  }

  const updateItem = (
    indexToUpdate: number,
    field: 'quantity' | 'price',
    value: number
  ) => {
    setManualForm(prev => ({
      ...prev,
      items: prev.items.map(
        (item, index) =>
          index === indexToUpdate
            ? {
                ...item,
                [field]: value,
              }
            : item
      ),
    }))
  }

  const handleManualSubmit = async () => {
    if (!validateManualForm()) {
      return
    }

    setManualSaving(true)
    setManualError(null)

    try {
      /*
       * L'ancien bouton "Modifier commande"
       * continue à utiliser son endpoint dédié.
       */
      if (editingOrder) {
        await orderService.updateOrderDetails(
          editingOrder._id,
          {
            clientInfo: {
              name:
                manualForm.clientName,
              phone:
                manualForm.clientPhone,
              email:
                manualForm.clientEmail,
              address: {
                street:
                  manualForm.street,
                city:
                  manualForm.city,
                state:
                  manualForm.state,
                district:
                  manualForm.district,
                zipCode:
                  manualForm.zipCode,
                country:
                  manualForm.country,
              },
            },
          }
        )

        setManualSuccess(
          'Commande modifiée avec succès.'
        )

        setShowManualModal(false)
        resetManualForm()

        await fetchOrders()

        setTimeout(
          () =>
            setManualSuccess(null),
          3000
        )

        return
      }

      const payload: Parameters<
        typeof orderService.createOrder
      >[0] = {
        clientInfo: {
          name:
            manualForm.clientName.trim(),

          phone:
            manualForm.clientPhone.trim(),

          ...(manualForm.secondaryPhone.trim() && {
            additionalPhones: [
              manualForm.secondaryPhone.trim(),
            ],
          }),

          ...(manualForm.clientEmail.trim() && {
            email:
              manualForm.clientEmail.trim(),
          }),

          address: {
            state: manualForm.state,

            ...(manualForm.street.trim() && {
              street:
                manualForm.street.trim(),
            }),
          },
        },

        items:
          manualForm.items.map(
            item => ({
              productId:
                item.productId,
              quantity:
                item.quantity,
              price:
                item.price,
            })
          ),

        deliveryFee:
          manualForm.deliveryFee,
      }

      await orderService.createOrder(
        payload
      )

      setManualSuccess(
        t('orders.createSuccess')
      )

      setShowManualModal(false)
      resetManualForm()

      await fetchOrders()

      setTimeout(
        () => setManualSuccess(null),
        3000
      )
    } catch (err) {
      const error =
        err as {
          message?: string
          response?: {
            data?: {
              error?: string
            }
          }
        }

      setManualError(
        error.response?.data?.error ||
          error.message ||
          t('orders.failedCreate')
      )
    } finally {
      setManualSaving(false)
    }
  }

  const handleEditOrder = (
    order: Order
  ) => {
    const address =
      order.clientInfo?.address

    setEditingOrder(order)
    setManualError(null)
    setManualFormErrors({})

    setManualForm({
      clientName:
        order.clientInfo?.name || '',

      clientPhone:
        order.clientInfo?.phone || '',

      clientEmail:
        order.clientInfo?.email || '',

      street:
        address?.street || '',

      city:
        address?.city || '',

      state:
        address?.state || '',

      district:
        address?.district || '',

      zipCode:
        address?.zipCode || '',

      country:
        address?.country || '',

      secondaryPhone: '',
      deliveryFee: 0,
      items: [],
    })

    setIsDetailPanelOpen(false)

    setTimeout(() => {
      setShowManualModal(true)
    }, 350)
  }

  /**
   * Fetch orders from API
   * Requirements: 1.1 - Display paginated table
   */
  const fetchOrders = useCallback(async (
    autoSelectDisplayed = false
  ) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await orderService.getOrders({
        page: currentPage,
        limit: pageSize,
        filters,
        sortBy,
        sortOrder,
      })
      
      setOrders(response.orders)
      setPagination(
        response.total,
        response.totalPages
      )

      const hasActiveAiFilter =
        (
          filters.aiDecision !== undefined &&
          filters.aiDecision !== 'all'
        ) ||
        filters.aiScoreRange !== undefined ||
        (
          filters.riskLevel !== undefined &&
          filters.riskLevel !== 'all'
        )

      const visibleIds =
        response.orders.map(order => order._id)

      /*
       * Auto-select only when the displayed selection
       * context changes (filter/page/sort).
       *
       * Silent refreshes must preserve manual
       * deselections.
       */
      if (
        autoSelectDisplayed &&
        (
          filters.status === 'confirmed' ||
          hasActiveAiFilter
        )
      ) {
        setSelectedIds(visibleIds)
      } else {
        const selectedBeforeRefresh =
          useOrderStore.getState().selectedIds

        const visibleIdSet =
          new Set(visibleIds)

        setSelectedIds(
          selectedBeforeRefresh.filter(id =>
            visibleIdSet.has(id)
          )
        )
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch orders'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, filters, sortBy, sortOrder, setOrders, setPagination, setSelectedIds, setLoading, setError])

  const handleLogisticsExportSuccess =
    useCallback(async () => {
      /*
       * The backend has already persisted
       * confirmed -> shipped at this point.
       * Re-fetch immediately so exported rows disappear
       * from the Confirmed selection without refresh.
       */
      await fetchOrders()
    }, [fetchOrders])

  const handleSortChange = useCallback(
    (field: string, order: 'asc' | 'desc') => {
      setSortBy(field)
      setSortOrder(order)
      setCurrentPage(1)
    },
    [setCurrentPage]
  )

  // Fetch orders on mount and when dependencies change
  useEffect(() => {
    /*
     * A new filter/page/sort context automatically
     * selects the displayed confirmed results.
     */
    fetchOrders(true)
  }, [fetchOrders])

  /**
   * Refresh the current orders view immediately after a successful import.
   * Keeps the current filters, sorting and pagination unchanged.
   */
  const handleImportSuccess = useCallback(async () => {
    await fetchOrders()
  }, [fetchOrders])

  /**
   * Handle order row click - opens detail panel
   * Requirements: 4.1 - Display slide-over panel with complete order details
   */
  const handleOrderSelect = useCallback(async (order: Order) => {
    // Open immediately with the row data for responsiveness
    setSelectedOrder(order)
    setIsDetailPanelOpen(true)

    try {
      // Then replace it with the complete order detail from the API
      const fullOrder = await orderService.getOrderById(order._id)
      setSelectedOrder(fullOrder)
    } catch (error) {
      console.error('Failed to load complete order details:', error)
    }
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
  const _handleStatusUpdate = useCallback(
    async (
      status: OrderStatus,
      notes?: string
    ): Promise<void> => {
      if (!selectedOrder) return

      try {
        const updatedOrder =
          await orderService.updateOrderStatus(
            selectedOrder._id,
            status,
            notes
          )

        updateOrder(updatedOrder)
        setSelectedOrder(updatedOrder)

        /*
         * Re-fetch using the active server-side filter.
         * A status change must immediately move the order
         * out of its previous filtered list.
         */
        await fetchOrders()
      } catch (err) {
        console.error(
          'Failed to update order status:',
          err
        )
        throw err
      }
    },
    [
      selectedOrder,
      updateOrder,
      fetchOrders,
    ]
  )

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
      <div className="-mt-2 flex h-[calc(100dvh-5.5rem)] min-h-0 w-full flex-col gap-2 overflow-hidden sm:h-[calc(100dvh-6.5rem)]">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {t('orders.title')}
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-lg shadow-green-500/25"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {t('import.button')}
            </button>
            <button
              onClick={() => setShowLogisticsExportModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors shadow-lg shadow-purple-500/25"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Export Logistique
            </button>
            <button
              onClick={() => setShowManualModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/25"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
              {t('orders.addManual')}
            </button>
            <div className="text-xs text-gray-500 dark:text-slate-400">
              {totalOrders} {totalOrders > 1 ? 'commandes' : 'commande'} au total
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
          className="shrink-0"
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
          className="min-h-0 flex-1 [&_th]:py-1 [&_td]:py-1"
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
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          onRetry={handleRetry}
        />

        {/* Order Detail Panel - Requirements: 4.1, 4.2, 4.3, 4.4 */}
        <OrderDetailPanel
          order={selectedOrder}
          isOpen={isDetailPanelOpen}
          onClose={handleCloseDetailPanel}
          onEdit={
            selectedOrder
              ? () => handleEditOrder(selectedOrder)
              : undefined
          }
        />

        {/* Import Orders Modal */}
        <ImportOrdersModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImportSuccess={handleImportSuccess}
        />

        {/* Logistics Export Modal */}
        <LogisticsExportModal
          isOpen={showLogisticsExportModal}
          onClose={() =>
            setShowLogisticsExportModal(false)
          }
          orderIds={selectedIds}
          onExportSuccess={
            handleLogisticsExportSuccess
          }
        />

        {/* Manual Order Modal */}
        {showManualModal && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm dark:bg-black/60">
            <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-5 dark:border-slate-700 dark:bg-slate-900">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {editingOrder
                      ? `Modifier la commande #${editingOrder.confirmedId}`
                      : 'Ajouter une commande manuelle'}
                  </h2>

                  {!editingOrder && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                      Renseignez le client puis sélectionnez les articles depuis votre catalogue.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowManualModal(false)
                    resetManualForm()
                  }}
                  className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  aria-label="Fermer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-6 p-6">
                {manualError && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">
                    {manualError}
                  </div>
                )}

                {editingOrder ? (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-900 dark:text-white">
                          Nom du client *
                        </label>

                        <input
                          type="text"
                          value={manualForm.clientName}
                          onChange={event =>
                            setManualForm(prev => ({
                              ...prev,
                              clientName:
                                event.target.value,
                            }))
                          }
                          className={`w-full rounded-xl border-2 bg-gray-50 px-4 py-2.5 text-gray-900 outline-none transition-all dark:bg-slate-800 dark:text-white ${
                            manualFormErrors.clientName
                              ? 'border-red-500'
                              : 'border-gray-300 focus:border-blue-500 dark:border-slate-600'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-900 dark:text-white">
                          Numéro de téléphone *
                        </label>

                        <input
                          type="tel"
                          value={manualForm.clientPhone}
                          onChange={event =>
                            setManualForm(prev => ({
                              ...prev,
                              clientPhone:
                                event.target.value,
                            }))
                          }
                          className={`w-full rounded-xl border-2 bg-gray-50 px-4 py-2.5 text-gray-900 outline-none transition-all dark:bg-slate-800 dark:text-white ${
                            manualFormErrors.clientPhone
                              ? 'border-red-500'
                              : 'border-gray-300 focus:border-blue-500 dark:border-slate-600'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-900 dark:text-white">
                        Email
                      </label>

                      <input
                        type="email"
                        value={manualForm.clientEmail}
                        onChange={event =>
                          setManualForm(prev => ({
                            ...prev,
                            clientEmail:
                              event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border-2 border-gray-300 bg-gray-50 px-4 py-2.5 text-gray-900 outline-none transition-all focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-900 dark:text-white">
                        Adresse
                      </label>

                      <input
                        type="text"
                        value={manualForm.street}
                        onChange={event =>
                          setManualForm(prev => ({
                            ...prev,
                            street:
                              event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border-2 border-gray-300 bg-gray-50 px-4 py-2.5 text-gray-900 outline-none transition-all focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* 1. NOM */}
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-gray-900 dark:text-white">
                        1. Nom du client *
                      </label>

                      <input
                        type="text"
                        value={manualForm.clientName}
                        onChange={event =>
                          setManualForm(prev => ({
                            ...prev,
                            clientName:
                              event.target.value,
                          }))
                        }
                        placeholder="Nom et prénom"
                        className={`w-full rounded-xl border-2 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition-all dark:bg-slate-800 dark:text-white ${
                          manualFormErrors.clientName
                            ? 'border-red-500'
                            : 'border-gray-300 focus:border-blue-500 dark:border-slate-600'
                        }`}
                      />

                      {manualFormErrors.clientName && (
                        <p className="mt-1 text-xs text-red-500">
                          {manualFormErrors.clientName}
                        </p>
                      )}
                    </div>

                    {/* 2. PHONE */}
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-gray-900 dark:text-white">
                        2. Numéro de téléphone *
                      </label>

                      <input
                        type="tel"
                        value={manualForm.clientPhone}
                        onChange={event =>
                          setManualForm(prev => ({
                            ...prev,
                            clientPhone:
                              event.target.value,
                          }))
                        }
                        placeholder="Ex. 20 000 000"
                        className={`w-full rounded-xl border-2 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition-all dark:bg-slate-800 dark:text-white ${
                          manualFormErrors.clientPhone
                            ? 'border-red-500'
                            : 'border-gray-300 focus:border-blue-500 dark:border-slate-600'
                        }`}
                      />

                      {manualFormErrors.clientPhone && (
                        <p className="mt-1 text-xs text-red-500">
                          {manualFormErrors.clientPhone}
                        </p>
                      )}
                    </div>

                    {/* 3. GOVERNORATE */}
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <label className="text-sm font-semibold text-gray-900 dark:text-white">
                          3. Gouvernorat *
                        </label>

                        {manualForm.state && (
                          <span className="text-xs font-medium text-blue-500">
                            {manualForm.state}
                          </span>
                        )}
                      </div>

                      <div
                        className={`grid grid-cols-2 gap-2 rounded-xl border-2 p-3 sm:grid-cols-3 md:grid-cols-4 ${
                          manualFormErrors.state
                            ? 'border-red-500'
                            : 'border-gray-200 dark:border-slate-700'
                        }`}
                      >
                        {TUNISIA_GOVERNORATES.map(
                          governorate => {
                            const selected =
                              manualForm.state ===
                              governorate

                            return (
                              <button
                                key={governorate}
                                type="button"
                                onClick={() => {
                                  setManualForm(prev => ({
                                    ...prev,
                                    state: governorate,
                                  }))

                                  setManualFormErrors(
                                    prev => {
                                      const next = {
                                        ...prev,
                                      }

                                      delete next.state

                                      return next
                                    }
                                  )
                                }}
                                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                                  selected
                                    ? 'border-blue-500 bg-blue-500 text-white shadow-sm'
                                    : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-blue-400 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:bg-slate-700'
                                }`}
                              >
                                {governorate}
                              </button>
                            )
                          }
                        )}
                      </div>

                      {manualFormErrors.state && (
                        <p className="mt-1 text-xs text-red-500">
                          {manualFormErrors.state}
                        </p>
                      )}
                    </div>

                    {/* 4. ADDRESS */}
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-gray-900 dark:text-white">
                        4. Adresse
                        <span className="ml-2 font-normal text-gray-400">
                          optionnel
                        </span>
                      </label>

                      <input
                        type="text"
                        value={manualForm.street}
                        onChange={event =>
                          setManualForm(prev => ({
                            ...prev,
                            street:
                              event.target.value,
                          }))
                        }
                        placeholder="Rue, résidence, numéro..."
                        className="w-full rounded-xl border-2 border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition-all focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      />
                    </div>

                    {/* 5. ITEMS */}
                    <div>
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                            5. Articles *
                          </label>

                          <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                            Sélectionnez les produits déjà créés dans votre catalogue.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setShowProductPicker(
                              value => !value
                            )
                          }
                          className="shrink-0 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
                        >
                          + Ajouter un article
                        </button>
                      </div>

                      {manualFormErrors.items && (
                        <p className="mb-2 text-xs text-red-500">
                          {manualFormErrors.items}
                        </p>
                      )}

                      {showProductPicker && (
                        <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                          <div className="mb-3 flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                Catalogue produits
                              </p>

                              <p className="text-xs text-gray-500 dark:text-slate-400">
                                Cliquez sur un produit pour l&apos;ajouter.
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setShowProductPicker(
                                  false
                                )
                              }
                              className="text-sm text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white"
                            >
                              Fermer
                            </button>
                          </div>

                          <div className="mb-3">
                            <div className="relative">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
                                />
                              </svg>

                              <input
                                type="search"
                                value={productSearch}
                                onChange={event =>
                                  setProductSearch(
                                    event.target.value
                                  )
                                }
                                placeholder="Rechercher un produit, SKU ou catégorie..."
                                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-9 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
                              />

                              {productSearch && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setProductSearch('')
                                  }
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-white"
                                  aria-label="Effacer la recherche"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          </div>

                          {loadingShopProducts ? (
                            <div className="py-8 text-center text-sm text-gray-500 dark:text-slate-400">
                              Chargement du catalogue...
                            </div>
                          ) : shopProductsError ? (
                            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">
                              {shopProductsError}
                            </div>
                          ) : shopProducts.length === 0 ? (
                            <div className="py-8 text-center text-sm text-gray-500 dark:text-slate-400">
                              Aucun produit disponible.
                            </div>
                          ) : filteredShopProducts.length === 0 ? (
                            <div className="py-8 text-center text-sm text-gray-500 dark:text-slate-400">
                              Aucun produit ne correspond à votre recherche.
                            </div>
                          ) : (
                            <div className="grid max-h-[360px] grid-cols-2 gap-3 overflow-y-auto pr-1 md:grid-cols-3">
                              {filteredShopProducts.map(product => {
                                const alreadyAdded =
                                  manualForm.items.find(
                                    item =>
                                      item.productId ===
                                      product._id
                                  )

                                return (
                                  <button
                                    key={product._id}
                                    type="button"
                                    onClick={() =>
                                      addProductToManualOrder(
                                        product
                                      )
                                    }
                                    className="overflow-hidden rounded-xl border border-gray-200 bg-white text-left transition-all hover:-translate-y-0.5 hover:border-blue-500 hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
                                  >
                                    <div
                                      className="flex h-28 items-center justify-center bg-gray-100 bg-contain bg-center bg-no-repeat dark:bg-slate-800"
                                      style={
                                        product.imageUrl
                                          ? {
                                              backgroundImage: `url("${product.imageUrl}")`,
                                            }
                                          : undefined
                                      }
                                    >
                                      {!product.imageUrl && (
                                        <span className="text-xs text-gray-400">
                                          Sans image
                                        </span>
                                      )}
                                    </div>

                                    <div className="p-3">
                                      <p className="line-clamp-2 text-sm font-semibold text-gray-900 dark:text-white">
                                        {product.name}
                                      </p>

                                      <div className="mt-2 flex items-center justify-between gap-2">
                                        <span className="text-sm font-bold text-blue-500">
                                          {formatCurrency(
                                            Number(
                                              product.price ||
                                                0
                                            )
                                          )}
                                        </span>

                                        {alreadyAdded && (
                                          <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[11px] font-semibold text-green-600 dark:text-green-400">
                                            ×
                                            {
                                              alreadyAdded.quantity
                                            }
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {manualForm.items.length > 0 && (
                        <div className="space-y-3">
                          {manualForm.items.map(
                            (item, index) => (
                              <div
                                key={item.productId}
                                className="rounded-xl border border-gray-200 p-4 dark:border-slate-700"
                              >
                                <div className="flex gap-3">
                                  <div
                                    className="h-16 w-16 shrink-0 rounded-lg bg-gray-100 bg-contain bg-center bg-no-repeat dark:bg-slate-800"
                                    style={
                                      item.imageUrl
                                        ? {
                                            backgroundImage: `url("${item.imageUrl}")`,
                                          }
                                        : undefined
                                    }
                                  />

                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                      <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">
                                          {item.name}
                                        </p>

                                        {item.sku && (
                                          <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                                            SKU: {item.sku}
                                          </p>
                                        )}
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeItem(
                                            index
                                          )
                                        }
                                        className="text-sm font-medium text-red-500 hover:text-red-600"
                                      >
                                        Supprimer
                                      </button>
                                    </div>

                                    <div className="mt-3 grid grid-cols-3 gap-3">
                                      <div>
                                        <label className="mb-1 block text-xs text-gray-500 dark:text-slate-400">
                                          Quantité
                                        </label>

                                        <input
                                          type="number"
                                          min="1"
                                          value={
                                            item.quantity
                                          }
                                          onChange={event =>
                                            updateItem(
                                              index,
                                              'quantity',
                                              Math.max(
                                                1,
                                                parseInt(
                                                  event
                                                    .target
                                                    .value,
                                                  10
                                                ) || 1
                                              )
                                            )
                                          }
                                          className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                        />
                                      </div>

                                      <div>
                                        <label className="mb-1 block text-xs text-gray-500 dark:text-slate-400">
                                          Prix
                                        </label>

                                        <input
                                          type="number"
                                          min="0"
                                          step="0.001"
                                          value={item.price}
                                          onChange={event =>
                                            updateItem(
                                              index,
                                              'price',
                                              Math.max(
                                                0,
                                                parseFloat(
                                                  event
                                                    .target
                                                    .value
                                                ) || 0
                                              )
                                            )
                                          }
                                          className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                        />
                                      </div>

                                      <div>
                                        <label className="mb-1 block text-xs text-gray-500 dark:text-slate-400">
                                          Montant
                                        </label>

                                        <div className="flex h-[38px] items-center rounded-lg bg-gray-100 px-3 text-sm font-semibold text-gray-900 dark:bg-slate-800 dark:text-white">
                                          {formatCurrency(
                                            item.quantity *
                                              item.price
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>

                    {/* 6. DELIVERY FEE */}
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-gray-900 dark:text-white">
                        6. Frais de livraison
                      </label>

                      <p className="mb-2 text-xs text-gray-500 dark:text-slate-400">
                        Récupérés automatiquement depuis le catalogue. Vous pouvez les modifier.
                      </p>

                      <div className="relative max-w-xs">
                        <input
                          type="number"
                          min="0"
                          step="0.001"
                          value={manualForm.deliveryFee}
                          onChange={event =>
                            setManualForm(prev => ({
                              ...prev,
                              deliveryFee:
                                Math.max(
                                  0,
                                  parseFloat(
                                    event.target.value
                                  ) || 0
                                ),
                            }))
                          }
                          className="w-full rounded-xl border-2 border-gray-300 bg-gray-50 px-4 py-3 pr-14 text-gray-900 outline-none transition-all focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                        />

                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                          TND
                        </span>
                      </div>
                    </div>

                    {/* 7. TOTAL */}
                    <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            7. Total de la commande
                          </p>

                          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                            Produits {formatCurrency(manualSubtotal)} + livraison {formatCurrency(manualForm.deliveryFee)}
                          </p>
                        </div>

                        <p className="text-2xl font-bold text-blue-500">
                          {formatCurrency(
                            manualTotal
                          )}
                        </p>
                      </div>
                    </div>

                    {/* 8. EMAIL */}
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-gray-900 dark:text-white">
                        8. Email
                        <span className="ml-2 font-normal text-gray-400">
                          optionnel
                        </span>
                      </label>

                      <input
                        type="email"
                        value={manualForm.clientEmail}
                        onChange={event =>
                          setManualForm(prev => ({
                            ...prev,
                            clientEmail:
                              event.target.value,
                          }))
                        }
                        placeholder="client@email.com"
                        className="w-full rounded-xl border-2 border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition-all focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      />
                    </div>

                    {/* 9. SECOND PHONE */}
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-gray-900 dark:text-white">
                        9. Deuxième numéro de téléphone
                        <span className="ml-2 font-normal text-gray-400">
                          optionnel
                        </span>
                      </label>

                      <input
                        type="tel"
                        value={manualForm.secondaryPhone}
                        onChange={event =>
                          setManualForm(prev => ({
                            ...prev,
                            secondaryPhone:
                              event.target.value,
                          }))
                        }
                        placeholder="Téléphone secondaire"
                        className="w-full rounded-xl border-2 border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition-all focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="sticky bottom-0 flex gap-3 border-t border-gray-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => {
                    setShowManualModal(false)
                    resetManualForm()
                  }}
                  className="flex-1 rounded-xl border-2 border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 transition-opacity hover:opacity-80 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  Annuler
                </button>

                <button
                  type="button"
                  onClick={handleManualSubmit}
                  disabled={manualSaving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {manualSaving ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Enregistrement...
                    </>
                  ) : editingOrder ? (
                    'Enregistrer les modifications'
                  ) : (
                    'Créer la commande'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}
