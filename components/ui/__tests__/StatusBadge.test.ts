/**
 * Feature: order-management-system, Property 16: Status badge color mapping
 * Validates: Requirements 8.1
 * 
 * Property: For any order status, the StatusBadge component SHALL render with 
 * the correct color: green for confirmed, red for rejected, yellow for pending, 
 * blue for in_progress.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { OrderStatus } from '@/types/order';
import { 
  STATUS_COLORS, 
  getStatusColorCategory,
  STATUS_LABELS 
} from '../StatusBadge';

// All valid order statuses
const ALL_STATUSES: OrderStatus[] = ['pending', 'assigned', 'in_progress', 'confirmed', 'rejected', 'cancelled'];

// Arbitrary for generating order statuses
const orderStatusArb = fc.constantFrom<OrderStatus>(...ALL_STATUSES);

// Expected color mapping per Requirements 8.1
const EXPECTED_COLOR_MAPPING: Record<OrderStatus, 'green' | 'red' | 'yellow' | 'blue' | 'purple' | 'gray'> = {
  confirmed: 'green',
  rejected: 'red',
  pending: 'yellow',
  in_progress: 'blue',
  assigned: 'purple',
  cancelled: 'gray',
};

describe('StatusBadge - Property Tests', () => {
  /**
   * Property 16: Status badge color mapping
   * For any order status, the color category matches the expected mapping
   */
  it('Property 16: status badge displays correct color for each status', () => {
    fc.assert(
      fc.property(orderStatusArb, (status) => {
        const actualColor = getStatusColorCategory(status);
        const expectedColor = EXPECTED_COLOR_MAPPING[status];
        
        return actualColor === expectedColor;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Every status has a defined color configuration
   * For any valid status, STATUS_COLORS should have bg, text, and border classes
   */
  it('every status has complete color configuration', () => {
    fc.assert(
      fc.property(orderStatusArb, (status) => {
        const colors = STATUS_COLORS[status];
        
        // Must have all three color properties
        const hasBg = typeof colors.bg === 'string' && colors.bg.length > 0;
        const hasText = typeof colors.text === 'string' && colors.text.length > 0;
        const hasBorder = typeof colors.border === 'string' && colors.border.length > 0;
        
        return hasBg && hasText && hasBorder;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Color classes contain the expected color name
   * For any status, the bg class should contain the expected color name
   */
  it('color classes contain the expected color name', () => {
    fc.assert(
      fc.property(orderStatusArb, (status) => {
        const colors = STATUS_COLORS[status];
        const expectedColor = EXPECTED_COLOR_MAPPING[status];
        
        // The bg class should contain the color name
        return colors.bg.includes(expectedColor);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Every status has a display label
   * For any valid status, STATUS_LABELS should return a non-empty string
   */
  it('every status has a display label', () => {
    fc.assert(
      fc.property(orderStatusArb, (status) => {
        const label = STATUS_LABELS[status];
        return typeof label === 'string' && label.length > 0;
      }),
      { numRuns: 100 }
    );
  });
});

describe('StatusBadge - Unit Tests', () => {
  it('confirmed status maps to green', () => {
    expect(getStatusColorCategory('confirmed')).toBe('green');
    expect(STATUS_COLORS.confirmed.bg).toContain('green');
  });

  it('rejected status maps to red', () => {
    expect(getStatusColorCategory('rejected')).toBe('red');
    expect(STATUS_COLORS.rejected.bg).toContain('red');
  });

  it('pending status maps to yellow', () => {
    expect(getStatusColorCategory('pending')).toBe('yellow');
    expect(STATUS_COLORS.pending.bg).toContain('yellow');
  });

  it('in_progress status maps to blue', () => {
    expect(getStatusColorCategory('in_progress')).toBe('blue');
    expect(STATUS_COLORS.in_progress.bg).toContain('blue');
  });

  it('assigned status maps to purple', () => {
    expect(getStatusColorCategory('assigned')).toBe('purple');
    expect(STATUS_COLORS.assigned.bg).toContain('purple');
  });

  it('cancelled status maps to gray', () => {
    expect(getStatusColorCategory('cancelled')).toBe('gray');
    expect(STATUS_COLORS.cancelled.bg).toContain('gray');
  });
});
