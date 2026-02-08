/**
 * Subscription Plan Types and Utilities
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

/**
 * Available subscription plans in order of feature access
 */
export type SubscriptionPlan = 'starter' | 'pro' | 'business' | 'enterprise';

/**
 * Hierarchy of subscription plans for feature access comparison
 * Higher number = more features available
 */
export const PLAN_HIERARCHY: Record<SubscriptionPlan, number> = {
  starter: 0,
  pro: 1,
  business: 2,
  enterprise: 3,
};

/**
 * Check if a user's subscription plan has access to a feature
 * that requires a specific minimum plan.
 * 
 * @param userPlan - The user's current subscription plan
 * @param requiredPlan - The minimum plan required for the feature
 * @returns true if the user has access, false otherwise
 * 
 * @example
 * hasFeatureAccess('pro', 'starter') // true - pro >= starter
 * hasFeatureAccess('starter', 'pro') // false - starter < pro
 * hasFeatureAccess('enterprise', 'business') // true - enterprise >= business
 */
export function hasFeatureAccess(
  userPlan: SubscriptionPlan,
  requiredPlan: SubscriptionPlan
): boolean {
  return PLAN_HIERARCHY[userPlan] >= PLAN_HIERARCHY[requiredPlan];
}

/**
 * Get all plans that have access to a feature requiring a specific plan
 * 
 * @param requiredPlan - The minimum plan required for the feature
 * @returns Array of plans that have access
 */
export function getPlansWithAccess(requiredPlan: SubscriptionPlan): SubscriptionPlan[] {
  const requiredLevel = PLAN_HIERARCHY[requiredPlan];
  return (Object.keys(PLAN_HIERARCHY) as SubscriptionPlan[]).filter(
    (plan) => PLAN_HIERARCHY[plan] >= requiredLevel
  );
}

/**
 * Get the display name for a subscription plan
 */
export function getPlanDisplayName(plan: SubscriptionPlan): string {
  const displayNames: Record<SubscriptionPlan, string> = {
    starter: 'Starter',
    pro: 'Pro',
    business: 'Business',
    enterprise: 'Enterprise',
  };
  return displayNames[plan];
}

/**
 * All available subscription plans in order
 */
export const ALL_PLANS: SubscriptionPlan[] = ['starter', 'pro', 'business', 'enterprise'];

/**
 * Widgets available for each subscription plan
 * Each plan includes all widgets from lower tiers plus plan-specific widgets
 * Requirements: 1.1, 2.1, 3.1, 4.1
 */
export const PLAN_WIDGETS: Record<SubscriptionPlan, string[]> = {
  starter: ['kpi-basic', 'recent-orders'],
  pro: ['kpi-basic', 'recent-orders', 'risk-score', 'operator-feedback'],
  business: ['kpi-basic', 'recent-orders', 'risk-score', 'operator-feedback', 'complaints', 'courier-performance'],
  enterprise: ['kpi-basic', 'recent-orders', 'risk-score', 'operator-feedback', 'complaints', 'courier-performance', 'predictive', 'automation'],
};

/**
 * Check if a user's plan can access a required plan level
 * Alias for hasFeatureAccess for semantic clarity
 * 
 * @param userPlan - The user's current subscription plan
 * @param requiredPlan - The minimum plan required
 * @returns true if the user's plan is at or above the required plan level
 */
export function canAccessPlan(
  userPlan: SubscriptionPlan,
  requiredPlan: SubscriptionPlan
): boolean {
  return PLAN_HIERARCHY[userPlan] >= PLAN_HIERARCHY[requiredPlan];
}

/**
 * Get the widgets available for a specific plan
 * 
 * @param plan - The subscription plan
 * @returns Array of widget identifiers available for the plan
 */
export function getWidgetsForPlan(plan: SubscriptionPlan): string[] {
  return PLAN_WIDGETS[plan];
}

/**
 * Check if a specific widget is available for a plan
 * 
 * @param plan - The subscription plan
 * @param widgetId - The widget identifier to check
 * @returns true if the widget is available for the plan
 */
export function canAccessWidget(plan: SubscriptionPlan, widgetId: string): boolean {
  return PLAN_WIDGETS[plan].includes(widgetId);
}
