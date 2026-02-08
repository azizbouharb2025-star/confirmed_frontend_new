/**
 * Feature: order-management-system, Property 17: AI risk score indicator color mapping
 * Validates: Requirements 8.2, 8.3, 8.4
 * 
 * Property: For any AI risk score value, the RiskScoreIndicator SHALL display:
 * - green if score > 70
 * - orange if 40 <= score <= 70
 * - red if score < 40
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { 
  getRiskScoreColor, 
  RISK_COLORS, 
  RISK_LABELS,
  type RiskColorCategory 
} from '../RiskScoreIndicator';

// Arbitrary for generating valid risk scores (0-100)
const riskScoreArb = fc.integer({ min: 0, max: 100 });

// Arbitrary for high confidence scores (> 70)
const highScoreArb = fc.integer({ min: 71, max: 100 });

// Arbitrary for medium confidence scores (40-70)
const mediumScoreArb = fc.integer({ min: 40, max: 70 });

// Arbitrary for low confidence scores (< 40)
const lowScoreArb = fc.integer({ min: 0, max: 39 });

describe('RiskScoreIndicator - Property Tests', () => {
  /**
   * Property 17: AI risk score indicator color mapping
   * For any score, the color category matches the threshold rules
   */
  it('Property 17: risk score displays correct color based on thresholds', () => {
    fc.assert(
      fc.property(riskScoreArb, (score) => {
        const color = getRiskScoreColor(score);
        
        if (score > 70) {
          return color === 'green';
        } else if (score >= 40) {
          return color === 'orange';
        } else {
          return color === 'red';
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: High scores (> 70) always map to green
   * Validates: Requirements 8.2
   */
  it('scores above 70 always display green indicator', () => {
    fc.assert(
      fc.property(highScoreArb, (score) => {
        return getRiskScoreColor(score) === 'green';
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Medium scores (40-70) always map to orange
   * Validates: Requirements 8.3
   */
  it('scores between 40 and 70 always display orange indicator', () => {
    fc.assert(
      fc.property(mediumScoreArb, (score) => {
        return getRiskScoreColor(score) === 'orange';
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Low scores (< 40) always map to red
   * Validates: Requirements 8.4
   */
  it('scores below 40 always display red indicator', () => {
    fc.assert(
      fc.property(lowScoreArb, (score) => {
        return getRiskScoreColor(score) === 'red';
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Every color category has complete configuration
   * For any valid color category, RISK_COLORS should have bg, text, and ring classes
   */
  it('every color category has complete configuration', () => {
    const colorCategories: RiskColorCategory[] = ['green', 'orange', 'red'];
    
    fc.assert(
      fc.property(fc.constantFrom(...colorCategories), (category) => {
        const colors = RISK_COLORS[category];
        
        const hasBg = typeof colors.bg === 'string' && colors.bg.length > 0;
        const hasText = typeof colors.text === 'string' && colors.text.length > 0;
        const hasRing = typeof colors.ring === 'string' && colors.ring.length > 0;
        
        return hasBg && hasText && hasRing;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Color classes contain the expected color name
   */
  it('color classes contain the expected color name', () => {
    const colorCategories: RiskColorCategory[] = ['green', 'orange', 'red'];
    
    fc.assert(
      fc.property(fc.constantFrom(...colorCategories), (category) => {
        const colors = RISK_COLORS[category];
        return colors.bg.includes(category);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Every color category has a label
   */
  it('every color category has a label', () => {
    const colorCategories: RiskColorCategory[] = ['green', 'orange', 'red'];
    
    fc.assert(
      fc.property(fc.constantFrom(...colorCategories), (category) => {
        const label = RISK_LABELS[category];
        return typeof label === 'string' && label.length > 0;
      }),
      { numRuns: 100 }
    );
  });
});

describe('RiskScoreIndicator - Boundary Tests', () => {
  it('score of exactly 70 maps to orange', () => {
    expect(getRiskScoreColor(70)).toBe('orange');
  });

  it('score of exactly 71 maps to green', () => {
    expect(getRiskScoreColor(71)).toBe('green');
  });

  it('score of exactly 40 maps to orange', () => {
    expect(getRiskScoreColor(40)).toBe('orange');
  });

  it('score of exactly 39 maps to red', () => {
    expect(getRiskScoreColor(39)).toBe('red');
  });

  it('score of 0 maps to red', () => {
    expect(getRiskScoreColor(0)).toBe('red');
  });

  it('score of 100 maps to green', () => {
    expect(getRiskScoreColor(100)).toBe('green');
  });
});
