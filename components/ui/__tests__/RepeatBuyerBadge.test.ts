/**
 * Feature: order-management-system, Property 18: Repeat buyer badge visibility
 * Validates: Requirements 8.5
 * 
 * Property: For any order where isRepeatBuyer is true, the order display 
 * SHALL include a repeat customer badge.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { shouldShowRepeatBuyerBadge } from '../RepeatBuyerBadge';

// Arbitrary for generating boolean values
const booleanArb = fc.boolean();

describe('RepeatBuyerBadge - Property Tests', () => {
  /**
   * Property 18: Repeat buyer badge visibility
   * Badge is shown if and only if isRepeatBuyer is true
   */
  it('Property 18: badge is visible when isRepeatBuyer is true', () => {
    fc.assert(
      fc.property(booleanArb, (isRepeatBuyer) => {
        const shouldShow = shouldShowRepeatBuyerBadge(isRepeatBuyer);
        
        // Badge should be shown if and only if isRepeatBuyer is true
        return shouldShow === isRepeatBuyer;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Badge visibility is deterministic
   * For any given isRepeatBuyer value, the result is always the same
   */
  it('badge visibility is deterministic', () => {
    fc.assert(
      fc.property(booleanArb, (isRepeatBuyer) => {
        const result1 = shouldShowRepeatBuyerBadge(isRepeatBuyer);
        const result2 = shouldShowRepeatBuyerBadge(isRepeatBuyer);
        
        return result1 === result2;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: True always shows badge
   * When isRepeatBuyer is true, badge should always be visible
   */
  it('true always shows badge', () => {
    fc.assert(
      fc.property(fc.constant(true), (isRepeatBuyer) => {
        return shouldShowRepeatBuyerBadge(isRepeatBuyer) === true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: False never shows badge
   * When isRepeatBuyer is false, badge should never be visible
   */
  it('false never shows badge', () => {
    fc.assert(
      fc.property(fc.constant(false), (isRepeatBuyer) => {
        return shouldShowRepeatBuyerBadge(isRepeatBuyer) === false;
      }),
      { numRuns: 100 }
    );
  });
});

describe('RepeatBuyerBadge - Unit Tests', () => {
  it('shows badge when isRepeatBuyer is true', () => {
    expect(shouldShowRepeatBuyerBadge(true)).toBe(true);
  });

  it('hides badge when isRepeatBuyer is false', () => {
    expect(shouldShowRepeatBuyerBadge(false)).toBe(false);
  });
});
