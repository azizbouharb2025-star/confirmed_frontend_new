/**
 * Subscription Service
 * Handles subscription plan fetching and feature access
 * Requirements: 5.4, 6.2
 */

import api from '@/lib/api';
import logger from '@/lib/logger';
import {
  SubscriptionPlan,
  PLAN_WIDGETS,
  PLAN_HIERARCHY,
  canAccessPlan,
  getPlanDisplayName,
} from '@/types/subscription';

/**
 * Features available for each subscription plan
 */
export interface PlanFeatures {
  widgets: string[];
  maxOperators: number;
  maxAICalls: number;
  advancedAnalytics: boolean;
  predictiveAnalytics: boolean;
}

/**
 * Plan feature configurations
 */
const PLAN_FEATURES: Record<SubscriptionPlan, PlanFeatures> = {
  starter: {
    widgets: PLAN_WIDGETS.starter,
    maxOperators: 5,
    maxAICalls: 100,
    advancedAnalytics: false,
    predictiveAnalytics: false,
  },
  pro: {
    widgets: PLAN_WIDGETS.pro,
    maxOperators: 20,
    maxAICalls: 500,
    advancedAnalytics: true,
    predictiveAnalytics: false,
  },
  business: {
    widgets: PLAN_WIDGETS.business,
    maxOperators: 100,
    maxAICalls: 2000,
    advancedAnalytics: true,
    predictiveAnalytics: false,
  },
  enterprise: {
    widgets: PLAN_WIDGETS.enterprise,
    maxOperators: -1, // unlimited
    maxAICalls: -1, // unlimited
    advancedAnalytics: true,
    predictiveAnalytics: true,
  },
};


/**
 * Subscription API response type
 */
interface SubscriptionResponse {
  plan: SubscriptionPlan;
  status: 'active' | 'cancelled' | 'past_due';
  expiresAt?: string;
}

/**
 * Subscription Service
 * Provides methods for fetching and managing subscription data
 */
export const subscriptionService = {
  /**
   * Fetch the current user's subscription plan from the API
   * Requirements: 6.2
   */
  async getCurrentPlan(): Promise<SubscriptionPlan> {
    try {
      const response = await api.get('/api/subscriptions/current');
      const data = response.data as SubscriptionResponse;
      return data.plan || 'starter';
    } catch (error) {
      logger.error('Failed to fetch subscription plan:', error, 'Subscription');
      // Default to starter plan on error
      return 'starter';
    }
  },

  /**
   * Get the features available for a specific plan
   * Requirements: 5.4
   */
  getPlanFeatures(plan: SubscriptionPlan): PlanFeatures {
    return PLAN_FEATURES[plan];
  },

  /**
   * Check if a feature is accessible for the given plan
   * @param plan - The user's current plan
   * @param featureWidget - The widget/feature identifier to check
   */
  canAccessFeature(plan: SubscriptionPlan, featureWidget: string): boolean {
    const features = PLAN_FEATURES[plan];
    return features.widgets.includes(featureWidget);
  },

  /**
   * Check if a user's plan can access a required plan level
   * @param userPlan - The user's current plan
   * @param requiredPlan - The minimum plan required
   */
  canAccessPlanLevel(userPlan: SubscriptionPlan, requiredPlan: SubscriptionPlan): boolean {
    return canAccessPlan(userPlan, requiredPlan);
  },

  /**
   * Get the URL for upgrading to a specific plan
   * Requirements: 5.4
   * @param targetPlan - The plan to upgrade to
   */
  getUpgradeUrl(targetPlan: SubscriptionPlan): string {
    return `/panel/client/subscription/upgrade?plan=${targetPlan}`;
  },

  /**
   * Get the display name for a plan
   */
  getPlanDisplayName(plan: SubscriptionPlan): string {
    return getPlanDisplayName(plan);
  },

  /**
   * Get the minimum plan required for a specific widget
   * @param widgetId - The widget identifier
   * @returns The minimum plan required, or null if widget not found
   */
  getMinimumPlanForWidget(widgetId: string): SubscriptionPlan | null {
    const plans: SubscriptionPlan[] = ['starter', 'pro', 'business', 'enterprise'];
    
    for (const plan of plans) {
      if (PLAN_WIDGETS[plan].includes(widgetId)) {
        return plan;
      }
    }
    
    return null;
  },

  /**
   * Get all plans with their features for comparison
   */
  getAllPlansWithFeatures(): Array<{ plan: SubscriptionPlan; features: PlanFeatures; displayName: string }> {
    const plans: SubscriptionPlan[] = ['starter', 'pro', 'business', 'enterprise'];
    return plans.map((plan) => ({
      plan,
      features: PLAN_FEATURES[plan],
      displayName: getPlanDisplayName(plan),
    }));
  },
};

export default subscriptionService;
