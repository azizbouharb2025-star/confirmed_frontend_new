'use client';

/**
 * ComplaintFilters Component
 * Filter panel for complaints dashboard
 * Requirements: 2.3
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { clsx } from 'clsx';
import {
  ComplaintFilters as ComplaintFiltersType,
  ComplaintStatus,
  ComplaintCategory,
  ALL_COMPLAINT_STATUSES,
  ALL_COMPLAINT_CATEGORIES,
  getStatusDisplayName,
  getCategoryDisplayName,
  hasActiveFilters,
} from '@/types/complaint';

export interface ComplaintFiltersProps {
  /** Current filter values */
  filters: ComplaintFiltersType;
  /** Callback when filters change */
  onFiltersChange: (filters: ComplaintFiltersType) => void;
  /** Available regions for filter dropdown */
  availableRegions?: string[];
  /** Available products for filter dropdown */
  availableProducts?: Array<{ id: string; name: string }>;
  /** Optional className for styling */
  className?: string;
}

/**
 * Custom hook for debounced value
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Search Icon Component
 */
const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

/**
 * Format date for input value
 */
function formatDateForInput(dateString: string | undefined): string {
  if (!dateString) return '';
  return dateString.split('T')[0];
}

/**
 * ComplaintFilters - Filter panel for complaints
 * 
 * Requirements:
 * - 2.3: Filter complaints by status, category, date range, product, region, and search term
 */
export function ComplaintFilters({
  filters,
  onFiltersChange,
  availableRegions = [],
  availableProducts = [],
  className,
}: ComplaintFiltersProps): JSX.Element {
  // Local state for search input (before debounce)
  const [searchInput, setSearchInput] = useState(filters.search || '');
  
  // Debounce search input by 300ms
  const debouncedSearch = useDebounce(searchInput, 300);
  
  // Track previous debounced search to avoid unnecessary updates
  const prevDebouncedSearchRef = React.useRef(debouncedSearch);
  
  // Update filters when debounced search changes
  useEffect(() => {
    // Only update if debounced search actually changed (not on every filters change)
    if (debouncedSearch !== prevDebouncedSearchRef.current) {
      prevDebouncedSearchRef.current = debouncedSearch;
      onFiltersChange({ ...filters, search: debouncedSearch || undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, onFiltersChange]);

  // Check if any filters are active
  const filtersActive = useMemo(() => hasActiveFilters(filters), [filters]);

  /**
   * Handle search input change
   */
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  }, []);

  /**
   * Handle status filter change
   */
  const handleStatusChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFiltersChange({
      ...filters,
      status: value ? (value as ComplaintStatus) : undefined,
    });
  }, [filters, onFiltersChange]);

  /**
   * Handle category filter change
   */
  const handleCategoryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFiltersChange({
      ...filters,
      category: value ? (value as ComplaintCategory) : undefined,
    });
  }, [filters, onFiltersChange]);

  /**
   * Handle start date change
   */
  const handleStartDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onFiltersChange({
      ...filters,
      startDate: value || undefined,
    });
  }, [filters, onFiltersChange]);

  /**
   * Handle end date change
   */
  const handleEndDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onFiltersChange({
      ...filters,
      endDate: value || undefined,
    });
  }, [filters, onFiltersChange]);

  /**
   * Handle region filter change
   */
  const handleRegionChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFiltersChange({
      ...filters,
      region: value || undefined,
    });
  }, [filters, onFiltersChange]);

  /**
   * Handle product filter change
   */
  const handleProductChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFiltersChange({
      ...filters,
      productId: value || undefined,
    });
  }, [filters, onFiltersChange]);

  /**
   * Clear all filters
   */
  const handleClearFilters = useCallback(() => {
    setSearchInput('');
    onFiltersChange({});
  }, [onFiltersChange]);

  // Base input styles
  const inputBaseStyles = clsx(
    'w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg',
    'text-gray-900 dark:text-white text-sm',
    'focus:outline-none focus:ring-2 focus:ring-[#ADFF2F]/50 focus:border-[#ADFF2F]/50',
    'transition-all duration-200'
  );

  const selectBaseStyles = clsx(
    inputBaseStyles,
    'appearance-none cursor-pointer'
  );

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Main filters row */}
      <div className="flex flex-wrap gap-4 items-end">
        {/* Search input */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            Search
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500">
              <SearchIcon />
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={handleSearchChange}
              placeholder="Search by reference, customer..."
              className={clsx(inputBaseStyles, 'pl-10')}
              data-testid="search-input"
            />
          </div>
        </div>

        {/* Status dropdown */}
        <div className="w-[160px]">
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            Status
          </label>
          <select
            value={filters.status || ''}
            onChange={handleStatusChange}
            className={selectBaseStyles}
            data-testid="status-filter"
          >
            <option value="">All Statuses</option>
            {ALL_COMPLAINT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {getStatusDisplayName(status)}
              </option>
            ))}
          </select>
        </div>

        {/* Category dropdown */}
        <div className="w-[180px]">
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            Category
          </label>
          <select
            value={filters.category || ''}
            onChange={handleCategoryChange}
            className={selectBaseStyles}
            data-testid="category-filter"
          >
            <option value="">All Categories</option>
            {ALL_COMPLAINT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {getCategoryDisplayName(category)}
              </option>
            ))}
          </select>
        </div>

        {/* Clear filters button */}
        {filtersActive && (
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

      {/* Secondary filters row */}
      <div className="flex flex-wrap gap-4 items-end">
        {/* Date range picker */}
        <div className="flex gap-2 items-end">
          <div className="w-[150px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={formatDateForInput(filters.startDate)}
              onChange={handleStartDateChange}
              className={inputBaseStyles}
              data-testid="start-date-input"
            />
          </div>
          <div className="w-[150px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={formatDateForInput(filters.endDate)}
              onChange={handleEndDateChange}
              min={formatDateForInput(filters.startDate)}
              className={inputBaseStyles}
              data-testid="end-date-input"
            />
          </div>
        </div>

        {/* Region filter */}
        {availableRegions.length > 0 && (
          <div className="w-[160px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Region
            </label>
            <select
              value={filters.region || ''}
              onChange={handleRegionChange}
              className={selectBaseStyles}
              data-testid="region-filter"
            >
              <option value="">All Regions</option>
              {availableRegions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Product filter */}
        {availableProducts.length > 0 && (
          <div className="w-[180px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Product
            </label>
            <select
              value={filters.productId || ''}
              onChange={handleProductChange}
              className={selectBaseStyles}
              data-testid="product-filter"
            >
              <option value="">All Products</option>
              {availableProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}

export default ComplaintFilters;
