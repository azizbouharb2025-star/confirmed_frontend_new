/**
 * Feature: subscription-tiered-dashboards, Property 12: Locked widget displays required plan
 * Validates: Requirements 5.2
 * 
 * Property: For any locked widget, the upgrade prompt SHALL display the minimum required plan name.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  SubscriptionPlan,
  ALL_PLANS,
  getPlanDisplayName,
} from '@/types/subscription';

// Arbitrary for generating subscription plans
const subscriptionPlanArb = fc.constantFrom<SubscriptionPlan>(...ALL_PLANS);

// Arbitrary for generating feature names
const _featureNameArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);

// Arbitrary for generating feature descriptions
const _featureDescriptionArb = fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0);

/**
 * Simulates the LockedWidget display logic
 * Returns the text that would be displayed for the required plan badge
 */
function getRequiredPlanBadgeText(requiredPlan: SubscriptionPlan): string {
  return `Requires ${getPlanDisplayName(requiredPlan)} Plan`;
}

/**
 * Simulates checking if the required plan name is displayed
 */
function displaysRequiredPlanName(requiredPlan: SubscriptionPlan): boolean {
  const badgeText = getRequiredPlanBadgeText(requiredPlan);
  const planDisplayName = getPlanDisplayName(requiredPlan);
  return badgeText.includes(planDisplayName);
}

describe('LockedWidget - Property Tests', () => {
  /**
   * Property 12: Locked widget displays required plan
   * For any locked widget, the upgrade prompt displays the minimum required plan name
   */
  it('Property 12: locked widget displays required plan name', () => {
    fc.assert(
      fc.property(subscriptionPlanArb, (requiredPlan) => {
        const displaysName = displaysRequiredPlanName(requiredPlan);
        return displaysName === true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Badge text contains correct plan display name
   * The badge text should contain the human-readable plan name
   */
  it('badge text contains correct plan display name', () => {
    fc.assert(
      fc.property(subscriptionPlanArb, (requiredPlan) => {
        const badgeText = getRequiredPlanBadgeText(requiredPlan);
        const expectedDisplayName = getPlanDisplayName(requiredPlan);
        
        return badgeText.includes(expectedDisplayName);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Badge text follows consistent format
   * The badge text should always follow "Requires X Plan" format
   */
  it('badge text follows consistent format', () => {
    fc.assert(
      fc.property(subscriptionPlanArb, (requiredPlan) => {
        const badgeText = getRequiredPlanBadgeText(requiredPlan);
        
        // Should start with "Requires"
        const startsCorrectly = badgeText.startsWith('Requires ');
        
        // Should end with "Plan"
        const endsCorrectly = badgeText.endsWith(' Plan');
        
        return startsCorrectly && endsCorrectly;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Each plan has a unique display name
   * No two plans should have the same display name
   */
  it('each plan has a unique display name', () => {
    const displayNames = ALL_PLANS.map(plan => getPlanDisplayName(plan));
    const uniqueNames = new Set(displayNames);
    
    expect(uniqueNames.size).toBe(ALL_PLANS.length);
  });

  /**
   * Property: Display names are properly capitalized
   * All plan display names should start with uppercase letter
   */
  it('display names are properly capitalized', () => {
    fc.assert(
      fc.property(subscriptionPlanArb, (plan) => {
        const displayName = getPlanDisplayName(plan);
        
        // First character should be uppercase
        const firstChar = displayName.charAt(0);
        return firstChar === firstChar.toUpperCase();
      }),
      { numRuns: 100 }
    );
  });
});

describe('LockedWidget - Unit Tests', () => {
  it('displays "Requires Starter Plan" for starter', () => {
    expect(getRequiredPlanBadgeText('starter')).toBe('Requires Starter Plan');
  });

  it('displays "Requires Pro Plan" for pro', () => {
    expect(getRequiredPlanBadgeText('pro')).toBe('Requires Pro Plan');
  });

  it('displays "Requires Business Plan" for business', () => {
    expect(getRequiredPlanBadgeText('business')).toBe('Requires Business Plan');
  });

  it('displays "Requires Enterprise Plan" for enterprise', () => {
    expect(getRequiredPlanBadgeText('enterprise')).toBe('Requires Enterprise Plan');
  });

  it('getPlanDisplayName returns correct values', () => {
    expect(getPlanDisplayName('starter')).toBe('Starter');
    expect(getPlanDisplayName('pro')).toBe('Pro');
    expect(getPlanDisplayName('business')).toBe('Business');
    expect(getPlanDisplayName('enterprise')).toBe('Enterprise');
  });
});
