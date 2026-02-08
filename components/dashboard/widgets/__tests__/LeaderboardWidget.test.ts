/**
 * Feature: subscription-tiered-dashboards, Property 8: Leaderboard shows operators in rank order
 * Validates: Requirements 7.4
 * 
 * Property: For any leaderboard data, operators SHALL be displayed in ascending 
 * rank order (1st, 2nd, 3rd, etc.).
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { sortByRank, isInRankOrder, LeaderboardEntry } from '../LeaderboardWidget';

/**
 * Arbitrary for generating a valid LeaderboardEntry
 */
const leaderboardEntryArb: fc.Arbitrary<LeaderboardEntry> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  avatar: fc.option(fc.webUrl(), { nil: undefined }),
  confirmationRate: fc.float({ min: 0, max: 100, noNaN: true }),
  totalCalls: fc.integer({ min: 0, max: 10000 }),
  rank: fc.integer({ min: 1, max: 1000 }),
});

/**
 * Arbitrary for generating a list of leaderboard entries with unique ranks
 */
const leaderboardListArb = fc.array(leaderboardEntryArb, { minLength: 0, maxLength: 50 });

/**
 * Arbitrary for generating a list with unique ranks
 */
const uniqueRankLeaderboardArb = fc.array(
  fc.integer({ min: 1, max: 1000 }),
  { minLength: 0, maxLength: 50 }
).chain(ranks => {
  const uniqueRanks = [...new Set(ranks)];
  return fc.tuple(
    ...uniqueRanks.map(rank => 
      leaderboardEntryArb.map(entry => ({ ...entry, rank }))
    )
  );
}).map(entries => entries as LeaderboardEntry[]);

describe('LeaderboardWidget - Property Tests', () => {
  /**
   * Property 8: Leaderboard shows operators in rank order
   * For any leaderboard data, operators SHALL be displayed in ascending rank order
   */
  it('Property 8: sortByRank returns operators in ascending rank order', () => {
    fc.assert(
      fc.property(leaderboardListArb, (operators) => {
        const sorted = sortByRank(operators);
        return isInRankOrder(sorted);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Sorted list has same length as input
   */
  it('sorted list has same length as input', () => {
    fc.assert(
      fc.property(leaderboardListArb, (operators) => {
        const sorted = sortByRank(operators);
        return sorted.length === operators.length;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Sorted list contains all original operators
   */
  it('sorted list contains all original operators', () => {
    fc.assert(
      fc.property(leaderboardListArb, (operators) => {
        const sorted = sortByRank(operators);
        const originalIds = new Set(operators.map(o => o.id));
        const sortedIds = new Set(sorted.map(o => o.id));
        
        // Check same size and all IDs present
        if (originalIds.size !== sortedIds.size) return false;
        for (const id of originalIds) {
          if (!sortedIds.has(id)) return false;
        }
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: First element has lowest rank after sorting
   */
  it('first element has lowest rank after sorting', () => {
    fc.assert(
      fc.property(
        fc.array(leaderboardEntryArb, { minLength: 1, maxLength: 50 }),
        (operators) => {
          const sorted = sortByRank(operators);
          const minRank = Math.min(...operators.map(o => o.rank));
          return sorted[0].rank === minRank;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Last element has highest rank after sorting
   */
  it('last element has highest rank after sorting', () => {
    fc.assert(
      fc.property(
        fc.array(leaderboardEntryArb, { minLength: 1, maxLength: 50 }),
        (operators) => {
          const sorted = sortByRank(operators);
          const maxRank = Math.max(...operators.map(o => o.rank));
          return sorted[sorted.length - 1].rank === maxRank;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Sorting is idempotent (sorting twice gives same result)
   */
  it('sorting is idempotent', () => {
    fc.assert(
      fc.property(leaderboardListArb, (operators) => {
        const sortedOnce = sortByRank(operators);
        const sortedTwice = sortByRank(sortedOnce);
        
        // Check that both arrays have same elements in same order
        if (sortedOnce.length !== sortedTwice.length) return false;
        for (let i = 0; i < sortedOnce.length; i++) {
          if (sortedOnce[i].id !== sortedTwice[i].id) return false;
        }
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Empty list returns empty list
   */
  it('empty list returns empty list', () => {
    const sorted = sortByRank([]);
    expect(sorted).toEqual([]);
    expect(isInRankOrder(sorted)).toBe(true);
  });

  /**
   * Property: Single element list is always in order
   */
  it('single element list is always in order', () => {
    fc.assert(
      fc.property(leaderboardEntryArb, (operator) => {
        const sorted = sortByRank([operator]);
        return sorted.length === 1 && 
               sorted[0].id === operator.id && 
               isInRankOrder(sorted);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: isInRankOrder correctly identifies sorted arrays
   */
  it('isInRankOrder returns true for already sorted arrays', () => {
    fc.assert(
      fc.property(leaderboardListArb, (operators) => {
        const sorted = sortByRank(operators);
        return isInRankOrder(sorted);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Original array is not mutated
   */
  it('original array is not mutated', () => {
    fc.assert(
      fc.property(leaderboardListArb, (operators) => {
        const originalCopy = operators.map(o => ({ ...o }));
        sortByRank(operators);
        
        // Check original array unchanged
        if (operators.length !== originalCopy.length) return false;
        for (let i = 0; i < operators.length; i++) {
          if (operators[i].id !== originalCopy[i].id ||
              operators[i].rank !== originalCopy[i].rank) {
            return false;
          }
        }
        return true;
      }),
      { numRuns: 100 }
    );
  });
});

describe('LeaderboardWidget - Unit Tests', () => {
  it('sorts operators by rank ascending', () => {
    const operators: LeaderboardEntry[] = [
      { id: '3', name: 'Charlie', confirmationRate: 80, totalCalls: 100, rank: 3 },
      { id: '1', name: 'Alice', confirmationRate: 95, totalCalls: 150, rank: 1 },
      { id: '2', name: 'Bob', confirmationRate: 88, totalCalls: 120, rank: 2 },
    ];
    
    const sorted = sortByRank(operators);
    
    expect(sorted[0].rank).toBe(1);
    expect(sorted[1].rank).toBe(2);
    expect(sorted[2].rank).toBe(3);
  });

  it('handles operators with same rank', () => {
    const operators: LeaderboardEntry[] = [
      { id: '1', name: 'Alice', confirmationRate: 95, totalCalls: 150, rank: 1 },
      { id: '2', name: 'Bob', confirmationRate: 95, totalCalls: 150, rank: 1 },
    ];
    
    const sorted = sortByRank(operators);
    
    expect(sorted.length).toBe(2);
    expect(sorted[0].rank).toBe(1);
    expect(sorted[1].rank).toBe(1);
  });

  it('isInRankOrder returns true for sorted list', () => {
    const operators: LeaderboardEntry[] = [
      { id: '1', name: 'Alice', confirmationRate: 95, totalCalls: 150, rank: 1 },
      { id: '2', name: 'Bob', confirmationRate: 88, totalCalls: 120, rank: 2 },
      { id: '3', name: 'Charlie', confirmationRate: 80, totalCalls: 100, rank: 3 },
    ];
    
    expect(isInRankOrder(operators)).toBe(true);
  });

  it('isInRankOrder returns false for unsorted list', () => {
    const operators: LeaderboardEntry[] = [
      { id: '3', name: 'Charlie', confirmationRate: 80, totalCalls: 100, rank: 3 },
      { id: '1', name: 'Alice', confirmationRate: 95, totalCalls: 150, rank: 1 },
      { id: '2', name: 'Bob', confirmationRate: 88, totalCalls: 120, rank: 2 },
    ];
    
    expect(isInRankOrder(operators)).toBe(false);
  });

  it('isInRankOrder returns true for empty list', () => {
    expect(isInRankOrder([])).toBe(true);
  });

  it('isInRankOrder returns true for single element', () => {
    const operators: LeaderboardEntry[] = [
      { id: '1', name: 'Alice', confirmationRate: 95, totalCalls: 150, rank: 1 },
    ];
    
    expect(isInRankOrder(operators)).toBe(true);
  });
});
