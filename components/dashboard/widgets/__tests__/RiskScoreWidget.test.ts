/**
 * Feature: subscription-tiered-dashboards, Property 4: Risk score distribution has three categories
 * Validates: Requirements 2.2
 * 
 * Property: For any risk score data, the distribution chart SHALL display 
 * exactly three categories: high (>70), medium (40-70), and low (<40).
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getRiskChartData, hasThreeCategories, RiskScoreData } from '../RiskScoreWidget';

/**
 * Arbitrary for generating valid RiskScoreData
 * Each category can have 0 or more orders
 */
const riskScoreDataArb: fc.Arbitrary<RiskScoreData> = fc.record({
  high: fc.integer({ min: 0, max: 10000 }),
  medium: fc.integer({ min: 0, max: 10000 }),
  low: fc.integer({ min: 0, max: 10000 }),
});

/**
 * Arbitrary for generating non-empty RiskScoreData (at least one order)
 */
const _nonEmptyRiskScoreDataArb: fc.Arbitrary<RiskScoreData> = fc.record({
  high: fc.integer({ min: 0, max: 10000 }),
  medium: fc.integer({ min: 0, max: 10000 }),
  low: fc.integer({ min: 0, max: 10000 }),
}).filter(data => data.high + data.medium + data.low > 0);

describe('RiskScoreWidget - Property Tests', () => {
  /**
   * Property 4: Risk score distribution has three categories
   * For any risk score data, the chart data SHALL have exactly three categories
   */
  it('Property 4: chart data always has exactly three categories', () => {
    fc.assert(
      fc.property(riskScoreDataArb, (data) => {
        const chartData = getRiskChartData(data);
        return chartData.length === 3;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Chart data categories are always in the same order (high, medium, low)
   */
  it('chart data categories are always in order: high, medium, low', () => {
    fc.assert(
      fc.property(riskScoreDataArb, (data) => {
        const chartData = getRiskChartData(data);
        return (
          chartData[0].name === 'High Confidence' &&
          chartData[1].name === 'Medium Confidence' &&
          chartData[2].name === 'Low Confidence'
        );
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Chart data values match input data
   */
  it('chart data values match input data', () => {
    fc.assert(
      fc.property(riskScoreDataArb, (data) => {
        const chartData = getRiskChartData(data);
        return (
          chartData[0].value === data.high &&
          chartData[1].value === data.medium &&
          chartData[2].value === data.low
        );
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Each category has a distinct color
   */
  it('each category has a distinct color', () => {
    fc.assert(
      fc.property(riskScoreDataArb, (data) => {
        const chartData = getRiskChartData(data);
        const colors = chartData.map(d => d.color);
        const uniqueColors = new Set(colors);
        return uniqueColors.size === 3;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: High confidence uses green color
   */
  it('high confidence category uses green color', () => {
    fc.assert(
      fc.property(riskScoreDataArb, (data) => {
        const chartData = getRiskChartData(data);
        const highCategory = chartData.find(d => d.name === 'High Confidence');
        return highCategory?.color === '#22c55e';
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Medium confidence uses orange color
   */
  it('medium confidence category uses orange color', () => {
    fc.assert(
      fc.property(riskScoreDataArb, (data) => {
        const chartData = getRiskChartData(data);
        const mediumCategory = chartData.find(d => d.name === 'Medium Confidence');
        return mediumCategory?.color === '#f97316';
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Low confidence uses red color
   */
  it('low confidence category uses red color', () => {
    fc.assert(
      fc.property(riskScoreDataArb, (data) => {
        const chartData = getRiskChartData(data);
        const lowCategory = chartData.find(d => d.name === 'Low Confidence');
        return lowCategory?.color === '#ef4444';
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: hasThreeCategories returns true for valid RiskScoreData
   */
  it('hasThreeCategories returns true for valid data', () => {
    fc.assert(
      fc.property(riskScoreDataArb, (data) => {
        return hasThreeCategories(data) === true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Total of chart data values equals sum of input values
   */
  it('total of chart data values equals sum of input values', () => {
    fc.assert(
      fc.property(riskScoreDataArb, (data) => {
        const chartData = getRiskChartData(data);
        const chartTotal = chartData.reduce((sum, d) => sum + d.value, 0);
        const inputTotal = data.high + data.medium + data.low;
        return chartTotal === inputTotal;
      }),
      { numRuns: 100 }
    );
  });
});

describe('RiskScoreWidget - Unit Tests', () => {
  it('returns three categories for zero data', () => {
    const data: RiskScoreData = { high: 0, medium: 0, low: 0 };
    const chartData = getRiskChartData(data);
    expect(chartData.length).toBe(3);
  });

  it('returns correct values for sample data', () => {
    const data: RiskScoreData = { high: 50, medium: 30, low: 20 };
    const chartData = getRiskChartData(data);
    
    expect(chartData[0]).toEqual({ name: 'High Confidence', value: 50, color: '#22c55e' });
    expect(chartData[1]).toEqual({ name: 'Medium Confidence', value: 30, color: '#f97316' });
    expect(chartData[2]).toEqual({ name: 'Low Confidence', value: 20, color: '#ef4444' });
  });

  it('hasThreeCategories returns true for valid data', () => {
    const data: RiskScoreData = { high: 10, medium: 20, low: 30 };
    expect(hasThreeCategories(data)).toBe(true);
  });

  it('handles large numbers correctly', () => {
    const data: RiskScoreData = { high: 999999, medium: 888888, low: 777777 };
    const chartData = getRiskChartData(data);
    
    expect(chartData[0].value).toBe(999999);
    expect(chartData[1].value).toBe(888888);
    expect(chartData[2].value).toBe(777777);
  });
});
