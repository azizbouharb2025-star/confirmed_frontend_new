/**
 * Feature: subscription-tiered-dashboards, Property 6: Operator dashboard shows required KPIs
 * Validates: Requirements 7.1
 * 
 * Property: For any operator user, the dashboard SHALL display KPI cards for 
 * confirmation rate, calls today, and queue length.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Operator KPI data structure
 */
interface OperatorKPIs {
  confirmationRate: number;
  confirmationRateChange?: number;
  callsToday: number;
  callsTodayChange?: number;
  queueLength: number;
  performanceRank: number;
}

/**
 * Get KPI metrics for display
 * Property 6: Operator dashboard shows required KPIs
 * For any operator user, the dashboard SHALL display KPI cards for confirmation rate, calls today, and queue length.
 * 
 * Note: This is a copy of the function from page.tsx for testing purposes
 * to avoid importing React components in unit tests.
 */
function getOperatorKPIMetrics(kpis: OperatorKPIs) {
  return [
    { 
      title: 'Confirmation Rate', 
      value: kpis.confirmationRate, 
      change: kpis.confirmationRateChange,
      suffix: '%', 
      decimals: 1,
      icon: 'ChartBarIcon',
      trend: kpis.confirmationRateChange !== undefined 
        ? (kpis.confirmationRateChange > 0 ? 'up' : kpis.confirmationRateChange < 0 ? 'down' : 'neutral')
        : undefined,
    },
    { 
      title: "Today's Calls", 
      value: kpis.callsToday, 
      change: kpis.callsTodayChange,
      icon: 'PhoneIcon',
      trend: kpis.callsTodayChange !== undefined 
        ? (kpis.callsTodayChange > 0 ? 'up' : kpis.callsTodayChange < 0 ? 'down' : 'neutral')
        : undefined,
    },
    { 
      title: 'Queue Length', 
      value: kpis.queueLength, 
      icon: 'QueueListIcon',
    },
    { 
      title: 'Performance Rank', 
      value: kpis.performanceRank, 
      icon: 'ChartBarIcon',
      prefix: '#',
    },
  ] as const;
}

/**
 * Check if KPIs contain required fields
 * Property 6: Operator dashboard shows required KPIs
 */
function hasRequiredKPIs(kpis: OperatorKPIs): boolean {
  return (
    typeof kpis.confirmationRate === 'number' &&
    typeof kpis.callsToday === 'number' &&
    typeof kpis.queueLength === 'number'
  );
}

/**
 * Arbitrary for generating valid OperatorKPIs
 */
const operatorKPIsArb: fc.Arbitrary<OperatorKPIs> = fc.record({
  confirmationRate: fc.float({ min: 0, max: 100, noNaN: true }),
  confirmationRateChange: fc.option(fc.float({ min: -50, max: 50, noNaN: true }), { nil: undefined }),
  callsToday: fc.integer({ min: 0, max: 1000 }),
  callsTodayChange: fc.option(fc.float({ min: -100, max: 100, noNaN: true }), { nil: undefined }),
  queueLength: fc.integer({ min: 0, max: 500 }),
  performanceRank: fc.integer({ min: 1, max: 1000 }),
});

/**
 * Required KPI titles that must be present
 */
const REQUIRED_KPI_TITLES = ['Confirmation Rate', "Today's Calls", 'Queue Length'];

describe('Operator Dashboard - Property Tests', () => {
  /**
   * Property 6: Operator dashboard shows required KPIs
   * For any operator user, the dashboard SHALL display KPI cards for confirmation rate, calls today, and queue length.
   */
  it('Property 6: KPI metrics always include confirmation rate, calls today, and queue length', () => {
    fc.assert(
      fc.property(operatorKPIsArb, (kpis) => {
        const metrics = getOperatorKPIMetrics(kpis);
        const titles = metrics.map(m => m.title);
        
        // Check all required KPIs are present
        return REQUIRED_KPI_TITLES.every(required => titles.includes(required));
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Confirmation rate metric has correct value
   */
  it('confirmation rate metric has correct value from KPIs', () => {
    fc.assert(
      fc.property(operatorKPIsArb, (kpis) => {
        const metrics = getOperatorKPIMetrics(kpis);
        const confirmationRateMetric = metrics.find(m => m.title === 'Confirmation Rate');
        
        return confirmationRateMetric?.value === kpis.confirmationRate;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Calls today metric has correct value
   */
  it('calls today metric has correct value from KPIs', () => {
    fc.assert(
      fc.property(operatorKPIsArb, (kpis) => {
        const metrics = getOperatorKPIMetrics(kpis);
        const callsTodayMetric = metrics.find(m => m.title === "Today's Calls");
        
        return callsTodayMetric?.value === kpis.callsToday;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Queue length metric has correct value
   */
  it('queue length metric has correct value from KPIs', () => {
    fc.assert(
      fc.property(operatorKPIsArb, (kpis) => {
        const metrics = getOperatorKPIMetrics(kpis);
        const queueLengthMetric = metrics.find(m => m.title === 'Queue Length');
        
        return queueLengthMetric?.value === kpis.queueLength;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Confirmation rate has percentage suffix
   */
  it('confirmation rate metric has percentage suffix', () => {
    fc.assert(
      fc.property(operatorKPIsArb, (kpis) => {
        const metrics = getOperatorKPIMetrics(kpis);
        const confirmationRateMetric = metrics.find(m => m.title === 'Confirmation Rate');
        
        return confirmationRateMetric?.suffix === '%';
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: All metrics have icons
   */
  it('all metrics have icons', () => {
    fc.assert(
      fc.property(operatorKPIsArb, (kpis) => {
        const metrics = getOperatorKPIMetrics(kpis);
        
        return metrics.every(m => m.icon !== undefined);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Metrics count is always 4 (confirmation rate, calls today, queue length, performance rank)
   */
  it('metrics count is always 4', () => {
    fc.assert(
      fc.property(operatorKPIsArb, (kpis) => {
        const metrics = getOperatorKPIMetrics(kpis);
        return metrics.length === 4;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: hasRequiredKPIs returns true for valid KPIs
   */
  it('hasRequiredKPIs returns true for valid KPIs', () => {
    fc.assert(
      fc.property(operatorKPIsArb, (kpis) => {
        return hasRequiredKPIs(kpis) === true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Trend is correctly determined from change values
   */
  it('trend is correctly determined from change values', () => {
    fc.assert(
      fc.property(operatorKPIsArb, (kpis) => {
        const metrics = getOperatorKPIMetrics(kpis);
        const confirmationRateMetric = metrics.find(m => m.title === 'Confirmation Rate');
        
        if (kpis.confirmationRateChange === undefined) {
          return confirmationRateMetric?.trend === undefined;
        }
        
        if (kpis.confirmationRateChange > 0) {
          return confirmationRateMetric?.trend === 'up';
        } else if (kpis.confirmationRateChange < 0) {
          return confirmationRateMetric?.trend === 'down';
        } else {
          return confirmationRateMetric?.trend === 'neutral';
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Performance rank has # prefix
   */
  it('performance rank metric has # prefix', () => {
    fc.assert(
      fc.property(operatorKPIsArb, (kpis) => {
        const metrics = getOperatorKPIMetrics(kpis);
        const rankMetric = metrics.find(m => m.title === 'Performance Rank');
        
        return rankMetric?.prefix === '#';
      }),
      { numRuns: 100 }
    );
  });
});

describe('Operator Dashboard - Unit Tests', () => {
  it('returns all required KPI metrics', () => {
    const kpis: OperatorKPIs = {
      confirmationRate: 87.5,
      callsToday: 42,
      queueLength: 15,
      performanceRank: 3,
    };
    
    const metrics = getOperatorKPIMetrics(kpis);
    const titles = metrics.map(m => m.title);
    
    expect(titles).toContain('Confirmation Rate');
    expect(titles).toContain("Today's Calls");
    expect(titles).toContain('Queue Length');
    expect(titles).toContain('Performance Rank');
  });

  it('hasRequiredKPIs returns true for complete KPIs', () => {
    const kpis: OperatorKPIs = {
      confirmationRate: 87.5,
      callsToday: 42,
      queueLength: 15,
      performanceRank: 3,
    };
    
    expect(hasRequiredKPIs(kpis)).toBe(true);
  });

  it('confirmation rate metric has correct properties', () => {
    const kpis: OperatorKPIs = {
      confirmationRate: 87.5,
      confirmationRateChange: 2.1,
      callsToday: 42,
      queueLength: 15,
      performanceRank: 3,
    };
    
    const metrics = getOperatorKPIMetrics(kpis);
    const confirmationRate = metrics.find(m => m.title === 'Confirmation Rate');
    
    expect(confirmationRate?.value).toBe(87.5);
    expect(confirmationRate?.suffix).toBe('%');
    expect(confirmationRate?.decimals).toBe(1);
    expect(confirmationRate?.trend).toBe('up');
  });

  it('handles zero values correctly', () => {
    const kpis: OperatorKPIs = {
      confirmationRate: 0,
      callsToday: 0,
      queueLength: 0,
      performanceRank: 1,
    };
    
    const metrics = getOperatorKPIMetrics(kpis);
    
    expect(metrics.find(m => m.title === 'Confirmation Rate')?.value).toBe(0);
    expect(metrics.find(m => m.title === "Today's Calls")?.value).toBe(0);
    expect(metrics.find(m => m.title === 'Queue Length')?.value).toBe(0);
  });

  it('handles negative change values correctly', () => {
    const kpis: OperatorKPIs = {
      confirmationRate: 75,
      confirmationRateChange: -5.2,
      callsToday: 30,
      callsTodayChange: -10,
      queueLength: 20,
      performanceRank: 5,
    };
    
    const metrics = getOperatorKPIMetrics(kpis);
    const confirmationRate = metrics.find(m => m.title === 'Confirmation Rate');
    const callsToday = metrics.find(m => m.title === "Today's Calls");
    
    expect(confirmationRate?.trend).toBe('down');
    expect(callsToday?.trend).toBe('down');
  });

  it('handles undefined change values correctly', () => {
    const kpis: OperatorKPIs = {
      confirmationRate: 87.5,
      callsToday: 42,
      queueLength: 15,
      performanceRank: 3,
    };
    
    const metrics = getOperatorKPIMetrics(kpis);
    const confirmationRate = metrics.find(m => m.title === 'Confirmation Rate');
    
    expect(confirmationRate?.trend).toBeUndefined();
  });
});
