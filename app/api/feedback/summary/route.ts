/**
 * Feedback Summary API Route
 * GET /api/feedback/summary
 * 
 * Returns aggregated feedback summary data for analytics
 * Requirements: 7.1, 7.2, 8.2, 8.6
 */

import { NextRequest, NextResponse } from 'next/server';
import type { OperatorFeedbackSummaryData } from '@/types/feedback';

/**
 * Generate mock feedback summary data
 */
function generateMockFeedbackSummary(
  startDate: Date,
  endDate: Date
): OperatorFeedbackSummaryData {
  // Generate trend data for the date range
  const trendData = [];
  const daysDiff = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  for (let i = 0; i < Math.min(daysDiff, 30); i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    trendData.push({
      date: date.toISOString().split('T')[0],
      averageRating: Math.random() * 1.5 + 3.5, // 3.5-5.0
      count: Math.floor(Math.random() * 20) + 5, // 5-25 feedback per day
    });
  }

  // Calculate overall average rating
  const totalRating = trendData.reduce((sum, day) => sum + day.averageRating * day.count, 0);
  const totalCount = trendData.reduce((sum, day) => sum + day.count, 0);
  const averageRating = totalRating / totalCount;

  // Generate top tags
  const allTags = [
    'polite customer',
    'price concern',
    'quality question',
    'delivery inquiry',
    'payment issue',
    'product details',
    'urgent request',
    'satisfied customer',
    'repeat buyer',
    'new customer',
  ];

  const topTags = allTags
    .map((tag) => ({
      tag,
      count: Math.floor(Math.random() * 50) + 10,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalFeedback: totalCount,
    averageRating,
    topTags,
    trendData,
    timeRange: {
      start: startDate,
      end: endDate,
    },
  };
}

/**
 * GET /api/feedback/summary
 * Returns aggregated feedback summary
 * Query params: startDate, endDate (ISO strings)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Default to last 30 days if not provided
    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (startDate > endDate) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      );
    }

    // TODO: Replace with real database aggregation
    // const summary = await db.humanFeedback.aggregate([
    //   { $match: { timestamp: { $gte: startDate, $lte: endDate } } },
    //   { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
    //   // ... more aggregation stages
    // ]);

    // For now, use mock data
    const summary = generateMockFeedbackSummary(startDate, endDate);

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error fetching feedback summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback summary' },
      { status: 500 }
    );
  }
}
