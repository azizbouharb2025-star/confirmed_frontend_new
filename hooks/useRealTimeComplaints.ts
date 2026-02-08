'use client';

/**
 * useRealTimeComplaints Hook
 * Subscribes to WebSocket complaint events for real-time updates
 * Requirements: 2.4, 2.5
 */

import { useEffect, useCallback, useRef } from 'react';
import { useWebSocketContext } from '@/components/providers/WebSocketProvider';
import { Complaint } from '@/types/complaint';

/**
 * Callback type for new complaint events
 */
export type OnNewComplaintCallback = (complaint: Complaint) => void;

/**
 * Callback type for complaint update events
 */
export type OnUpdateComplaintCallback = (complaint: Complaint) => void;

/**
 * Return type for useRealTimeComplaints hook
 */
export interface UseRealTimeComplaintsReturn {
  /** Whether WebSocket is connected */
  isConnected: boolean;
}

/**
 * useRealTimeComplaints - Hook for subscribing to real-time complaint events
 *
 * Features:
 * - Subscribes to 'complaint:new' events (Requirements: 2.4)
 * - Subscribes to 'complaint:update' events (Requirements: 2.5)
 * - Provides connection state
 * - Automatically cleans up subscriptions on unmount
 *
 * @param onNew - Callback for new complaint events
 * @param onUpdate - Callback for complaint update events
 * @returns Connection state
 *
 * @example
 * const { isConnected } = useRealTimeComplaints(
 *   (complaint) => console.log('New complaint:', complaint),
 *   (complaint) => console.log('Updated complaint:', complaint)
 * );
 */
export function useRealTimeComplaints(
  onNew: OnNewComplaintCallback,
  onUpdate: OnUpdateComplaintCallback
): UseRealTimeComplaintsReturn {
  const { socket, isConnected } = useWebSocketContext();

  // Store callbacks in refs to avoid re-subscribing on every render
  const onNewRef = useRef(onNew);
  const onUpdateRef = useRef(onUpdate);

  // Update refs when callbacks change
  useEffect(() => {
    onNewRef.current = onNew;
  }, [onNew]);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  /**
   * Handle new complaint event
   * Requirements: 2.4
   */
  const handleNewComplaint = useCallback((message: { payload: Complaint }) => {
    if (message?.payload) {
      onNewRef.current(message.payload);
    }
  }, []);

  /**
   * Handle complaint update event
   * Requirements: 2.5
   */
  const handleComplaintUpdate = useCallback((message: { payload: Complaint }) => {
    if (message?.payload) {
      onUpdateRef.current(message.payload);
    }
  }, []);

  // Subscribe to WebSocket events
  useEffect(() => {
    if (!socket) return;

    // Subscribe to complaint events
    socket.on('complaint:new', handleNewComplaint);
    socket.on('complaint:update', handleComplaintUpdate);

    // Cleanup subscriptions on unmount
    return () => {
      socket.off('complaint:new', handleNewComplaint);
      socket.off('complaint:update', handleComplaintUpdate);
    };
  }, [socket, handleNewComplaint, handleComplaintUpdate]);

  return {
    isConnected,
  };
}

export default useRealTimeComplaints;
