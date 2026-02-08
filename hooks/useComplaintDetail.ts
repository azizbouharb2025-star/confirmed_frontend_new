'use client';

/**
 * useComplaintDetail Hook
 * Fetches and manages a single complaint with status update and note capabilities
 * Requirements: 3.1, 3.5, 3.6
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { complaintService } from '@/services/complaintService';
import { Complaint, ComplaintStatus } from '@/types/complaint';

/**
 * Return type for useComplaintDetail hook
 */
export interface UseComplaintDetailReturn {
  /** The complaint data */
  complaint: Complaint | null;
  /** Whether data is currently loading */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Whether a status update is in progress */
  isUpdatingStatus: boolean;
  /** Whether a note is being added */
  isAddingNote: boolean;
  /** Update the complaint status with optional note */
  updateStatus: (status: ComplaintStatus, note?: string) => Promise<void>;
  /** Add a resolution note to the complaint */
  addNote: (content: string) => Promise<void>;
  /** Manually refetch the complaint */
  refetch: () => Promise<void>;
  /** Update complaint data (for real-time updates) */
  setComplaint: (complaint: Complaint) => void;
}

/**
 * useComplaintDetail - Hook for fetching and managing a single complaint
 *
 * Features:
 * - Fetches single complaint by ID (Requirements: 3.1)
 * - Updates complaint status (Requirements: 3.5)
 * - Adds resolution notes (Requirements: 3.6)
 * - Supports real-time updates
 *
 * @param id - Complaint ID to fetch
 * @returns Complaint detail state and controls
 */
export function useComplaintDetail(id: string): UseComplaintDetailReturn {
  // Data state
  const [complaint, setComplaint] = useState<Complaint | null>(null);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track if component is mounted
  const isMountedRef = useRef(true);

  /**
   * Fetch complaint by ID
   * Requirements: 3.1
   */
  const fetchComplaint = useCallback(async () => {
    if (!isMountedRef.current || !id) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await complaintService.getComplaint(id);

      if (!isMountedRef.current) return;

      setComplaint(data);
    } catch (err) {
      if (!isMountedRef.current) return;

      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch complaint';
      setError(errorMessage);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [id]);

  /**
   * Update complaint status with optional note
   * Requirements: 3.5, 3.6
   */
  const updateStatus = useCallback(
    async (status: ComplaintStatus, note?: string) => {
      if (!id) {
        throw new Error('No complaint ID provided');
      }

      setIsUpdatingStatus(true);
      setError(null);

      try {
        const updatedComplaint = await complaintService.updateStatus(id, status, note);

        if (isMountedRef.current) {
          setComplaint(updatedComplaint);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update status';
        if (isMountedRef.current) {
          setError(errorMessage);
        }
        throw err;
      } finally {
        if (isMountedRef.current) {
          setIsUpdatingStatus(false);
        }
      }
    },
    [id]
  );

  /**
   * Add a resolution note to the complaint
   * Requirements: 3.6
   */
  const addNote = useCallback(
    async (content: string) => {
      if (!id) {
        throw new Error('No complaint ID provided');
      }

      if (!content.trim()) {
        throw new Error('Note content cannot be empty');
      }

      setIsAddingNote(true);
      setError(null);

      try {
        const updatedComplaint = await complaintService.addNote(id, content);

        if (isMountedRef.current) {
          setComplaint(updatedComplaint);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to add note';
        if (isMountedRef.current) {
          setError(errorMessage);
        }
        throw err;
      } finally {
        if (isMountedRef.current) {
          setIsAddingNote(false);
        }
      }
    },
    [id]
  );

  /**
   * Refetch complaint data
   */
  const refetch = useCallback(async () => {
    await fetchComplaint();
  }, [fetchComplaint]);

  // Fetch complaint when ID changes
  useEffect(() => {
    if (id) {
      fetchComplaint();
    }
  }, [id, fetchComplaint]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    complaint,
    isLoading,
    error,
    isUpdatingStatus,
    isAddingNote,
    updateStatus,
    addNote,
    refetch,
    setComplaint,
  };
}

export default useComplaintDetail;
