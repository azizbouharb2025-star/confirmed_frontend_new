/**
 * Cancellation Analysis API Route
 * GET /api/cancellations/analysis
 * Requirements: 9.3, 9.4, 9.5, 9.8
 */

import { NextRequest, NextResponse } from 'next/server';
import { CancellationAnalysisData, CancellationReasonData, TrendData, TimeRange } from '@/types/cancellation';
import { CancellationReason } from '@/types/order';

/**
 * Parse time range from query parameters
 */
function parseTimeRange(searchParams: URLSearchParams): TimeRange {
  const preset = searchParams.get('preset') as TimeRange['preset'];
  const startStr = searchParams.get('start');
  const endStr = searchParams.get('end');

  const now = new Date();
  let start: Date;
  let end: Date = now;

  if (preset) {
    switch (preset) {
      case 'today':
        start = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'yesterday':
        start = new Date(now.setDate(now.getDate() - 1));
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setHours(23, 59, 59, 999);
        break;
      case '7days':
        start = new Date(now.setDate(now.getDate() - 7));
        break;
      case '30days':
      default:
        start = new Date(now.setDate(now.getDate() - 30));
        break;
    }
  } else if (startStr && endStr) {
    start = new Date(startStr);
    end = new Date(endStr);
  } else {
    // Default to last 30 days
    start = new Date(now.setDate(now.getDate() - 30));
  }

  return { start, end, preset };
}

/**
 * Generate mock cancellation analysis data
 * In production, this would query the database
 */
function generateMockAnalysisData(timeRange: TimeRange): CancellationAnalysisData {
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

  // Generate reason breakdown
  const reasonCounts = reasons.map(reason => ({
    reason,
    count: Math.floor(Math.random() * 80) + 10,
  }));

  const totalCancelled = reasonCounts.reduce((sum, r) => sum + r.count, 0);
  const totalOrders = totalCancelled + Math.floor(Math.random() * 500) + 200;
  const cancellationRate = Math.round((totalCancelled / totalOrders) * 100);

  // Calculate percentages and trends
  const reasonBreakdown: CancellationReasonData[] = reasonCounts.map(r => {
    const percentage = Math.round((r.count / totalCancelled) * 100);
    const trendRandom = Math.random();
    const trend = trendRandom > 0.6 ? 'up' : trendRandom > 0.3 ? 'down' : 'stable';
    
    return {
      reason: r.reason,
      count: r.count,
      percentage,
      trend,
    };
  });

  // Sort by count for top reasons
  const sortedReasons = [...reasonBreakdown].sort((a, b) => b.count - a.count);
  const topReasons = sortedReasons.slice(0, 5).map(r => ({
    reason: r.reason,
    count: r.count,
    percentage: r.percentage,
  }));

  // Generate trend data (daily data points)
  const daysDiff = Math.ceil((timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24));
  const trendData: TrendData[] = [];
  
  for (let i = 0; i < Math.min(daysDiff, 30); i++) {
    const date = new Date(timeRange.start);
    date.setDate(date.getDate() + i);
    
    trendData.push({
      date: date.toISOString().split('T')[0],
      value: Math.floor(Math.random() * 20) + 5,
      label: date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
    });
  }

  return {
    totalCancelled,
    cancellationRate,
    reasonBreakdown,
    trendData,
    topReasons,
    timeRange,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse time range from query parameters
    const timeRange = parseTimeRange(searchParams);

    // In production, you would:
    // 1. Verify authentication
    // 2. Get shopId from session
    // 3. Query database for cancellation data within time range
    // 4. Calculate statistics and trends

    const analysisData = generateMockAnalysisData(timeRange);

    return NextResponse.json(analysisData);
  } catch (error) {
    console.error('Error fetching cancellation analysis:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cancellation analysis' },
      { status: 500 }
    );
  }
}
