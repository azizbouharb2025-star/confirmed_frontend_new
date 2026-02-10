'use client'

import React, { useCallback, useMemo } from 'react'
import { clsx } from 'clsx'
import type { Order } from '@/types/order'
import { SubscriptionPlan, hasFeatureAccess } from '@/types/subscription'
import StatusBadge from '@/components/ui/StatusBadge'
import RiskScoreIndicator from '@/components/ui/RiskScoreIndicator'
import RepeatBuyerBadge from '@/components/ui/RepeatBuyerBadge'
import { useLanguage } from '@/hooks/useLanguage'
import { TranslationKey } from '@/lib/i18n'

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
 * Format currency value
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-TN', {
    style: 'currency',
    currency: 'TND',
  }).format(amount)
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
      <td className="px-4 py-3">
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
    <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 gap-2 border-t border-gray-200 dark:border-slate-700">
      <div className="text-sm text-gray-600 dark:text-slate-400">
        {labels.showing} {startItem} {labels.to} {endItem} {labels.of} {totalOrders}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={clsx(
            'px-3 py-1 rounded-lg text-sm font-medium',
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
        <span className="text-sm text-gray-600 dark:text-slate-400">
          {labels.page} {currentPage} {labels.of} {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={clsx(
            'px-3 py-1 rounded-lg text-sm font-medium',
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
 * Get shop name from order
 */
function getShopName(order: Order): string {
  if (typeof order.shopId === 'string') {
    return order.shopId
  }
  return (order.shopId as { _id: string; name: string })?.name || '-'
}

/**
 * Define all available columns with their tier requirements
 */
function createColumnConfigs(userRole: 'seller' | 'operator' | 'admin', t: (key: TranslationKey) => string): ColumnConfig[] {
  const columns: ColumnConfig[] = [
    // Base columns (Starter - available to all)
    {
      key: 'orderId',
      label: t('orders.orderId'),
      minPlan: null,
      render: (order) => (
        <span className="font-medium text-gray-900 dark:text-white">
          {order.orderId}
        </span>
      ),
    },
    {
      key: 'customer',
      label: t('orders.customer'),
      minPlan: null,
      render: (order) => (
        <span className="text-gray-700 dark:text-slate-300">
          {order.clientInfo.name}
        </span>
      ),
    },
    // Shop column - only visible for admin users (Requirements: 6.1)
    ...(userRole === 'admin' ? [{
      key: 'shop',
      label: t('orders.shop'),
      minPlan: null as SubscriptionPlan | null,
      render: (order: Order) => (
        <span className="text-gray-600 dark:text-slate-400">
          {getShopName(order)}
        </span>
      ),
    }] : []),
    {
      key: 'phone',
      label: t('orders.phone'),
      minPlan: null,
      render: (order) => (
        <span className="text-gray-600 dark:text-slate-400">
          {order.clientInfo.phone}
        </span>
      ),
    },
    {
      key: 'status',
      label: t('orders.status'),
      minPlan: null,
      render: (order) => <StatusBadge status={order.status} size="sm" />,
    },
    {
      key: 'value',
      label: t('orders.value'),
      minPlan: null,
      render: (order) => (
        <span className="font-medium text-gray-900 dark:text-white">
          {formatCurrency(order.totalAmount)}
        </span>
      ),
      className: 'text-right',
    },
    // Pro+ columns
    {
      key: 'aiScore',
      label: t('orders.aiScore'),
      minPlan: 'pro',
      render: (order) =>
        order.aiRiskScore !== undefined ? (
          <RiskScoreIndicator score={order.aiRiskScore} size="sm" />
        ) : (
          <span className="text-gray-400 dark:text-slate-500">-</span>
        ),
    },
    {
      key: 'operatorFeedback',
      label: t('orders.operatorFeedback'),
      minPlan: 'pro',
      render: (order) => (
        <span className="text-gray-600 dark:text-slate-400 truncate max-w-[150px] block">
          {order.operatorFeedback || '-'}
        </span>
      ),
    },
    // Business+ columns
    {
      key: 'courier',
      label: t('orders.courier'),
      minPlan: 'business',
      render: (order) => (
        <span className="text-gray-600 dark:text-slate-400">
          {order.courierAssignment || '-'}
        </span>
      ),
    },
    {
      key: 'region',
      label: t('orders.region'),
      minPlan: 'business',
      render: (order) => (
        <span className="text-gray-600 dark:text-slate-400">
          {order.region || '-'}
        </span>
      ),
    },
    {
      key: 'complaintFlags',
      label: t('orders.complaints'),
      minPlan: 'business',
      render: (order) => (
        <span className="text-gray-600 dark:text-slate-400">
          {order.complaintFlags?.length
            ? order.complaintFlags.join(', ')
            : '-'}
        </span>
      ),
    },
    // Enterprise columns
    {
      key: 'repeatBuyer',
      label: t('orders.repeatBuyer'),
      minPlan: 'enterprise',
      render: (order) => (
        <RepeatBuyerBadge
          isRepeatBuyer={order.isRepeatBuyer || false}
          size="sm"
          showLabel={false}
        />
      ),
    },
    {
      key: 'lifetimeValue',
      label: t('orders.lifetimeValue'),
      minPlan: 'enterprise',
      render: (order) => (
        <span className="font-medium text-gray-900 dark:text-white">
          {order.customerLifetimeValue !== undefined
            ? formatCurrency(order.customerLifetimeValue)
            : '-'}
        </span>
      ),
      className: 'text-right',
    },
  ]

  return columns
}


export default function OrdersTable({
  orders,
  userRole,
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
  onRetry,
  className,
}: OrdersTableProps) {
  const { t } = useLanguage()
  
  // Get all column configurations
  const allColumns = useMemo(() => createColumnConfigs(userRole, t), [userRole, t])

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
    <div className={clsx('bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
          <thead className="bg-gray-50 dark:bg-slate-900/50">
            <tr>
              {/* Checkbox column */}
              <th className="px-4 py-3 w-10">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={handleSelectAllChange}
                  aria-label={t('orders.selectAll')}
                />
              </th>
              {/* Data columns */}
              {visibleColumns.map((column) => (
                <th
                  key={column.key}
                  className={clsx(
                    'px-4 py-3 text-left text-xs font-medium',
                    'text-gray-500 dark:text-slate-400 uppercase tracking-wider',
                    column.className
                  )}
                >
                  {column.label}
                </th>
              ))}
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
                  <td className="px-4 py-3">
                    <Checkbox
                      checked={selectedSet.has(order._id)}
                      onChange={(checked) => handleRowSelectionChange(order._id, checked)}
                      aria-label={`${t('orders.selectOrder')} ${order.orderId}`}
                    />
                  </td>
                  {/* Data cells */}
                  {visibleColumns.map((column) => (
                    <td
                      key={column.key}
                      className={clsx('px-4 py-3 text-sm', column.className)}
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
