'use client';

/**
 * useDashboardData Hook
 * Fetches and manages dashboard metrics with stale data detection
 * Requirements: 6.1, 6.3
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';

/**
 * Dashboard metrics data structure
 */
export interface DashboardMetrics {
  ordersReceived: number;
  ordersConfirmed: number;
  ordersPending: number;
  ordersRejected: number;
  confirmationRate: number;
  revenue: number;
  revenueChange: number;
  averageOrderValue: number;
}

/**
 * Return type for useDashboardData hook
 */
export interface UseDashboardDataReturn {
  /** Dashboard metrics data */
  metrics: DashboardMetrics | null;
  /** Whether data is currently loading */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Function to manually refetch data */
  refetch: () => void;
  /** Timestamp of last successful data fetch */
  lastUpdated: Date | null;
  /** Whether data is stale (older than threshold) */
  isStale: boolean;
  /** Whether auto-refresh is enabled */
  autoRefreshEnabled: boolean;
  /** Toggle auto-refresh on/off */
  setAutoRefresh: (enabled: boolean) => void;
}

/** Stale data threshold in milliseconds (5 minutes) */
const STALE_THRESHOLD_MS = 5 * 60 * 1000;

/**
 * Check if data is stale based on last update time
 * Requirements: 6.3 - Data stale after 5 minutes
 */
function checkIsStale(lastUpdated: Date | null): boolean {
  if (!lastUpdated) return false;
  return Date.now() - lastUpdated.getTime() > STALE_THRESHOLD_MS;
}

/**
 * useDashboardData - Hook for fetching and managing dashboard metrics
 * 
 * Features:
 * - Fetches metrics from analytics API (Requirements: 6.1)
 * - Detects stale data (>5 min threshold) (Requirements: 6.3)
 * - Provides refetch capability
 * - Handles loading and error states
 * 
 * @param autoRefresh - Whether to auto-refresh when data becomes stale
 * @returns Dashboard data state and controls
 * 
 * @example
 * const { metrics, isLoading, error, refetch, isStale } = useDashboardData();
 * 
 * if (isLoading) return <LoadingSkeleton />;
 * if (error) return <ErrorState error={error} onRetry={refetch} />;
 * if (isStale) return <StaleIndicator onRefresh={refetch} />;
 */
export function useDashboardData(initialAutoRefresh = false): UseDashboardDataReturn {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(initialAutoRefresh);
  
  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);
  // Interval ref for stale checking
  const staleCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Toggle auto-refresh on/off
   * Requirements: 6.3 - Add auto-refresh toggle
   */
  const setAutoRefresh = useCallback((enabled: boolean) => {
    setAutoRefreshEnabled(enabled);
  }, []);

  /**
   * Fetch dashboard metrics from API
   * Requirements: 6.1 - Fetch metrics from analytics API endpoint
   */
  const fetchMetrics = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get('/api/analytics/dashboard');
      
      if (!isMountedRef.current) return;

      // Validate response data
      if (response.data && typeof response.data === 'object') {
        const metricsData: DashboardMetrics = {
          ordersReceived: response.data.ordersReceived ?? 0,
          ordersConfirmed: response.data.ordersConfirmed ?? 0,
          ordersPending: response.data.ordersPending ?? 0,
          ordersRejected: response.data.ordersRejected ?? 0,
          confirmationRate: response.data.confirmationRate ?? 0,
          revenue: response.data.revenue ?? 0,
          revenueChange: response.data.revenueChange ?? 0,
          averageOrderValue: response.data.averageOrderValue ?? 0,
        };
        
        setMetrics(metricsData);
        setLastUpdated(new Date());
        setIsStale(false);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to fetch dashboard metrics';
      setError(errorMessage);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  /**
   * Manual refetch function
   */
  const refetch = useCallback(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  /**
   * Check for stale data periodically
   * Requirements: 6.3 - Display refresh indicator when data > 5 minutes old
   */
  useEffect(() => {
    // Check stale status every 30 seconds
    staleCheckIntervalRef.current = setInterval(() => {
      if (lastUpdated) {
        const stale = checkIsStale(lastUpdated);
        setIsStale(stale);
        
        // Auto-refresh if enabled and data is stale
        if (autoRefreshEnabled && stale && !isLoading) {
          fetchMetrics();
        }
      }
    }, 30000);

    return () => {
      if (staleCheckIntervalRef.current) {
        clearInterval(staleCheckIntervalRef.current);
      }
    };
  }, [lastUpdated, autoRefreshEnabled, isLoading, fetchMetrics]);

  /**
   * Initial data fetch on mount
   */
  useEffect(() => {
    isMountedRef.current = true;
    fetchMetrics();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchMetrics]);

  return {
    metrics,
    isLoading,
    error,
    refetch,
    lastUpdated,
    isStale,
    autoRefreshEnabled,
    setAutoRefresh,
  };
}

export default useDashboardData;
