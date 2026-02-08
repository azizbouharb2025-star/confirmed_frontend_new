'use client';

/**
 * useSubscription Hook
 * Provides subscription plan data and access control helpers
 * Requirements: 2.4, 3.4, 4.4, 6.2
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { subscriptionService, PlanFeatures } from '@/services/subscriptionService';
import { SubscriptionPlan, canAccessPlan, getPlanDisplayName } from '@/types/subscription';
import toast from 'react-hot-toast';
import logger from '@/lib/logger';

/** Callback type for subscription change events */
export type SubscriptionChangeCallback = (newPlan: SubscriptionPlan, oldPlan: SubscriptionPlan) => void;

/** Subscription change event for external listeners */
export interface SubscriptionChangeEvent {
  newPlan: SubscriptionPlan;
  oldPlan: SubscriptionPlan;
  timestamp: Date;
}

export interface UseSubscriptionReturn {
  /** Current subscription plan */
  plan: SubscriptionPlan;
  /** Previous subscription plan (before last change) */
  previousPlan: SubscriptionPlan | null;
  /** Features available for the current plan */
  features: PlanFeatures;
  /** Whether subscription data is loading */
  isLoading: boolean;
  /** Error message if subscription fetch failed */
  error: string | null;
  /** Check if user can access a required plan level */
  canAccess: (requiredPlan: SubscriptionPlan) => boolean;
  /** Get upgrade URL for a target plan */
  getUpgradeUrl: (targetPlan: SubscriptionPlan) => string;
  /** Refresh subscription data */
  refetch: () => Promise<void>;
  /** Register a callback for subscription changes */
  onPlanChange: (callback: SubscriptionChangeCallback) => () => void;
  /** Timestamp of last plan change */
  lastPlanChange: Date | null;
}

/** Polling interval for subscription changes (30 seconds) */
const SUBSCRIPTION_POLL_INTERVAL = 30000;

/**
 * Hook for managing subscription state and access control
 * Fetches and caches the user's subscription plan
 * Requirements: 6.2 - Listen for subscription updates and trigger dashboard refresh
 */
export function useSubscription(): UseSubscriptionReturn {
  const { user, isAuthenticated } = useAuth();
  const [plan, setPlan] = useState<SubscriptionPlan>('starter');
  const [previousPlan, setPreviousPlan] = useState<SubscriptionPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastPlanChange, setLastPlanChange] = useState<Date | null>(null);
  
  // Track mounted state to prevent state updates after unmount
  const isMountedRef = useRef(true);
  // Store change callbacks
  const changeCallbacksRef = useRef<Set<SubscriptionChangeCallback>>(new Set());
  // Track if this is the initial load (to avoid showing toast on first load)
  const isInitialLoadRef = useRef(true);
  // Polling interval ref
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  // Track current plan in ref to avoid dependency issues
  const planRef = useRef(plan);
  
  // Keep planRef in sync
  useEffect(() => {
    planRef.current = plan;
  }, [plan]);

  /**
   * Notify all registered callbacks of a plan change
   * Requirements: 6.2 - Trigger dashboard refresh on plan change
   */
  const notifyPlanChange = useCallback((newPlan: SubscriptionPlan, oldPlan: SubscriptionPlan) => {
    changeCallbacksRef.current.forEach((callback) => {
      try {
        callback(newPlan, oldPlan);
      } catch (err) {
        logger.error('Error in subscription change callback:', err, 'Subscription');
      }
    });
  }, []);

  /**
   * Handle plan change - update state, show toast, notify callbacks
   * Requirements: 6.2 - Show toast notification on plan change
   */
  const handlePlanChange = useCallback((newPlan: SubscriptionPlan, oldPlan: SubscriptionPlan) => {
    if (!isMountedRef.current) return;
    
    setPreviousPlan(oldPlan);
    setPlan(newPlan);
    setLastPlanChange(new Date());
    
    // Show toast notification for plan changes (not on initial load)
    if (!isInitialLoadRef.current) {
      const newPlanName = getPlanDisplayName(newPlan);
      const oldPlanName = getPlanDisplayName(oldPlan);
      const isUpgrade = canAccessPlan(newPlan, oldPlan) && newPlan !== oldPlan;
      
      if (isUpgrade) {
        toast.success(`🎉 Upgraded to ${newPlanName}! New features are now available.`, {
          duration: 5000,
          position: 'top-right',
        });
      } else if (newPlan !== oldPlan) {
        toast(`Your plan has changed from ${oldPlanName} to ${newPlanName}`, {
          duration: 5000,
          position: 'top-right',
          icon: '📋',
        });
      }
      
      // Notify all registered callbacks
      notifyPlanChange(newPlan, oldPlan);
    }
  }, [notifyPlanChange]);

  /**
   * Fetch subscription plan from API or user data
   */
  const fetchSubscription = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    setIsLoading(true);
    setError(null);

    try {
      let fetchedPlan: SubscriptionPlan = 'starter';
      
      // First check if user has subscription plan in their profile
      if (user?.subscriptionPlan) {
        fetchedPlan = user.subscriptionPlan;
      } else if (isAuthenticated) {
        // Otherwise fetch from API
        fetchedPlan = await subscriptionService.getCurrentPlan();
      }
      
      if (!isMountedRef.current) return;
      
      // Check if plan has changed (use ref to avoid stale closure)
      const currentPlan = planRef.current;
      if (fetchedPlan !== currentPlan) {
        handlePlanChange(fetchedPlan, currentPlan);
      } else if (isInitialLoadRef.current) {
        // Set initial plan without triggering change notification
        setPlan(fetchedPlan);
      }
      
      isInitialLoadRef.current = false;
    } catch (err) {
      if (!isMountedRef.current) return;
      
      logger.error('Failed to fetch subscription:', err, 'Subscription');
      setError('Failed to load subscription data');
      // Default to starter on error
      setPlan('starter');
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [user, isAuthenticated, handlePlanChange]);

  /**
   * Register a callback for subscription changes
   * Returns an unsubscribe function
   */
  const onPlanChange = useCallback((callback: SubscriptionChangeCallback): (() => void) => {
    changeCallbacksRef.current.add(callback);
    return () => {
      changeCallbacksRef.current.delete(callback);
    };
  }, []);

  // Fetch subscription on mount and when auth changes
  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  /**
   * Set up polling for subscription changes
   * Requirements: 6.2 - Listen for subscription updates
   */
  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Poll for subscription changes
    pollIntervalRef.current = setInterval(() => {
      if (isMountedRef.current && !isLoading) {
        fetchSubscription();
      }
    }, SUBSCRIPTION_POLL_INTERVAL);
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [isAuthenticated, isLoading, fetchSubscription]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      changeCallbacksRef.current.clear();
    };
  }, []);

  /**
   * Check if user can access a required plan level
   * Requirements: 2.4, 3.4, 4.4
   */
  const canAccess = useCallback(
    (requiredPlan: SubscriptionPlan): boolean => {
      return canAccessPlan(plan, requiredPlan);
    },
    [plan]
  );

  /**
   * Get upgrade URL for a target plan
   */
  const getUpgradeUrl = useCallback((targetPlan: SubscriptionPlan): string => {
    return subscriptionService.getUpgradeUrl(targetPlan);
  }, []);

  /**
   * Get features for the current plan
   */
  const features = subscriptionService.getPlanFeatures(plan);

  return {
    plan,
    previousPlan,
    features,
    isLoading,
    error,
    canAccess,
    getUpgradeUrl,
    refetch: fetchSubscription,
    onPlanChange,
    lastPlanChange,
  };
}

export default useSubscription;
