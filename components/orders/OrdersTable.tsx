'use client'

import React, { useCallback, useMemo } from 'react'
import { clsx } from 'clsx'
import { Package } from 'lucide-react'
import Image from 'next/image'
import type { Order } from '@/types/order'
import { SubscriptionPlan, hasFeatureAccess } from '@/types/subscription'
import StatusBadge from '@/components/ui/StatusBadge'
import AIScoreColumn from '@/components/orders/AIScoreColumn'
import { useLanguage } from '@/hooks/useLanguage'
import { TranslationKey } from '@/lib/i18n'
import { formatCurrency } from '@/lib/formatCurrency'
import { canDisplayOrderAI } from '@/lib/orderStatus'
import { getDeliveryStatusDisplayLabel } from '@/services/deliveryTrackingService'

/**
 * OrdersTable Component
 * Primary data table component with configurable columns based on subscription tier
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 3.1, 3.2
 */

export interface OrdersTableProps {
  orders: Order[]
  userRole: 'seller' | 'operator' | 'admin'
  subscriptionPlan: SubscriptionPlan
  selectedIds: string[]
  isLoading?: boolean
  error?: string | null
  currentPage: number
  totalPages: number
  pageSize: number
  totalOrders: number
  onOrderSelect: (order: Order) => void
  onSelectionChange: (selectedIds: string[]) => void
  onPageChange: (page: number) => void
  sortBy: string
  sortOrder: 'asc' | 'desc'
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  onRetry?: () => void
  className?: string
}

/**
 * Column configuration for the orders table
 */
export interface ColumnConfig {
  key: string
  label: string
  minPlan: SubscriptionPlan | null // null means available to all plans
  render: (order: Order) => React.ReactNode
  className?: string
}

/**
 * Get visible columns based on subscription plan
 * Property 1: Subscription tier determines visible columns
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4
 */
export function getVisibleColumns(
  subscriptionPlan: SubscriptionPlan,
  allColumns: ColumnConfig[]
): ColumnConfig[] {
  return allColumns.filter((column) => {
    if (column.minPlan === null) {
      return true
    }
    return hasFeatureAccess(subscriptionPlan, column.minPlan)
  })
}

/**
 * Select all orders - returns all order IDs from the current filtered view
 * Property 7: Select all captures all filtered orders
 * Validates: Requirements 3.2
 */
export function selectAllOrders(orders: Order[]): string[] {
  return orders.map((order) => order._id)
}

/**
 * Checkbox component for row selection
 */
function Checkbox({
  checked,
  indeterminate,
  onChange,
  className,
  'aria-label': ariaLabel,
}: {
  checked: boolean
  indeterminate?: boolean
  onChange: (checked: boolean) => void
  className?: string
  'aria-label'?: string
}) {
  const ref = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate || false
    }
  }, [indeterminate])

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className={clsx(
        'h-4 w-4 rounded border-gray-300 dark:border-slate-600',
        'text-[#ADFF2F] focus:ring-[#ADFF2F]/50',
        'bg-white dark:bg-slate-800',
        className
      )}
      aria-label={ariaLabel}
    />
  )
}

/**
 * Skeleton loading row component
 */
function SkeletonRow({ columnCount }: { columnCount: number }) {
  return (
    <tr className="animate-pulse">
      <td className="px-2 py-3">
        <div className="h-4 w-4 bg-gray-200 dark:bg-slate-700 rounded" />
      </td>
      {Array.from({ length: columnCount }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
        </td>
      ))}
    </tr>
  )
}

/**
 * Error state component
 */
function ErrorState({
  error,
  onRetry,
  retryLabel,
}: {
  error: string
  onRetry?: () => void
  retryLabel: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <svg
        className="w-12 h-12 text-red-500 mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <p className="text-gray-600 dark:text-slate-400 text-center mb-4">{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className={clsx(
            'px-4 py-2 rounded-lg font-medium text-sm',
            'bg-[#ADFF2F] text-gray-900 hover:bg-[#9AE62A]',
            'transition-colors duration-200'
          )}
          data-testid="retry-button"
        >
          {retryLabel}
        </button>
      )}
    </div>
  )
}


/**
 * Empty state component
 */
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <svg
        className="w-12 h-12 text-gray-400 dark:text-slate-500 mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
      <p className="text-gray-600 dark:text-slate-400 text-center">
        {message}
      </p>
    </div>
  )
}

/**
 * Pagination component
 */
function Pagination({
  currentPage,
  totalPages,
  totalOrders,
  pageSize,
  onPageChange,
  labels,
}: {
  currentPage: number
  totalPages: number
  totalOrders: number
  pageSize: number
  onPageChange: (page: number) => void
  labels: { showing: string; to: string; of: string; page: string; previous: string; next: string }
}) {
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalOrders)

  return (
    <div className="shrink-0 flex flex-col sm:flex-row items-center justify-between px-3 py-1.5 gap-1.5 border-t border-gray-200 dark:border-slate-700">
      <div className="text-xs text-gray-600 dark:text-slate-400">
        {labels.showing} {startItem} {labels.to} {endItem} {labels.of} {totalOrders}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={clsx(
            'px-2.5 py-0.5 rounded-md text-xs font-medium',
            'border border-gray-300 dark:border-slate-600',
            currentPage <= 1
              ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-slate-800'
              : 'bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700',
            'text-gray-700 dark:text-slate-300',
            'transition-colors duration-200'
          )}
          data-testid="prev-page-button"
        >
          {labels.previous}
        </button>
        <span className="text-xs text-gray-600 dark:text-slate-400">
          {labels.page} {currentPage} {labels.of} {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={clsx(
            'px-2.5 py-0.5 rounded-md text-xs font-medium',
            'border border-gray-300 dark:border-slate-600',
            currentPage >= totalPages
              ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-slate-800'
              : 'bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700',
            'text-gray-700 dark:text-slate-300',
            'transition-colors duration-200'
          )}
          data-testid="next-page-button"
        >
          {labels.next}
        </button>
      </div>
    </div>
  )
}


/**
 * Clean imported product names before displaying them in the table.
 */
function cleanProductName(name?: string): string {
  if (!name || name.trim().toLowerCase() === 'null') {
    return 'Produit sans nom'
  }

  return name
    .replace(
      /\s*\(?[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\)?/gi,
      ''
    )
    .replace(/\s+x\s*\d+\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Define all available columns with their tier requirements
 */
function createColumnConfigs(t: (key: TranslationKey) => string): ColumnConfig[] {
  return [
    {
      key: 'orderId',
      label: t('orders.orderId'),
      minPlan: null,
      render: (order) => (
        <span className="whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
          {order.confirmedId ? `#${order.confirmedId}` : '—'}
        </span>
      ),
    },
    {
      key: 'products',
      label: t('orders.products'),
      minPlan: null,
      render: (order) => (
        <div className="w-full max-w-[190px] space-y-1">
          {order.items?.length ? (
            order.items.map((item, index) => {
              const quantity =
                Number.isFinite(item.quantity) && item.quantity > 0
                  ? item.quantity
                  : 1

              const populatedProduct =
                typeof item.productId === 'object'
                  ? item.productId
                  : null

              const imageUrl = populatedProduct?.imageUrl
              const productName = cleanProductName(
                item.name || populatedProduct?.name
              )

              const productKey =
                typeof item.productId === 'string'
                  ? item.productId
                  : item.productId?._id || `product-${index}`

              return (
                <div
                  key={`${productKey}-${index}`}
                  className="flex min-w-0 items-center gap-2"
                  title={productName}
                >
                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100 dark:border-slate-700 dark:bg-slate-800">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={productName}
                        width={40}
                        height={40}
                        className="h-full w-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-500 dark:bg-slate-700 dark:text-slate-300">
                        <Package className="h-5 w-5" aria-hidden="true" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-gray-700 dark:text-slate-300">
                      {productName}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-slate-400">
                      ×{quantity}
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <span className="text-gray-500 dark:text-slate-400">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'customer',
      label: t('orders.customer'),
      minPlan: null,
      render: (order) => (
        <span className="block max-w-[120px] truncate text-gray-700 dark:text-slate-300" title={order.clientInfo.name}>
          {order.clientInfo.name}
        </span>
      ),
    },
    {
      key: 'phone',
      label: t('orders.phone'),
      minPlan: null,
      render: (order) => (
        <span className="text-xs text-gray-600 dark:text-slate-400">
          {order.clientInfo.phone}
        </span>
      ),
    },
    {
      key: 'status',
      label: t('orders.status'),
      minPlan: null,
      render: (order) => (
        <div className="flex flex-col items-start gap-1">
          <StatusBadge status={order.status} size="sm" />

          {order.externalStatus && (
            <span className="text-xs capitalize text-blue-500">
              {order.externalStatus.platform}:{' '}
              {order.externalStatus.label ||
                order.externalStatus.code}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'aiScore',
      label: t('orders.aiScore'),
      minPlan: null,
      render: (order) => {
        if (
          !canDisplayOrderAI(order.status) ||
          order.aiScore === undefined ||
          order.aiScore === null
        ) {
          return (
            <span className="text-sm font-medium text-gray-400 dark:text-slate-500">
              —
            </span>
          )
        }

        return (
          <AIScoreColumn
            score={order.aiScore}
            showDetails={true}
            size="sm"
          />
        )
      },
    },
    {
      key: 'delivery',
      label: 'Livraison',
      minPlan: null,
      render: (order) => {
        const shipment =
          order.deliveryShipment

        const provider =
          shipment?.provider ||
          order.deliveryInfo?.carrier ||
          ''

        const tracking =
          shipment?.externalId ||
          order.deliveryInfo?.trackingNumber ||
          ''

        if (!provider) {
          return (
            <span className="text-xs text-gray-400 dark:text-slate-500">
              Non expédiée
            </span>
          )
        }

        const providerNames: Record<string, string> = {
          colissimo: 'Colissimo',
          intigo: 'Intigo',
          aramex: 'Aramex',
          rapid_poste: 'Rapid Poste',
          dhl: 'DHL',
          fedex: 'FedEx',
        }

        const stateNames: Record<string, string> = {
          preparing: 'Préparation',
          dispatching: 'Envoi en cours',
          created: 'Colis créé',
          failed: 'Échec',
          cancelled: 'Annulé',
          reconcile_required: 'À vérifier',
        }

        const providerKey =
          String(provider)
            .trim()
            .toLowerCase()

        const deliveryStatusLabel =
          shipment?.state
            ? getDeliveryStatusDisplayLabel(
                shipment.provider,
                shipment.providerStatusCode,
                shipment.providerStatusLabel
              ) ||
              stateNames[shipment.state] ||
              shipment.state
            : null

        const deliveryStatusClass =
          order.status === 'delivered'
            ? 'mt-0.5 text-xs text-green-500'
            : [
                  'cancelled',
                  'rejected',
                  'failed_delivery',
                ].includes(order.status)
              ? 'mt-0.5 text-xs text-red-500'
              : order.status === 'shipped'
                ? 'mt-0.5 text-xs text-blue-500'
                : 'mt-0.5 text-xs text-gray-500 dark:text-slate-400'

        return (
          <div className="min-w-0 max-w-[125px]">
            <div className="font-semibold text-gray-900 dark:text-white">
              {providerNames[providerKey] || provider}
            </div>

            {deliveryStatusLabel && (
              <div className={deliveryStatusClass}>
                {deliveryStatusLabel}
              </div>
            )}

            {tracking && (
              <div
                className="mt-0.5 max-w-[120px] truncate text-xs font-mono text-gray-500 dark:text-slate-400"
                title={String(tracking)}
              >
                N° {tracking}
              </div>
            )}
          </div>
        )
      },
    },

    {
      key: 'value',
      label: t('orders.value'),
      minPlan: null,
      render: (order) => (
        <span className="whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
          {formatCurrency(order.totalAmount)}
        </span>
      ),
      className: 'text-right',
    },
  ]
}


export default function OrdersTable({
  orders,
  subscriptionPlan,
  selectedIds,
  isLoading = false,
  error = null,
  currentPage,
  totalPages,
  pageSize,
  totalOrders,
  onOrderSelect,
  onSelectionChange,
  onPageChange,
  sortBy,
  sortOrder,
  onSortChange,
  onRetry,
  className,
}: OrdersTableProps) {
  const { t } = useLanguage()
  
  // Get all column configurations
  const allColumns = useMemo(() => createColumnConfigs(t), [t])

  // Filter columns based on subscription plan
  const visibleColumns = useMemo(
    () => getVisibleColumns(subscriptionPlan, allColumns),
    [subscriptionPlan, allColumns]
  )

  // Selection state helpers
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const allSelected = orders.length > 0 && orders.every((o) => selectedSet.has(o._id))
  const someSelected = orders.some((o) => selectedSet.has(o._id)) && !allSelected

  // Handle header checkbox change (select all / deselect all)
  const handleSelectAllChange = useCallback(
    (checked: boolean) => {
      if (checked) {
        // Select all orders in current view
        const allIds = selectAllOrders(orders)
        onSelectionChange(allIds)
      } else {
        // Deselect all
        onSelectionChange([])
      }
    },
    [orders, onSelectionChange]
  )

  // Handle individual row checkbox change
  const handleRowSelectionChange = useCallback(
    (orderId: string, checked: boolean) => {
      if (checked) {
        onSelectionChange([...selectedIds, orderId])
      } else {
        onSelectionChange(selectedIds.filter((id) => id !== orderId))
      }
    },
    [selectedIds, onSelectionChange]
  )

  // Handle row click (for order detail)
  const handleRowClick = useCallback(
    (order: Order, event: React.MouseEvent) => {
      // Don't trigger if clicking on checkbox
      if ((event.target as HTMLElement).closest('input[type="checkbox"]')) {
        return
      }
      onOrderSelect(order)
    },
    [onOrderSelect]
  )

  // Render error state
  if (error && !isLoading) {
    return (
      <div className={clsx('bg-white dark:bg-slate-800 rounded-lg shadow', className)}>
        <ErrorState error={error} onRetry={onRetry} retryLabel={t('orders.retry')} />
      </div>
    )
  }

  // Render empty state
  if (!isLoading && orders.length === 0) {
    return (
      <div className={clsx('bg-white dark:bg-slate-800 rounded-lg shadow', className)}>
        <EmptyState message={t('orders.noOrders')} />
      </div>
    )
  }

  return (
    <div
      className={clsx(
        'flex min-h-0 flex-col bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden',
        className
      )}
    >
      {/*
       * Fixed-height order list.
       *
       * Only this area scrolls. Pagination remains outside
       * and therefore always visible.
       */}
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full divide-y divide-gray-200 dark:divide-slate-700">
          <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-slate-900">
            <tr>
              {/* Checkbox column */}
              <th className="w-9 px-2 py-3">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={handleSelectAllChange}
                  aria-label={t('orders.selectAll')}
                />
              </th>
              {/* Data columns */}
              {visibleColumns.map((column) => {
                const sortableFields: Record<string, string> = {
                  orderId: 'confirmedId',
                  status: 'status',
                  aiScore: 'aiScore',
                  value: 'totalAmount',
                }

                const apiSortField = sortableFields[column.key]
                const isSortable = Boolean(apiSortField)
                const isActive = sortBy === apiSortField

                const handleHeaderClick = () => {
                  if (!apiSortField) return

                  onSortChange(
                    apiSortField,
                    isActive && sortOrder === 'asc' ? 'desc' : 'asc'
                  )
                }

                return (
                  <th
                    key={column.key}
                    className={clsx(
                      'px-2.5 py-3 text-left text-xs font-medium',
                      'text-gray-500 dark:text-slate-400 uppercase tracking-wider',
                      isSortable && 'cursor-pointer select-none hover:text-gray-800 dark:hover:text-white',
                      column.className
                    )}
                    onClick={handleHeaderClick}
                    aria-sort={
                      isActive
                        ? sortOrder === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : undefined
                    }
                  >
                    <span className="inline-flex items-center gap-1">
                      {column.label}
                      {isSortable && (
                        <span className="text-[10px]">
                          {isActive ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
                        </span>
                      )}
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
            {isLoading ? (
              // Skeleton loading rows
              Array.from({ length: pageSize }).map((_, i) => (
                <SkeletonRow key={i} columnCount={visibleColumns.length} />
              ))
            ) : (
              // Data rows
              orders.map((order) => (
                <tr
                  key={order._id}
                  onClick={(e) => handleRowClick(order, e)}
                  className={clsx(
                    'cursor-pointer transition-colors duration-150',
                    selectedSet.has(order._id)
                      ? 'bg-[#ADFF2F]/10 dark:bg-[#ADFF2F]/5'
                      : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'
                  )}
                  data-testid={`order-row-${order._id}`}
                >
                  {/* Checkbox cell */}
                  <td className="px-2 py-3">
                    <Checkbox
                      checked={selectedSet.has(order._id)}
                      onChange={(checked) => handleRowSelectionChange(order._id, checked)}
                      aria-label={`${t('orders.selectOrder')} #${order.confirmedId}`}
                    />
                  </td>
                  {/* Data cells */}
                  {visibleColumns.map((column) => (
                    <td
                      key={column.key}
                      className={clsx('px-2.5 py-3 text-sm', column.className)}
                    >
                      {column.render(order)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalOrders={totalOrders}
          pageSize={pageSize}
          onPageChange={onPageChange}
          labels={{
            showing: t('orders.showing'),
            to: t('orders.to'),
            of: t('orders.of'),
            page: t('orders.page'),
            previous: t('orders.previous'),
            next: t('orders.next'),
          }}
        />
      )}
    </div>
  )
}
