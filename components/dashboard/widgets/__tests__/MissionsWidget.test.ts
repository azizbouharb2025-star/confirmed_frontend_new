/**
 * Feature: subscription-tiered-dashboards, Property 7: Missions widget shows progress correctly
 * Validates: Requirements 7.2
 * 
 * Property: For any mission, the progress bar SHALL display current/target ratio 
 * as a percentage between 0 and 100.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateMissionProgress, Mission } from '../MissionsWidget';

/**
 * Arbitrary for generating valid mission current/target values
 */
const missionProgressArb = fc.record({
  current: fc.integer({ min: 0, max: 10000 }),
  target: fc.integer({ min: 1, max: 10000 }), // target must be > 0 for valid missions
});

/**
 * Arbitrary for generating a complete Mission object
 */
const _missionArb: fc.Arbitrary<Mission> = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.string({ minLength: 1, maxLength: 200 }),
  target: fc.integer({ min: 1, max: 10000 }),
  current: fc.integer({ min: 0, max: 10000 }),
  reward: fc.integer({ min: 1, max: 1000 }),
  rewardType: fc.constantFrom<'cash' | 'points' | 'badge'>('cash', 'points', 'badge'),
  type: fc.constantFrom<'daily' | 'weekly' | 'monthly'>('daily', 'weekly', 'monthly'),
  status: fc.constantFrom<'active' | 'completed' | 'expired'>('active', 'completed', 'expired'),
  expiresAt: fc.integer({ min: Date.now(), max: Date.now() + 30 * 24 * 60 * 60 * 1000 })
    .map(ts => new Date(ts).toISOString()),
  completedAt: fc.option(
    fc.integer({ min: Date.now() - 7 * 24 * 60 * 60 * 1000, max: Date.now() })
      .map(ts => new Date(ts).toISOString()),
    { nil: undefined }
  ),
});

describe('MissionsWidget - Property Tests', () => {
  /**
   * Property 7: Missions widget shows progress correctly
   * For any mission, the progress bar SHALL display current/target ratio as a percentage between 0 and 100.
   */
  it('Property 7: progress is always between 0 and 100', () => {
    fc.assert(
      fc.property(missionProgressArb, ({ current, target }) => {
        const progress = calculateMissionProgress(current, target);
        return progress >= 0 && progress <= 100;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Progress equals (current/target) * 100 when within bounds
   */
  it('progress equals (current/target) * 100 when current <= target', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }),
        fc.integer({ min: 1, max: 1000 }),
        (current, target) => {
          // Only test when current <= target to avoid clamping
          if (current > target) return true;
          
          const progress = calculateMissionProgress(current, target);
          const expected = (current / target) * 100;
          
          // Allow small floating point differences
          return Math.abs(progress - expected) < 0.0001;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Progress is clamped to 100 when current exceeds target
   */
  it('progress is clamped to 100 when current exceeds target', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 1, max: 10000 }),
        (current, target) => {
          // Only test when current > target
          if (current <= target) return true;
          
          const progress = calculateMissionProgress(current, target);
          return progress === 100;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Progress is 0 when current is 0
   */
  it('progress is 0 when current is 0', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        (target) => {
          const progress = calculateMissionProgress(0, target);
          return progress === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Progress is 100 when current equals target
   */
  it('progress is 100 when current equals target', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        (value) => {
          const progress = calculateMissionProgress(value, value);
          return progress === 100;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Progress is 0 when target is 0 or negative (edge case handling)
   */
  it('progress is 0 when target is 0 or negative', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000 }),
        fc.integer({ min: -1000, max: 0 }),
        (current, target) => {
          const progress = calculateMissionProgress(current, target);
          return progress === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Progress increases monotonically with current (for fixed target)
   */
  it('progress increases monotonically with current for fixed target', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 5000 }),
        fc.integer({ min: 0, max: 5000 }),
        fc.integer({ min: 1, max: 10000 }),
        (current1, current2, target) => {
          const progress1 = calculateMissionProgress(current1, target);
          const progress2 = calculateMissionProgress(current2, target);
          
          if (current1 <= current2) {
            return progress1 <= progress2;
          } else {
            return progress1 >= progress2;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Progress is never negative
   */
  it('progress is never negative even with negative current', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1000, max: 10000 }),
        fc.integer({ min: 1, max: 10000 }),
        (current, target) => {
          const progress = calculateMissionProgress(current, target);
          return progress >= 0;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('MissionsWidget - Unit Tests', () => {
  it('returns 0 for zero current', () => {
    expect(calculateMissionProgress(0, 100)).toBe(0);
  });

  it('returns 50 for half progress', () => {
    expect(calculateMissionProgress(50, 100)).toBe(50);
  });

  it('returns 100 for complete progress', () => {
    expect(calculateMissionProgress(100, 100)).toBe(100);
  });

  it('clamps to 100 for over-completion', () => {
    expect(calculateMissionProgress(150, 100)).toBe(100);
  });

  it('returns 0 for zero target', () => {
    expect(calculateMissionProgress(50, 0)).toBe(0);
  });

  it('returns 0 for negative target', () => {
    expect(calculateMissionProgress(50, -10)).toBe(0);
  });

  it('handles decimal progress correctly', () => {
    const progress = calculateMissionProgress(33, 100);
    expect(progress).toBe(33);
  });

  it('handles large numbers correctly', () => {
    const progress = calculateMissionProgress(5000, 10000);
    expect(progress).toBe(50);
  });
});
