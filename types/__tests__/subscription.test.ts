/**
 * Feature: order-management-system, Property 1: Subscription tier determines visible columns
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4
 * 
 * Property: For any subscription plan and orders table render, the visible columns 
 * SHALL be exactly those where the column's minimum required plan is less than or 
 * equal to the user's plan.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  SubscriptionPlan,
  PLAN_HIERARCHY,
  hasFeatureAccess,
  ALL_PLANS,
  PLAN_WIDGETS,
  canAccessPlan,
  getWidgetsForPlan,
} from '../subscription';

// Arbitrary for generating subscription plans
const subscriptionPlanArb = fc.constantFrom<SubscriptionPlan>(...ALL_PLANS);

// Column configuration matching the design document
interface ColumnConfig {
  key: string;
  label: string;
  minPlan: SubscriptionPlan;
}

// Define all columns with their minimum required plans per requirements
const ALL_COLUMNS: ColumnConfig[] = [
  // Starter tier columns (Requirements 1.1)
  { key: 'orderId', label: 'Order ID', minPlan: 'starter' },
  { key: 'customerName', label: 'Customer Name', minPlan: 'starter' },
  { key: 'phone', label: 'Phone', minPlan: 'starter' },
  { key: 'status', label: 'Status', minPlan: 'starter' },
  { key: 'totalValue', label: 'Total Value', minPlan: 'starter' },
  
  // Pro tier columns (Requirements 1.2)
  { key: 'aiRiskScore', label: 'AI Risk Score', minPlan: 'pro' },
  { key: 'operatorFeedback', label: 'Operator Feedback', minPlan: 'pro' },
  
  // Business tier columns (Requirements 1.3)
  { key: 'courierAssignment', label: 'Courier Assignment', minPlan: 'business' },
  { key: 'region', label: 'Region', minPlan: 'business' },
  { key: 'complaintFlags', label: 'Complaint Flags', minPlan: 'business' },
  
  // Enterprise tier columns (Requirements 1.4)
  { key: 'isRepeatBuyer', label: 'Repeat Buyer', minPlan: 'enterprise' },
  { key: 'customerLifetimeValue', label: 'Customer Lifetime Value', minPlan: 'enterprise' },
];

/**
 * Get visible columns for a given subscription plan
 * This is the function under test - it determines which columns are visible
 */
function getVisibleColumns(userPlan: SubscriptionPlan): ColumnConfig[] {
  return ALL_COLUMNS.filter((column) => hasFeatureAccess(userPlan, column.minPlan));
}


describe('Subscription Tier Access - Property Tests', () => {
  /**
   * Property 1: Subscription tier determines visible columns
   * For any subscription plan, visible columns are exactly those where
   * column.minPlan <= userPlan in the hierarchy
   */
  it('Property 1: visible columns match subscription tier access rules', () => {
    fc.assert(
      fc.property(subscriptionPlanArb, (userPlan) => {
        const visibleColumns = getVisibleColumns(userPlan);
        const userLevel = PLAN_HIERARCHY[userPlan];

        // All visible columns should have minPlan <= userPlan
        const allVisibleHaveAccess = visibleColumns.every(
          (col) => PLAN_HIERARCHY[col.minPlan] <= userLevel
        );

        // All columns with minPlan <= userPlan should be visible
        const expectedColumns = ALL_COLUMNS.filter(
          (col) => PLAN_HIERARCHY[col.minPlan] <= userLevel
        );
        const hasAllExpectedColumns = expectedColumns.every((expected) =>
          visibleColumns.some((visible) => visible.key === expected.key)
        );

        // No extra columns beyond what's expected
        const noExtraColumns = visibleColumns.length === expectedColumns.length;

        return allVisibleHaveAccess && hasAllExpectedColumns && noExtraColumns;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: hasFeatureAccess is reflexive
   * Any plan should have access to features requiring that same plan
   */
  it('hasFeatureAccess is reflexive - plan has access to its own tier', () => {
    fc.assert(
      fc.property(subscriptionPlanArb, (plan) => {
        return hasFeatureAccess(plan, plan) === true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: hasFeatureAccess respects hierarchy ordering
   * If planA >= planB in hierarchy, then planA has access to planB features
   */
  it('hasFeatureAccess respects plan hierarchy ordering', () => {
    fc.assert(
      fc.property(subscriptionPlanArb, subscriptionPlanArb, (userPlan, requiredPlan) => {
        const userLevel = PLAN_HIERARCHY[userPlan];
        const requiredLevel = PLAN_HIERARCHY[requiredPlan];
        const hasAccess = hasFeatureAccess(userPlan, requiredPlan);

        // Access should be granted iff user level >= required level
        return hasAccess === (userLevel >= requiredLevel);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Higher tier plans see all columns from lower tiers
   * If planA > planB, then visibleColumns(planA) ⊇ visibleColumns(planB)
   */
  it('higher tier plans include all columns from lower tiers', () => {
    fc.assert(
      fc.property(subscriptionPlanArb, subscriptionPlanArb, (planA, planB) => {
        const levelA = PLAN_HIERARCHY[planA];
        const levelB = PLAN_HIERARCHY[planB];

        if (levelA >= levelB) {
          const columnsA = getVisibleColumns(planA);
          const columnsB = getVisibleColumns(planB);

          // All columns visible to planB should be visible to planA
          return columnsB.every((colB) =>
            columnsA.some((colA) => colA.key === colB.key)
          );
        }
        return true; // Skip if planA < planB
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Starter plan sees exactly base columns
   * Starter should see only columns with minPlan = 'starter'
   */
  it('starter plan sees exactly the base columns', () => {
    const starterColumns = getVisibleColumns('starter');
    const baseColumns = ALL_COLUMNS.filter((col) => col.minPlan === 'starter');

    expect(starterColumns.length).toBe(baseColumns.length);
    expect(starterColumns.map((c) => c.key).sort()).toEqual(
      baseColumns.map((c) => c.key).sort()
    );
  });

  /**
   * Property: Enterprise plan sees all columns
   * Enterprise (highest tier) should see every column
   */
  it('enterprise plan sees all columns', () => {
    const enterpriseColumns = getVisibleColumns('enterprise');
    expect(enterpriseColumns.length).toBe(ALL_COLUMNS.length);
  });
});

/**
 * Feature: subscription-tiered-dashboards, Property 1: Plan hierarchy determines visible widgets
 * Validates: Requirements 1.1, 2.1, 3.1, 4.1
 * 
 * Property: For any subscription plan, the visible widgets SHALL be exactly those 
 * defined in PLAN_WIDGETS for that plan, which includes all widgets from lower 
 * tiers plus plan-specific widgets.
 */
describe('Plan Hierarchy Determines Visible Widgets - Property Tests', () => {
  /**
   * Property 1: Plan hierarchy determines visible widgets
   * For any subscription plan, visible widgets are exactly those defined in PLAN_WIDGETS
   */
  it('Property 1: visible widgets match PLAN_WIDGETS for each plan', () => {
    fc.assert(
      fc.property(subscriptionPlanArb, (userPlan) => {
        const visibleWidgets = getWidgetsForPlan(userPlan);
        const expectedWidgets = PLAN_WIDGETS[userPlan];

        // Visible widgets should exactly match PLAN_WIDGETS definition
        return (
          visibleWidgets.length === expectedWidgets.length &&
          visibleWidgets.every((widget) => expectedWidgets.includes(widget))
        );
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Higher tier plans include all widgets from lower tiers
   * If planA > planB in hierarchy, then widgets(planA) ⊇ widgets(planB)
   */
  it('higher tier plans include all widgets from lower tiers', () => {
    fc.assert(
      fc.property(subscriptionPlanArb, subscriptionPlanArb, (planA, planB) => {
        const levelA = PLAN_HIERARCHY[planA];
        const levelB = PLAN_HIERARCHY[planB];

        if (levelA >= levelB) {
          const widgetsA = getWidgetsForPlan(planA);
          const widgetsB = getWidgetsForPlan(planB);

          // All widgets available to planB should be available to planA
          return widgetsB.every((widget) => widgetsA.includes(widget));
        }
        return true; // Skip if planA < planB
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: canAccessPlan is consistent with PLAN_HIERARCHY
   * canAccessPlan(userPlan, requiredPlan) should be true iff userPlan >= requiredPlan in hierarchy
   */
  it('canAccessPlan is consistent with PLAN_HIERARCHY', () => {
    fc.assert(
      fc.property(subscriptionPlanArb, subscriptionPlanArb, (userPlan, requiredPlan) => {
        const userLevel = PLAN_HIERARCHY[userPlan];
        const requiredLevel = PLAN_HIERARCHY[requiredPlan];
        const hasAccess = canAccessPlan(userPlan, requiredPlan);

        return hasAccess === (userLevel >= requiredLevel);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Starter plan has exactly base widgets
   */
  it('starter plan has exactly base widgets (kpi-basic, recent-orders)', () => {
    const starterWidgets = getWidgetsForPlan('starter');
    expect(starterWidgets).toEqual(['kpi-basic', 'recent-orders']);
  });

  /**
   * Property: Enterprise plan has all widgets
   */
  it('enterprise plan has all widgets including predictive and automation', () => {
    const enterpriseWidgets = getWidgetsForPlan('enterprise');
    expect(enterpriseWidgets).toContain('kpi-basic');
    expect(enterpriseWidgets).toContain('recent-orders');
    expect(enterpriseWidgets).toContain('risk-score');
    expect(enterpriseWidgets).toContain('operator-feedback');
    expect(enterpriseWidgets).toContain('complaints');
    expect(enterpriseWidgets).toContain('courier-performance');
    expect(enterpriseWidgets).toContain('predictive');
    expect(enterpriseWidgets).toContain('automation');
  });

  /**
   * Property: Widget count increases with plan tier
   */
  it('widget count increases or stays same as plan tier increases', () => {
    fc.assert(
      fc.property(subscriptionPlanArb, subscriptionPlanArb, (planA, planB) => {
        const levelA = PLAN_HIERARCHY[planA];
        const levelB = PLAN_HIERARCHY[planB];
        const widgetsA = getWidgetsForPlan(planA);
        const widgetsB = getWidgetsForPlan(planB);

        if (levelA > levelB) {
          return widgetsA.length >= widgetsB.length;
        }
        return true;
      }),
      { numRuns: 100 }
    );
  });
});

describe('hasFeatureAccess - Unit Tests', () => {
  it('starter has access to starter features', () => {
    expect(hasFeatureAccess('starter', 'starter')).toBe(true);
  });

  it('starter does not have access to pro features', () => {
    expect(hasFeatureAccess('starter', 'pro')).toBe(false);
  });

  it('pro has access to starter and pro features', () => {
    expect(hasFeatureAccess('pro', 'starter')).toBe(true);
    expect(hasFeatureAccess('pro', 'pro')).toBe(true);
  });

  it('business has access to starter, pro, and business features', () => {
    expect(hasFeatureAccess('business', 'starter')).toBe(true);
    expect(hasFeatureAccess('business', 'pro')).toBe(true);
    expect(hasFeatureAccess('business', 'business')).toBe(true);
  });

  it('enterprise has access to all features', () => {
    expect(hasFeatureAccess('enterprise', 'starter')).toBe(true);
    expect(hasFeatureAccess('enterprise', 'pro')).toBe(true);
    expect(hasFeatureAccess('enterprise', 'business')).toBe(true);
    expect(hasFeatureAccess('enterprise', 'enterprise')).toBe(true);
  });
});
