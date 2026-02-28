import { NextRequest, NextResponse } from 'next/server';
import { OperatorFeedbackSummaryData, TimeRange } from '@/types/analytics';

/**
 * GET /api/analytics/operator-feedback
 * Get operator feedback summary for a shop
 * Requirements: 8.2, 8.3, 8.6
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const preset = searchParams.get('preset') as 'today' | 'yesterday' | '7days' | '30days' | 'custom' | null;

    // TODO: Get shopId from session
    // const session = await getServerSession();
    // const _shopId = session.user.shopId;

    // For now, use mock data
    // const shopId = 'shop_123';

    // Parse dates
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const timeRange: TimeRange = {
      start,
      end,
      preset: preset || '30days',
    };

    // TODO: Fetch from database
    // const feedback = await Feedback.find({
    //   shopId,
    //   timestamp: { $gte: start, $lte: end },
    //   source: 'human'
    // });

    // Mock data for now
    const data: OperatorFeedbackSummaryData = {
      totalFeedback: 342,
      averageRating: 4.2,
      topTags: [
        { tag: 'polite customer', count: 156 },
        { tag: 'price concern', count: 89 },
        { tag: 'quality question', count: 67 },
        { tag: 'delivery inquiry', count: 45 },
        { tag: 'payment issue', count: 23 },
      ],
      trendData: [
        { date: '2024-01-01', averageRating: 4.1, count: 45 },
        { date: '2024-01-08', averageRating: 4.3, count: 52 },
        { date: '2024-01-15', averageRating: 4.0, count: 48 },
        { date: '2024-01-22', averageRating: 4.4, count: 61 },
        { date: '2024-01-29', averageRating: 4.2, count: 55 },
      ],
      timeRange,
    };

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Operator feedback fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch operator feedback' },
      { status: 500 }
    );
  }
}
