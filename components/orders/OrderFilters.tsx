'use client'

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { clsx } from 'clsx'
import type { OrderFilters as OrderFiltersType, OrderStatus } from '@/types/order'
import { SubscriptionPlan, hasFeatureAccess } from '@/types/subscription'
import { useLanguage } from '@/hooks/useLanguage'

/**
 * OrderFilters Component
 * Filter panel with tier-based filter availability
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

export interface OrderFiltersProps {
  subscriptionPlan: SubscriptionPlan
  filters: OrderFiltersType
  onFiltersChange: (filters: OrderFiltersType) => void
  availableRegions?: string[]
  availableCouriers?: string[]
  className?: string
}

// All valid order statuses for the dropdown
const ALL_STATUSES: OrderStatus[] = ['pending', 'assigned', 'in_progress', 'confirmed', 'rejected', 'cancelled']

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
 * Filter orders by AI score range (Pro+ feature)
 */
export function filterByAiScoreRange<T extends { aiRiskScore?: number }>(
  orders: T[],
  aiScoreRange: { min: number; max: number } | undefined
): T[] {
  if (!aiScoreRange) {
    return orders
  }
  
  return orders.filter((order) => {
    if (order.aiRiskScore === undefined) {
      return false
    }
    return order.aiRiskScore >= aiScoreRange.min && order.aiRiskScore <= aiScoreRange.max
  })
}

/**
 * Filter orders by region (Business+ feature)
 */
export function filterByRegion<T extends { region?: string }>(
  orders: T[],
  region: string | undefined
): T[] {
  if (!region || region === '') {
    return orders
  }
  
  return orders.filter((order) => order.region === region)
}

/**
 * Filter orders by courier (Business+ feature)
 */
export function filterByCourier<T extends { courierAssignment?: string }>(
  orders: T[],
  courier: string | undefined
): T[] {
  if (!courier || courier === '') {
    return orders
  }
  
  return orders.filter((order) => order.courierAssignment === courier)
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
  aiRiskScore?: number
  region?: string
  courierAssignment?: string
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
  
  // Apply AI score range filter (Pro+)
  if (filters.aiScoreRange) {
    result = filterByAiScoreRange(result, filters.aiScoreRange)
  }
  
  // Apply region filter (Business+)
  if (filters.region) {
    result = filterByRegion(result, filters.region)
  }
  
  // Apply courier filter (Business+)
  if (filters.courier) {
    result = filterByCourier(result, filters.courier)
  }
  
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
const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

/**
 * Lock Icon Component for disabled features
 */
const LockIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
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
  subscriptionPlan,
  filters,
  onFiltersChange,
  availableRegions = [],
  availableCouriers = [],
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
  
  // Check feature access
  const hasProAccess = hasFeatureAccess(subscriptionPlan, 'pro')
  const hasBusinessAccess = hasFeatureAccess(subscriptionPlan, 'business')
  
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
  
  // Handle AI score range changes (Pro+)
  const handleAiScoreMinChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const min = parseInt(e.target.value, 10)
    if (!isNaN(min)) {
      const max = filters.aiScoreRange?.max ?? 100
      onFiltersChange({
        ...filters,
        aiScoreRange: { min: Math.max(0, Math.min(min, 100)), max }
      })
    }
  }, [filters, onFiltersChange])
  
  const handleAiScoreMaxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const max = parseInt(e.target.value, 10)
    if (!isNaN(max)) {
      const min = filters.aiScoreRange?.min ?? 0
      onFiltersChange({
        ...filters,
        aiScoreRange: { min, max: Math.max(0, Math.min(max, 100)) }
      })
    }
  }, [filters, onFiltersChange])
  
  // Handle region change (Business+)
  const handleRegionChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({ ...filters, region: e.target.value || undefined })
  }, [filters, onFiltersChange])
  
  // Handle courier change (Business+)
  const handleCourierChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({ ...filters, courier: e.target.value || undefined })
  }, [filters, onFiltersChange])
  
  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setSearchInput('')
    onFiltersChange({
      search: '',
      status: 'all',
      dateRange: null,
      aiScoreRange: undefined,
      region: undefined,
      courier: undefined,
    })
  }, [onFiltersChange])
  
  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.search !== '' ||
      filters.status !== 'all' ||
      filters.dateRange !== null ||
      filters.aiScoreRange !== undefined ||
      filters.region !== undefined ||
      filters.courier !== undefined
    )
  }, [filters])


  // Base input styles
  const inputBaseStyles = clsx(
    'w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg',
    'text-gray-900 dark:text-white text-sm',
    'focus:outline-none focus:ring-2 focus:ring-[#ADFF2F]/50 focus:border-[#ADFF2F]/50',
    'transition-all duration-200'
  )
  
  const selectBaseStyles = clsx(
    inputBaseStyles,
    'appearance-none cursor-pointer'
  )
  
  const disabledStyles = 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-slate-900'

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Main filters row */}
      <div className="flex flex-wrap gap-4 items-end">
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
            <option value="all">{t('orders.allStatuses')}</option>
            <option value="pending">{t('common.pending')}</option>
            <option value="assigned">{t('status.active')}</option>
            <option value="in_progress">{t('action.processing')}</option>
            <option value="confirmed">{t('common.confirmed')}</option>
            <option value="rejected">{t('common.rejected')}</option>
            <option value="cancelled">{t('status.inactive')}</option>
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
            Clear Filters
          </button>
        )}
      </div>

      
      {/* Tier-based filters row */}
      <div className="flex flex-wrap gap-4 items-end">
        {/* AI Score Range Filter (Pro+) */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 flex items-center gap-1">
            {t('orders.aiScoreRange')}
            {!hasProAccess && <LockIcon />}
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              min={0}
              max={100}
              value={filters.aiScoreRange?.min ?? ''}
              onChange={handleAiScoreMinChange}
              placeholder="Min"
              disabled={!hasProAccess}
              className={clsx(
                inputBaseStyles,
                'w-[80px]',
                !hasProAccess && disabledStyles
              )}
              data-testid="ai-score-min-input"
            />
            <span className="text-gray-500 dark:text-slate-400">-</span>
            <input
              type="number"
              min={0}
              max={100}
              value={filters.aiScoreRange?.max ?? ''}
              onChange={handleAiScoreMaxChange}
              placeholder="Max"
              disabled={!hasProAccess}
              className={clsx(
                inputBaseStyles,
                'w-[80px]',
                !hasProAccess && disabledStyles
              )}
              data-testid="ai-score-max-input"
            />
          </div>
          {!hasProAccess && (
            <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">
              {t('orders.upgradeProAiScore')}
            </p>
          )}
        </div>
        
        {/* Region Filter (Business+) */}
        <div className="relative w-[180px]">
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 flex items-center gap-1">
            {t('orders.region')}
            {!hasBusinessAccess && <LockIcon />}
          </label>
          <select
            value={filters.region || ''}
            onChange={handleRegionChange}
            disabled={!hasBusinessAccess}
            className={clsx(
              selectBaseStyles,
              !hasBusinessAccess && disabledStyles
            )}
            data-testid="region-filter"
          >
            <option value="">{t('orders.allRegions')}</option>
            {availableRegions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
          {!hasBusinessAccess && (
            <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">
              {t('orders.upgradeBusinessRegion')}
            </p>
          )}
        </div>
        
        {/* Courier Filter (Business+) */}
        <div className="relative w-[180px]">
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 flex items-center gap-1">
            {t('orders.courier')}
            {!hasBusinessAccess && <LockIcon />}
          </label>
          <select
            value={filters.courier || ''}
            onChange={handleCourierChange}
            disabled={!hasBusinessAccess}
            className={clsx(
              selectBaseStyles,
              !hasBusinessAccess && disabledStyles
            )}
            data-testid="courier-filter"
          >
            <option value="">{t('orders.allCouriers')}</option>
            {availableCouriers.map((courier) => (
              <option key={courier} value={courier}>
                {courier}
              </option>
            ))}
          </select>
          {!hasBusinessAccess && (
            <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">
              {t('orders.upgradeBusinessCourier')}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
