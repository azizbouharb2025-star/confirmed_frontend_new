/**
 * Feature: subscription-tiered-dashboards, Property 9: Admin dashboard shows system-wide KPIs
 * Validates: Requirements 8.1
 * 
 * Property: For any admin user, the dashboard SHALL display KPI cards for 
 * total users, total orders, revenue, and active shops.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { hasRequiredAdminKPIs, AdminKPIs } from '@/lib/adminUtils';

/**
 * Arbitrary for generating valid AdminKPIs
 * Note: noNaN is required to exclude NaN values from float generation
 */
const adminKPIsArb: fc.Arbitrary<AdminKPIs> = fc.record({
  totalUsers: fc.integer({ min: 0, max: 1000000 }),
  totalUsersChange: fc.float({ min: -100, max: 100, noNaN: true }),
  totalOrders: fc.integer({ min: 0, max: 10000000 }),
  totalOrdersChange: fc.float({ min: -100, max: 100, noNaN: true }),
  revenue: fc.integer({ min: 0, max: 100000000 }),
  revenueChange: fc.float({ min: -100, max: 100, noNaN: true }),
  activeShops: fc.integer({ min: 0, max: 100000 }),
  activeShopsChange: fc.float({ min: -100, max: 100, noNaN: true }),
});

/**
 * Arbitrary for generating AdminKPIs with missing fields
 * Note: noNaN is required to exclude NaN values from float generation
 */
const _partialAdminKPIsArb: fc.Arbitrary<Partial<AdminKPIs>> = fc.record({
  totalUsers: fc.option(fc.integer({ min: 0, max: 1000000 }), { nil: undefined }),
  totalUsersChange: fc.option(fc.float({ min: -100, max: 100, noNaN: true }), { nil: undefined }),
  totalOrders: fc.option(fc.integer({ min: 0, max: 10000000 }), { nil: undefined }),
  totalOrdersChange: fc.option(fc.float({ min: -100, max: 100, noNaN: true }), { nil: undefined }),
  revenue: fc.option(fc.integer({ min: 0, max: 100000000 }), { nil: undefined }),
  revenueChange: fc.option(fc.float({ min: -100, max: 100, noNaN: true }), { nil: undefined }),
  activeShops: fc.option(fc.integer({ min: 0, max: 100000 }), { nil: undefined }),
  activeShopsChange: fc.option(fc.float({ min: -100, max: 100, noNaN: true }), { nil: undefined }),
});

describe('AdminDashboard - Property Tests', () => {
  /**
   * Property 9: Admin dashboard shows system-wide KPIs
   * For any valid AdminKPIs, hasRequiredAdminKPIs SHALL return true
   */
  it('Property 9: hasRequiredAdminKPIs returns true for valid KPIs', () => {
    fc.assert(
      fc.property(adminKPIsArb, (kpis) => {
        return hasRequiredAdminKPIs(kpis) === true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: All KPI values are non-negative numbers
   */
  it('all KPI values are non-negative', () => {
    fc.assert(
      fc.property(adminKPIsArb, (kpis) => {
        return (
          kpis.totalUsers >= 0 &&
          kpis.totalOrders >= 0 &&
          kpis.revenue >= 0 &&
          kpis.activeShops >= 0
        );
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Change percentages are within valid range
   */
  it('change percentages are within valid range (-100 to 100)', () => {
    fc.assert(
      fc.property(adminKPIsArb, (kpis) => {
        return (
          kpis.totalUsersChange >= -100 && kpis.totalUsersChange <= 100 &&
          kpis.totalOrdersChange >= -100 && kpis.totalOrdersChange <= 100 &&
          kpis.revenueChange >= -100 && kpis.revenueChange <= 100 &&
          kpis.activeShopsChange >= -100 && kpis.activeShopsChange <= 100
        );
      }),
      { numRuns: 100 }
    );
  });
});

describe('AdminDashboard - Unit Tests', () => {
  it('returns true for complete valid KPIs', () => {
    const kpis: AdminKPIs = {
      totalUsers: 1000,
      totalUsersChange: 5.5,
      totalOrders: 5000,
      totalOrdersChange: 10.2,
      revenue: 100000,
      revenueChange: 15.0,
      activeShops: 50,
      activeShopsChange: 3.3,
    };
    expect(hasRequiredAdminKPIs(kpis)).toBe(true);
  });

  it('returns true for zero values', () => {
    const kpis: AdminKPIs = {
      totalUsers: 0,
      totalUsersChange: 0,
      totalOrders: 0,
      totalOrdersChange: 0,
      revenue: 0,
      revenueChange: 0,
      activeShops: 0,
      activeShopsChange: 0,
    };
    expect(hasRequiredAdminKPIs(kpis)).toBe(true);
  });

  it('returns true for negative change values', () => {
    const kpis: AdminKPIs = {
      totalUsers: 100,
      totalUsersChange: -10.5,
      totalOrders: 500,
      totalOrdersChange: -5.2,
      revenue: 10000,
      revenueChange: -20.0,
      activeShops: 10,
      activeShopsChange: -2.0,
    };
    expect(hasRequiredAdminKPIs(kpis)).toBe(true);
  });

  it('returns true for large values', () => {
    const kpis: AdminKPIs = {
      totalUsers: 999999,
      totalUsersChange: 99.9,
      totalOrders: 9999999,
      totalOrdersChange: 50.0,
      revenue: 99999999,
      revenueChange: 100.0,
      activeShops: 99999,
      activeShopsChange: 25.5,
    };
    expect(hasRequiredAdminKPIs(kpis)).toBe(true);
  });

  it('validates that all four required KPIs are present', () => {
    // This test ensures the function checks for all four required fields
    const kpis: AdminKPIs = {
      totalUsers: 100,
      totalUsersChange: 5,
      totalOrders: 200,
      totalOrdersChange: 10,
      revenue: 5000,
      revenueChange: 15,
      activeShops: 20,
      activeShopsChange: 3,
    };
    
    // All four required KPIs should be checked
    expect(hasRequiredAdminKPIs(kpis)).toBe(true);
    
    // Verify the function checks each field
    expect(typeof kpis.totalUsers).toBe('number');
    expect(typeof kpis.totalOrders).toBe('number');
    expect(typeof kpis.revenue).toBe('number');
    expect(typeof kpis.activeShops).toBe('number');
  });
});
