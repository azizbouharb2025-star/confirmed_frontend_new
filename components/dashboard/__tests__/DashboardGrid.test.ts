/**
 * Feature: subscription-tiered-dashboards, Property 11: Viewport size determines grid layout
 * Validates: Requirements 9.1, 9.2, 9.3
 * 
 * Property: For any viewport width, the dashboard grid SHALL use:
 * - 1 column for mobile (<768px)
 * - 2 columns for tablet (768-1024px)
 * - 3+ columns for desktop (>1024px)
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getGridColumns, BREAKPOINTS } from '../DashboardGrid';

// Arbitrary for generating viewport widths in realistic ranges
const mobileWidthArb = fc.integer({ min: 320, max: BREAKPOINTS.mobile - 1 });
const tabletWidthArb = fc.integer({ min: BREAKPOINTS.mobile, max: BREAKPOINTS.tablet - 1 });
const desktopWidthArb = fc.integer({ min: BREAKPOINTS.tablet, max: 2560 });
const anyViewportWidthArb = fc.integer({ min: 320, max: 2560 });

// Arbitrary for desktop column options
const desktopColumnsArb = fc.constantFrom<3 | 4>(3, 4);

describe('DashboardGrid Responsive Layout - Property Tests', () => {
  /**
   * Property 11: Viewport size determines grid layout
   * Mobile (<768px) should always return 1 column
   */
  it('Property 11: mobile viewport (<768px) returns 1 column', () => {
    fc.assert(
      fc.property(mobileWidthArb, desktopColumnsArb, (width, desktopCols) => {
        const columns = getGridColumns(width, desktopCols);
        return columns === 1;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 11: Viewport size determines grid layout
   * Tablet (768-1024px) should always return 2 columns
   */
  it('Property 11: tablet viewport (768-1024px) returns 2 columns', () => {
    fc.assert(
      fc.property(tabletWidthArb, desktopColumnsArb, (width, desktopCols) => {
        const columns = getGridColumns(width, desktopCols);
        return columns === 2;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 11: Viewport size determines grid layout
   * Desktop (>1024px) should return 3+ columns based on desktopColumns prop
   */
  it('Property 11: desktop viewport (>1024px) returns 3+ columns', () => {
    fc.assert(
      fc.property(desktopWidthArb, desktopColumnsArb, (width, desktopCols) => {
        const columns = getGridColumns(width, desktopCols);
        return columns >= 3 && columns === desktopCols;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Column count is monotonically non-decreasing with viewport width
   * Larger viewports should have >= columns than smaller viewports
   */
  it('column count is monotonically non-decreasing with viewport width', () => {
    fc.assert(
      fc.property(anyViewportWidthArb, anyViewportWidthArb, desktopColumnsArb, (widthA, widthB, desktopCols) => {
        const columnsA = getGridColumns(widthA, desktopCols);
        const columnsB = getGridColumns(widthB, desktopCols);

        if (widthA <= widthB) {
          return columnsA <= columnsB;
        }
        return columnsA >= columnsB;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Breakpoint boundaries are respected
   * At exactly the breakpoint, the higher column count should apply
   */
  it('breakpoint boundaries are respected (inclusive upper bound)', () => {
    // At exactly 768px, should be tablet (2 columns)
    expect(getGridColumns(BREAKPOINTS.mobile)).toBe(2);
    // At exactly 1024px, should be desktop (3+ columns)
    expect(getGridColumns(BREAKPOINTS.tablet)).toBe(3);
    // Just below 768px, should be mobile (1 column)
    expect(getGridColumns(BREAKPOINTS.mobile - 1)).toBe(1);
    // Just below 1024px, should be tablet (2 columns)
    expect(getGridColumns(BREAKPOINTS.tablet - 1)).toBe(2);
  });

  /**
   * Property: Default desktop columns is 3
   */
  it('default desktop columns is 3 when not specified', () => {
    fc.assert(
      fc.property(desktopWidthArb, (width) => {
        const columns = getGridColumns(width); // No desktopColumns specified
        return columns === 3;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Desktop columns can be configured to 4
   */
  it('desktop columns can be configured to 4', () => {
    fc.assert(
      fc.property(desktopWidthArb, (width) => {
        const columns = getGridColumns(width, 4);
        return columns === 4;
      }),
      { numRuns: 100 }
    );
  });
});

describe('DashboardGrid - Unit Tests', () => {
  it('returns 1 column for typical mobile width (375px)', () => {
    expect(getGridColumns(375)).toBe(1);
  });

  it('returns 2 columns for typical tablet width (800px)', () => {
    expect(getGridColumns(800)).toBe(2);
  });

  it('returns 3 columns for typical desktop width (1280px)', () => {
    expect(getGridColumns(1280)).toBe(3);
  });

  it('returns 4 columns for desktop when configured', () => {
    expect(getGridColumns(1280, 4)).toBe(4);
  });

  it('BREAKPOINTS constants are correct', () => {
    expect(BREAKPOINTS.mobile).toBe(768);
    expect(BREAKPOINTS.tablet).toBe(1024);
  });
});
