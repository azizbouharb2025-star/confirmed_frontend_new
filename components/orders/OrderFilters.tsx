'use client'

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { clsx } from 'clsx'
import type { OrderFilters as OrderFiltersType, OrderStatus } from '@/types/order'
import { useLanguage } from '@/hooks/useLanguage'

/**
 * OrderFilters Component
 * Filter panel with tier-based filter availability
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

export interface OrderFiltersProps {
  filters: OrderFiltersType
  onFiltersChange: (filters: OrderFiltersType) => void
  showLegacyStatuses?: boolean
  className?: string
}

// All valid order statuses for the dropdown
const _ALL_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'cancelled',
  'postponed',
  'shipped',
  'at_depot',
  'out_for_delivery',
  'delivered',
  'returned'
]

/**
 * Custom hook for debounced value
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}


/**
 * Filter orders by search term
 * Matches against orderId, clientInfo.name, or clientInfo.phone (case-insensitive)
 * 
 * Property 2: Search filter matches searchable fields
 * Validates: Requirements 2.1
 */
export function filterBySearch<T extends { orderId: string; clientInfo: { name: string; phone: string } }>(
  orders: T[],
  searchTerm: string
): T[] {
  if (!searchTerm || searchTerm.trim() === '') {
    return orders
  }
  
  const normalizedSearch = searchTerm.toLowerCase().trim()
  
  return orders.filter((order) => {
    const orderId = order.orderId.toLowerCase()
    const name = order.clientInfo.name.toLowerCase()
    const phone = order.clientInfo.phone.toLowerCase()
    
    return (
      orderId.includes(normalizedSearch) ||
      name.includes(normalizedSearch) ||
      phone.includes(normalizedSearch)
    )
  })
}

/**
 * Filter orders by status
 * 
 * Property 3: Status filter returns matching orders
 * Validates: Requirements 2.2
 */
export function filterByStatus<T extends { status: OrderStatus }>(
  orders: T[],
  status: OrderStatus | 'all'
): T[] {
  if (status === 'all') {
    return orders
  }
  
  return orders.filter((order) => order.status === status)
}

/**
 * Filter orders by date range
 * Returns orders with createdAt within the specified start and end dates (inclusive)
 * 
 * Property 4: Date range filter returns orders within range
 * Validates: Requirements 2.3
 */
export function filterByDateRange<T extends { createdAt: string }>(
  orders: T[],
  dateRange: { start: Date; end: Date } | null
): T[] {
  if (!dateRange) {
    return orders
  }
  
  const startTime = new Date(dateRange.start)
  startTime.setHours(0, 0, 0, 0)
  
  const endTime = new Date(dateRange.end)
  endTime.setHours(23, 59, 59, 999)
  
  return orders.filter((order) => {
    const orderDate = new Date(order.createdAt)
    return orderDate >= startTime && orderDate <= endTime
  })
}

/**
 * Apply all filters with AND logic
 *
 * Property 5: Multiple filters combine with AND logic
 * Validates: Requirements 2.6
 */
export function applyAllFilters<T extends {
  orderId: string
  clientInfo: { name: string; phone: string }
  status: OrderStatus
  createdAt: string
}>(
  orders: T[],
  filters: OrderFiltersType
): T[] {
  let result = orders
  
  // Apply search filter
  result = filterBySearch(result, filters.search)
  
  // Apply status filter
  result = filterByStatus(result, filters.status)
  
  // Apply date range filter
  result = filterByDateRange(result, filters.dateRange)
  
  return result
}

/**
 * Search Icon Component
 */
const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

/**
 * Calendar Icon Component
 */
const _CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

/**
 * Format date for input value
 */
function formatDateForInput(date: Date | null): string {
  if (!date) return ''
  return date.toISOString().split('T')[0]
}

/**
 * Parse date from input value
 */
function parseDateFromInput(value: string): Date | null {
  if (!value) return null
  const date = new Date(value)
  return isNaN(date.getTime()) ? null : date
}


export default function OrderFilters({
  filters,
  onFiltersChange,
  showLegacyStatuses = false,
  className,
}: OrderFiltersProps) {
  const { t } = useLanguage()
  
  // Local state for search input (before debounce)
  const [searchInput, setSearchInput] = useState(filters.search)
  
  // Debounce search input by 300ms per Requirements 2.1
  const debouncedSearch = useDebounce(searchInput, 300)
  
  // Update filters when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onFiltersChange({ ...filters, search: debouncedSearch })
    }
  }, [debouncedSearch, filters, onFiltersChange])
  
  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value)
  }, [])
  
  // Handle status change
  const handleStatusChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as OrderStatus | 'all'
    onFiltersChange({ ...filters, status: value })
  }, [filters, onFiltersChange])
  
  // Handle date range changes
  const handleStartDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const startDate = parseDateFromInput(e.target.value)
    if (startDate) {
      const endDate = filters.dateRange?.end || startDate
      onFiltersChange({
        ...filters,
        dateRange: { start: startDate, end: endDate >= startDate ? endDate : startDate }
      })
    } else if (!e.target.value && filters.dateRange) {
      // Clear date range if start date is cleared
      onFiltersChange({ ...filters, dateRange: null })
    }
  }, [filters, onFiltersChange])
  
  const handleEndDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const endDate = parseDateFromInput(e.target.value)
    if (endDate && filters.dateRange?.start) {
      onFiltersChange({
        ...filters,
        dateRange: { start: filters.dateRange.start, end: endDate }
      })
    } else if (endDate && !filters.dateRange?.start) {
      onFiltersChange({
        ...filters,
        dateRange: { start: endDate, end: endDate }
      })
    }
  }, [filters, onFiltersChange])
  
  // AI decision filter
  const handleAiDecisionChange = useCallback(
    (decision: 'accept' | 'review' | 'reject') => {
      onFiltersChange({
        ...filters,
        status: 'confirmed',
        aiDecision: filters.aiDecision === decision ? 'all' : decision,
      })
    },
    [filters, onFiltersChange]
  )

  // AI confidence range filter
  const handleAiScoreRangeChange = useCallback(
    (min: number, max: number) => {
      const current = filters.aiScoreRange
      const isSameRange = current?.min === min && current?.max === max

      onFiltersChange({
        ...filters,
        status: 'confirmed',
        aiScoreRange: isSameRange ? undefined : { min, max },
      })
    },
    [filters, onFiltersChange]
  )

  // AI risk level filter
  const handleRiskLevelChange = useCallback(
    (riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'very_low') => {
      onFiltersChange({
        ...filters,
        status: 'confirmed',
        riskLevel: filters.riskLevel === riskLevel ? 'all' : riskLevel,
      })
    },
    [filters, onFiltersChange]
  )

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setSearchInput('')
    onFiltersChange({
      search: '',
      status: 'all',
      dateRange: null,
      aiDecision: 'all',
      aiScoreRange: undefined,
      riskLevel: 'all',
    })
  }, [onFiltersChange])
  
  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.search !== '' ||
      filters.status !== 'all' ||
      filters.dateRange !== null ||
      (filters.aiDecision !== undefined && filters.aiDecision !== 'all') ||
      filters.aiScoreRange !== undefined ||
      (filters.riskLevel !== undefined && filters.riskLevel !== 'all')
    )
  }, [filters])


  // Base input styles
  const inputBaseStyles = clsx(
    'w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg',
    'text-gray-900 dark:text-white text-sm',
    'focus:outline-none focus:ring-2 focus:ring-[#ADFF2F]/50 focus:border-[#ADFF2F]/50',
    'transition-all duration-200'
  )
  
  const selectBaseStyles = clsx(
    inputBaseStyles,
    'appearance-none cursor-pointer'
  )

  return (
    <div className={clsx('space-y-2', className)}>
      {/* Main filters row */}
      <div className="flex flex-wrap gap-2 items-end">
        {/* Search input with debounce */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            {t('orders.search')}
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500">
              <SearchIcon />
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={handleSearchChange}
              placeholder={t('orders.searchPlaceholder')}
              className={clsx(inputBaseStyles, 'pl-10')}
              data-testid="search-input"
            />
          </div>
        </div>
        
        {/* Status dropdown */}
        <div className="w-[180px]">
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            {t('orders.status')}
          </label>
          <select
            value={filters.status}
            onChange={handleStatusChange}
            className={selectBaseStyles}
            data-testid="status-filter"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="confirmed">Confirmée</option>
            <option value="cancelled">Annulée</option>
            <option value="postponed">Reportée</option>
            <option value="shipped">Expédiée</option>
            <option value="at_depot">Dépôt</option>
            <option value="out_for_delivery">En livraison</option>
            <option value="delivered">Livrée</option>
            <option value="returned">Retournée</option>
            {showLegacyStatuses && (
              <option value="failed_delivery">
                Échec livraison
              </option>
            )}
          </select>
        </div>
        
        {/* Date range picker */}
        <div className="flex gap-2 items-end">
          <div className="w-[150px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              {t('orders.fromDate')}
            </label>
            <div className="relative">
              <input
                type="date"
                value={formatDateForInput(filters.dateRange?.start || null)}
                onChange={handleStartDateChange}
                className={inputBaseStyles}
                data-testid="start-date-input"
              />
            </div>
          </div>
          <div className="w-[150px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              {t('orders.toDate')}
            </label>
            <div className="relative">
              <input
                type="date"
                value={formatDateForInput(filters.dateRange?.end || null)}
                onChange={handleEndDateChange}
                min={formatDateForInput(filters.dateRange?.start || null)}
                className={inputBaseStyles}
                data-testid="end-date-input"
              />
            </div>
          </div>
        </div>
        
        {/* Clear filters button */}
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className={clsx(
              'px-4 py-2 text-sm font-medium rounded-lg',
              'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white',
              'bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600',
              'transition-colors duration-200'
            )}
            data-testid="clear-filters-button"
          >
            {t('orders.clearFilters')}
          </button>
        )}
      </div>

      {/* AI filters */}
      <div className="relative grid grid-cols-1 gap-2 rounded-xl border border-gray-200/70 bg-gray-50/30 px-3 pb-1.5 pt-3 dark:border-slate-700/70 dark:bg-slate-900/20 lg:grid-cols-[1.2fr_1fr_1fr]">
        <div className="absolute -top-2.5 left-3 flex items-center gap-1 rounded-full border border-[#ADFF2F]/20 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:bg-slate-900 dark:text-slate-400">
          <span className="text-[#ADFF2F]">✦</span>
          Filtres IA
        </div>

        {/* AI Decision */}
        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
            {t('orders.aiDecision')}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              ['accept', t('orders.shippingRecommended')],
              ['review', t('orders.sellerDecision')],
              ['reject', t('orders.shippingDiscouraged')],
            ].map(([value, label]) => {
              const active = filters.aiDecision === value

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    handleAiDecisionChange(
                      value as 'accept' | 'review' | 'reject'
                    )
                  }
                  className={clsx(
                    'rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
                    active
                      ? 'border-[#ADFF2F]/70 bg-[#ADFF2F]/15 text-gray-900 shadow-sm dark:text-white'
                      : 'border-gray-300/80 bg-white/70 text-gray-600 hover:border-[#ADFF2F]/60 hover:bg-white dark:border-slate-600/80 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:bg-slate-800'
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* AI Confidence */}
        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
            {t('orders.aiConfidenceLevel')}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { label: '95–100 %', min: 95, max: 100 },
              { label: '90–94 %', min: 90, max: 94 },
              { label: '80–89 %', min: 80, max: 89 },
              { label: '70–79 %', min: 70, max: 79 },
              { label: '< 70 %', min: 0, max: 69 },
            ].map(({ label, min, max }) => {
              const active =
                filters.aiScoreRange?.min === min &&
                filters.aiScoreRange?.max === max

              return (
                <button
                  key={`${min}-${max}`}
                  type="button"
                  onClick={() => handleAiScoreRangeChange(min, max)}
                  className={clsx(
                    'rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
                    active
                      ? 'border-[#ADFF2F]/70 bg-[#ADFF2F]/15 text-gray-900 shadow-sm dark:text-white'
                      : 'border-gray-300/80 bg-white/70 text-gray-600 hover:border-[#ADFF2F]/60 hover:bg-white dark:border-slate-600/80 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:bg-slate-800'
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Risk Level */}
        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
            {t('orders.riskLevel')}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              ['very_low', t('orders.riskVeryLow')],
              ['low', t('orders.riskLow')],
              ['medium', t('orders.riskModerate')],
              ['high', t('orders.riskHigh')],
              ['critical', t('orders.riskCritical')],
            ].map(([value, label]) => {
              const active = filters.riskLevel === value

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    handleRiskLevelChange(
                      value as
                        | 'critical'
                        | 'high'
                        | 'medium'
                        | 'low'
                        | 'very_low'
                    )
                  }
                  className={clsx(
                    'rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
                    active
                      ? 'border-[#ADFF2F]/70 bg-[#ADFF2F]/15 text-gray-900 shadow-sm dark:text-white'
                      : 'border-gray-300/80 bg-white/70 text-gray-600 hover:border-[#ADFF2F]/60 hover:bg-white dark:border-slate-600/80 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:bg-slate-800'
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
