/**
 * Cancellation Summary API Route
 * GET /api/cancellations/summary
 * Requirements: 9.1, 9.2, 9.6
 */

import { NextRequest, NextResponse } from 'next/server';
import { CancellationSummary, CancellationReasonSummary } from '@/types/cancellation';
import { CancellationReason } from '@/types/order';

/**
 * Mock data generator for cancellation summary
 * In production, this would query the database
 */
function generateMockCancellationSummary(): CancellationSummary {
  const reasons: CancellationReason[] = [
    'customer_refused',
    'price_too_high',
    'quality_doubts',
    'duplicate_order',
    'fake_number',
    'not_available',
    'courier_failed',
    'customer_rejected_at_door',
  ];

  // Generate random counts for each reason
  const reasonCounts = reasons.map(reason => ({
    reason,
    count: Math.floor(Math.random() * 50) + 5,
  }));

  // Calculate total
  const totalCancelled = reasonCounts.reduce((sum, r) => sum + r.count, 0);

  // Sort by count and get top 3
  const sortedReasons = [...reasonCounts].sort((a, b) => b.count - a.count);
  const topReasons: CancellationReasonSummary[] = sortedReasons.slice(0, 3).map(r => ({
    reason: r.reason,
    count: r.count,
    percentage: Math.round((r.count / totalCancelled) * 100),
  }));

  // Random trend
  const changeFromPrevious = Math.floor(Math.random() * 40) - 20; // -20 to +20
  const trend = changeFromPrevious > 5 ? 'up' : changeFromPrevious < -5 ? 'down' : 'stable';

  return {
    totalCancelled,
    topReasons,
    changeFromPrevious,
    trend,
  };
}

export async function GET(_request: NextRequest) {
  try {
    // In production, you would:
    // 1. Verify authentication
    // 2. Get shopId from session
    // 3. Query database for cancellation data
    // 4. Calculate statistics

    const summary = generateMockCancellationSummary();

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error fetching cancellation summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cancellation summary' },
      { status: 500 }
    );
  }
}
