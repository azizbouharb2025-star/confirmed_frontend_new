'use client'

import React, { useState, useCallback } from 'react'
import { clsx } from 'clsx'
import type { OrderStatus, BulkResult, Order } from '@/types/order'
import { getTranslatedStatusLabels } from '@/components/ui/StatusBadge'
import logger from '@/lib/logger'
import { useLanguage } from '@/hooks/useLanguage'
import type { TranslationKey } from '@/lib/i18n'

/**
 * BulkActionsToolbar Component
 * Toolbar for bulk operations on selected orders
 * 
 * Requirements: 3.1, 3.3, 3.4, 3.5, 3.6
 * 
 * Feature: order-management-system
 * Property 6: Selection count matches toolbar display
 * Property 8: Bulk export contains all selected orders
 * Property 9: Bulk action continues on partial failure
 */

export interface BulkActionsToolbarProps {
  selectedCount: number
  selectedIds: string[]
  selectedOrders: Order[]
  onBulkStatusUpdate: (status: OrderStatus) => Promise<BulkResult>
  onBulkExport: (orders: Order[]) => Promise<void>
  onClearSelection: () => void
  className?: string
}

/**
 * Available statuses for bulk update
 */
const BULK_UPDATE_STATUSES: OrderStatus[] = [
  'pending',
  'assigned',
  'in_progress',
  'confirmed',
  'rejected',
  'cancelled',
]

/**
 * Get the display count for the toolbar
 * Property 6: Selection count matches toolbar display
 * Validates: Requirements 3.1
 */
export function getSelectionDisplayCount(selectedIds: string[]): number {
  return selectedIds.length
}

/**
 * Validate bulk result totals
 * Property 9: Bulk action continues on partial failure
 * Validates: Requirements 3.6
 * 
 * For any bulk action where some operations fail, the result SHALL report
 * the count of successful operations plus the count of failed operations
 * equal to the total selected count.
 */
export function validateBulkResultTotals(
  result: BulkResult,
  totalSelected: number
): boolean {
  return result.successful + result.failed === totalSelected
}

/**
 * Process bulk action with partial failure handling
 * Property 9: Bulk action continues on partial failure
 * Validates: Requirements 3.6
 * 
 * Processes each item individually and continues even if some fail.
 * Returns a BulkResult with counts of successful and failed operations.
 */
export async function processBulkAction<T>(
  items: T[],
  action: (item: T) => Promise<void>,
  getItemId: (item: T) => string
): Promise<BulkResult> {
  const result: BulkResult = {
    successful: 0,
    failed: 0,
    errors: [],
  }

  for (const item of items) {
    try {
      await action(item)
      result.successful++
    } catch (error) {
      result.failed++
      result.errors.push({
        orderId: getItemId(item),
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return result
}

/**
 * Validate that export data contains all selected orders
 * Property 8: Bulk export contains all selected orders
 * Validates: Requirements 3.5
 * 
 * For any selection of order IDs and export operation, the generated CSV
 * SHALL contain a row for each selected order ID.
 */
export function validateExportContainsAllOrders(
  csvContent: string,
  selectedOrders: Order[]
): boolean {
  if (selectedOrders.length === 0) {
    return csvContent === ''
  }

  // Each order should have its orderId in the CSV
  return selectedOrders.every((order) => csvContent.includes(order.orderId))
}

/**
 * Generate CSV content from selected orders
 * Property 8: Bulk export contains all selected orders
 * Validates: Requirements 3.5
 */
export function generateOrdersCSV(orders: Order[]): string {
  if (orders.length === 0) {
    return ''
  }

  // CSV headers
  const headers = [
    'Order ID',
    'Customer Name',
    'Phone',
    'Email',
    'Status',
    'Priority',
    'Total Amount',
    'AI Risk Score',
    'Region',
    'Courier',
    'Is Repeat Buyer',
    'Created At',
    'Updated At',
  ]

  // Escape CSV value
  const escapeCSV = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }

  // Build CSV rows
  const rows = orders.map((order) => [
    order.orderId,
    order.clientInfo.name,
    order.clientInfo.phone,
    order.clientInfo.email || '',
    order.status,
    order.priority,
    order.totalAmount.toString(),
    order.aiRiskScore?.toString() || '',
    order.region || '',
    order.courierAssignment || '',
    order.isRepeatBuyer ? 'Yes' : 'No',
    order.createdAt,
    order.updatedAt,
  ])

  // Build CSV content
  return [
    headers.map(escapeCSV).join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ].join('\n')
}

/**
 * Count the number of data rows in CSV (excluding header)
 * Property 8: Bulk export contains all selected orders
 * Validates: Requirements 3.5
 */
export function countCSVDataRows(csvContent: string): number {
  if (!csvContent || csvContent.trim() === '') {
    return 0
  }
  
  const lines = csvContent.trim().split('\n')
  // Subtract 1 for header row
  return Math.max(0, lines.length - 1)
}


/**
 * Progress indicator component for bulk operations
 */
function ProgressIndicator({ 
  isProcessing, 
  progress 
}: { 
  isProcessing: boolean
  progress: { current: number; total: number } | null 
}) {
  if (!isProcessing || !progress) return null

  const percentage = Math.round((progress.current / progress.total) * 100)

  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div 
          className="h-full bg-[#ADFF2F] transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 dark:text-slate-400">
        {progress.current}/{progress.total}
      </span>
    </div>
  )
}

/**
 * Result summary component for bulk operations
 */
function ResultSummary({ 
  result, 
  onDismiss,
  t,
}: { 
  result: BulkResult
  onDismiss: () => void
  t: (key: TranslationKey) => string
}) {
  const hasErrors = result.failed > 0

  return (
    <div 
      className={clsx(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm',
        hasErrors 
          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
          : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
      )}
    >
      {hasErrors ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )}
      <span>
        {result.successful} {t('bulk.successful')}
        {hasErrors && `, ${result.failed} ${t('bulk.failedCount')}`}
      </span>
      <button
        onClick={onDismiss}
        className="ml-auto p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded"
        aria-label={t('bulk.dismiss')}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}


/**
 * Status dropdown component for bulk status update
 */
function StatusDropdown({
  isOpen,
  onToggle,
  onSelect,
  disabled,
  t,
}: {
  isOpen: boolean
  onToggle: () => void
  onSelect: (status: OrderStatus) => void
  disabled: boolean
  t: (key: TranslationKey) => string
}) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        disabled={disabled}
        className={clsx(
          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
          'border border-gray-300 dark:border-slate-600',
          'bg-white dark:bg-slate-800',
          'text-gray-700 dark:text-slate-300',
          'hover:bg-gray-50 dark:hover:bg-slate-700',
          'transition-colors duration-200',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        data-testid="bulk-status-dropdown-trigger"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {t('bulk.updateStatus')}
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div 
          className={clsx(
            'absolute top-full left-0 mt-1 z-50',
            'w-48 py-1 rounded-lg shadow-lg',
            'bg-white dark:bg-slate-800',
            'border border-gray-200 dark:border-slate-700'
          )}
          data-testid="bulk-status-dropdown-menu"
        >
          {BULK_UPDATE_STATUSES.map((status) => (
            <button
              key={status}
              onClick={() => onSelect(status)}
              className={clsx(
                'w-full px-4 py-2 text-left text-sm',
                'text-gray-700 dark:text-slate-300',
                'hover:bg-gray-100 dark:hover:bg-slate-700',
                'transition-colors duration-150'
              )}
              data-testid={`bulk-status-option-${status}`}
            >
              {getTranslatedStatusLabels(t)[status]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}


/**
 * BulkActionsToolbar Component
 * 
 * Displays bulk action controls when orders are selected:
 * - Selected count display (Property 6)
 * - Bulk status update dropdown (Requirements 3.3)
 * - Export button (Requirements 3.5)
 * - Clear selection button
 * - Progress indicator during operations (Requirements 3.4)
 * - Success/failure summary (Requirements 3.4, 3.6)
 */
export default function BulkActionsToolbar({
  selectedCount,
  selectedIds,
  selectedOrders,
  onBulkStatusUpdate,
  onBulkExport,
  onClearSelection,
  className,
}: BulkActionsToolbarProps) {
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const [result, setResult] = useState<BulkResult | null>(null)
  const { t } = useLanguage()

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('[data-testid="bulk-status-dropdown-trigger"]') && 
          !target.closest('[data-testid="bulk-status-dropdown-menu"]')) {
        setIsStatusDropdownOpen(false)
      }
    }

    if (isStatusDropdownOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [isStatusDropdownOpen])

  /**
   * Handle bulk status update
   * Requirements: 3.3, 3.4, 3.6
   */
  const handleStatusUpdate = useCallback(async (status: OrderStatus) => {
    setIsStatusDropdownOpen(false)
    setIsProcessing(true)
    setProgress({ current: 0, total: selectedIds.length })
    setResult(null)

    try {
      const bulkResult = await onBulkStatusUpdate(status)
      setResult(bulkResult)
    } catch (error) {
      setResult({
        successful: 0,
        failed: selectedIds.length,
        errors: [{ orderId: 'all', error: error instanceof Error ? error.message : 'Unknown error' }],
      })
    } finally {
      setIsProcessing(false)
      setProgress(null)
    }
  }, [selectedIds, onBulkStatusUpdate])

  /**
   * Handle bulk export
   * Requirements: 3.5
   * Property 8: Bulk export contains all selected orders
   */
  const handleExport = useCallback(async () => {
    setIsExporting(true)
    try {
      await onBulkExport(selectedOrders)
    } catch (error) {
      logger.error('Export failed:', error, 'BulkActions')
    } finally {
      setIsExporting(false)
    }
  }, [selectedOrders, onBulkExport])

  /**
   * Dismiss result summary
   */
  const handleDismissResult = useCallback(() => {
    setResult(null)
  }, [])

  // Don't render if no orders selected
  if (selectedCount === 0) {
    return null
  }

  // Calculate display count (Property 6)
  const displayCount = getSelectionDisplayCount(selectedIds)

  return (
    <div
      className={clsx(
        'flex items-center gap-4 px-4 py-3',
        'bg-[#ADFF2F]/10 dark:bg-[#ADFF2F]/5',
        'border border-[#ADFF2F]/30 dark:border-[#ADFF2F]/20',
        'rounded-lg',
        className
      )}
      data-testid="bulk-actions-toolbar"
    >
      {/* Selected count display - Property 6 */}
      <div className="flex items-center gap-2">
        <span 
          className="font-medium text-gray-900 dark:text-white"
          data-testid="selected-count"
        >
          {displayCount} {t('bulk.selected')}
        </span>
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-gray-300 dark:bg-slate-600" />

      {/* Progress or Result */}
      {isProcessing && progress && (
        <ProgressIndicator isProcessing={isProcessing} progress={progress} />
      )}

      {result && !isProcessing && (
        <ResultSummary result={result} onDismiss={handleDismissResult} t={t} />
      )}

      {/* Actions */}
      {!isProcessing && !result && (
        <>
          {/* Bulk status update dropdown */}
          <StatusDropdown
            isOpen={isStatusDropdownOpen}
            onToggle={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
            onSelect={handleStatusUpdate}
            disabled={isProcessing || isExporting}
            t={t}
          />

          {/* Export button */}
          <button
            onClick={handleExport}
            disabled={isProcessing || isExporting}
            className={clsx(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
              'border border-gray-300 dark:border-slate-600',
              'bg-white dark:bg-slate-800',
              'text-gray-700 dark:text-slate-300',
              'hover:bg-gray-50 dark:hover:bg-slate-700',
              'transition-colors duration-200',
              (isProcessing || isExporting) && 'opacity-50 cursor-not-allowed'
            )}
            data-testid="bulk-export-button"
          >
            {isExporting ? (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
            {t('bulk.export')}
          </button>
        </>
      )}

      {/* Clear selection button */}
      <button
        onClick={onClearSelection}
        disabled={isProcessing}
        className={clsx(
          'ml-auto flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
          'text-gray-600 dark:text-slate-400',
          'hover:bg-gray-100 dark:hover:bg-slate-700',
          'transition-colors duration-200',
          isProcessing && 'opacity-50 cursor-not-allowed'
        )}
        data-testid="clear-selection-button"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        {t('bulk.clear')}
      </button>
    </div>
  )
}
