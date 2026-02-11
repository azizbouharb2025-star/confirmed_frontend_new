'use client';

/**
 * useComplaints Hook
 * Fetches and manages complaints list with pagination, filtering, and real-time updates
 * Requirements: 2.1, 2.2, 2.3
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { complaintService } from '@/services/complaintService';
import logger from '@/lib/logger';
import {
  Complaint,
  ComplaintFilters,
  ComplaintSummary,
  DEFAULT_COMPLAINT_FILTERS,
} from '@/types/complaint';

/**
 * Pagination state
 */
export interface PaginationState {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
}

/**
 * Return type for useComplaints hook
 */
export interface UseComplaintsReturn {
  /** List of complaints for current page */
  complaints: Complaint[];
  /** Summary counts by status */
  summary: ComplaintSummary | null;
  /** Whether data is currently loading */
  isLoading: boolean;
  /** Whether summary is loading */
  isSummaryLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Current filter state */
  filters: ComplaintFilters;
  /** Update filters */
  setFilters: (filters: ComplaintFilters) => void;
  /** Pagination state */
  pagination: PaginationState;
  /** Set current page */
  setPage: (page: number) => void;
  /** Manually refetch data */
  refetch: () => Promise<void>;
  /** Add a new complaint to the list (for real-time updates) */
  addComplaint: (complaint: Complaint) => void;
  /** Update an existing complaint in the list (for real-time updates) */
  updateComplaint: (complaint: Complaint) => void;
}

/** Default page size */
const DEFAULT_LIMIT = 10;

/** Default summary values */
const DEFAULT_SUMMARY: ComplaintSummary = {
  open: 0,
  in_progress: 0,
  resolved: 0,
  closed: 0,
  escalated: 0,
  total: 0,
};

/**
 * useComplaints - Hook for fetching and managing complaints list
 *
 * Features:
 * - Fetches paginated complaints (Requirements: 2.2)
 * - Manages filter state (Requirements: 2.3)
 * - Fetches summary counts (Requirements: 2.1)
 * - Supports real-time updates integration
 *
 * @param initialFilters - Optional initial filter values
 * @returns Complaints data state and controls
 */
export function useComplaints(initialFilters?: ComplaintFilters): UseComplaintsReturn {
  // Data state
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [summary, setSummary] = useState<ComplaintSummary | null>(null);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and pagination state
  const [filters, setFiltersState] = useState<ComplaintFilters>(
    initialFilters || DEFAULT_COMPLAINT_FILTERS
  );
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: DEFAULT_LIMIT,
  });

  // Track if component is mounted
  const isMountedRef = useRef(true);
  
  // Use refs to track current values without causing re-renders
  const pageRef = useRef(pagination.page);
  const limitRef = useRef(pagination.limit);
  const filtersRef = useRef(filters);
  
  // Keep refs in sync
  useEffect(() => {
    pageRef.current = pagination.page;
  }, [pagination.page]);
  
  useEffect(() => {
    limitRef.current = pagination.limit;
  }, [pagination.limit]);
  
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  /**
   * Fetch complaints list with current filters and pagination
   * Requirements: 2.1, 2.2, 2.3
   */
  const fetchComplaints = useCallback(async () => {
    if (!isMountedRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await complaintService.getComplaints({
        page: pageRef.current,
        limit: limitRef.current,
        filters: filtersRef.current,
      });

      if (!isMountedRef.current) return;

      setComplaints(response.complaints);
      setPagination((prev) => ({
        ...prev,
        total: response.total,
        totalPages: response.totalPages,
      }));
    } catch (err) {
      if (!isMountedRef.current) return;

      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch complaints';
      setError(errorMessage);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  /**
   * Fetch complaint summary counts
   * Requirements: 2.1
   */
  const fetchSummary = useCallback(async () => {
    if (!isMountedRef.current) return;

    setIsSummaryLoading(true);

    try {
      const summaryData = await complaintService.getSummary();

      if (!isMountedRef.current) return;

      // Validate that we got real data, not an empty/malformed response
      if (summaryData && typeof summaryData.total === 'number') {
        console.log('[useComplaints] Summary data received (valid):', JSON.stringify(summaryData));
        setSummary(summaryData);
      } else {
        console.log('[useComplaints] Summary data unexpected shape:', JSON.stringify(summaryData));
        // API returned unexpected shape — try to extract from nested structure
        const raw = summaryData as unknown as Record<string, unknown>;
        const extracted: ComplaintSummary = {
          open: Number(raw.open) || 0,
          in_progress: Number(raw.in_progress) || 0,
          resolved: Number(raw.resolved) || 0,
          closed: Number(raw.closed) || 0,
          escalated: Number(raw.escalated) || 0,
          total: Number(raw.total) || 0,
        };
        // Compute total from parts if total is 0 but parts aren't
        if (extracted.total === 0) {
          extracted.total =
            extracted.open +
            extracted.in_progress +
            extracted.resolved +
            extracted.closed +
            extracted.escalated;
        }
        setSummary(extracted);
      }
    } catch (err) {
      if (!isMountedRef.current) return;

      logger.error('Failed to fetch summary:', err, 'Complaints');
      setSummary(DEFAULT_SUMMARY);
    } finally {
      if (isMountedRef.current) {
        setIsSummaryLoading(false);
      }
    }
  }, []);

  /**
   * Refetch both complaints and summary
   */
  const refetch = useCallback(async () => {
    await Promise.all([fetchComplaints(), fetchSummary()]);
  }, [fetchComplaints, fetchSummary]);

  /**
   * Update filters and reset to page 1
   * Requirements: 2.3
   */
  const setFilters = useCallback((newFilters: ComplaintFilters) => {
    setFiltersState(newFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  /**
   * Set current page
   */
  const setPage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  /**
   * Add a new complaint to the list (for real-time updates)
   * Requirements: 2.4
   */
  const addComplaint = useCallback((complaint: Complaint) => {
    setComplaints((prev) => [complaint, ...prev]);
    // Update summary counts
    setSummary((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [complaint.status]: prev[complaint.status] + 1,
        total: prev.total + 1,
      };
    });
  }, []);

  /**
   * Update an existing complaint in the list (for real-time updates)
   * Requirements: 2.5
   */
  const updateComplaint = useCallback((updatedComplaint: Complaint) => {
    setComplaints((prev) => {
      const index = prev.findIndex((c) => c._id === updatedComplaint._id);
      if (index === -1) return prev;

      const oldComplaint = prev[index];
      const newList = [...prev];
      newList[index] = updatedComplaint;

      // Update summary if status changed
      if (oldComplaint.status !== updatedComplaint.status) {
        setSummary((prevSummary) => {
          if (!prevSummary) return prevSummary;
          return {
            ...prevSummary,
            [oldComplaint.status]: Math.max(0, prevSummary[oldComplaint.status] - 1),
            [updatedComplaint.status]: prevSummary[updatedComplaint.status] + 1,
          };
        });
      }

      return newList;
    });
  }, []);

  // Fetch data when filters or page changes
  useEffect(() => {
    fetchComplaints();
  }, [pagination.page, pagination.limit, filters, fetchComplaints]);

  // Refetch summary when filters change (not just on mount)
  useEffect(() => {
    fetchSummary();
  }, [filters, fetchSummary]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    complaints,
    summary,
    isLoading,
    isSummaryLoading,
    error,
    filters,
    setFilters,
    pagination,
    setPage,
    refetch,
    addComplaint,
    updateComplaint,
  };
}

export default useComplaints;
