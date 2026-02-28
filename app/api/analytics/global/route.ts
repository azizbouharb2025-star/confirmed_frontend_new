import { NextRequest, NextResponse } from 'next/server';
import { GlobalMetrics, TimeRange } from '@/types/analytics';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

/**
 * GET /api/analytics/global
 * Get global metrics for a shop
 * Requirements: 8.2, 8.3, 8.4, 8.5
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
    // const orders = await Order.find({
    //   shopId,
    //   createdAt: { $gte: start, $lte: end }
    // });

    // Mock data for now
    const metrics: GlobalMetrics = {
      orderVolume: 1247,
      confirmationRate: 78.5,
      averageOrderValue: 156.75,
      totalRevenue: 195478.25,
      cancelledOrders: 89,
      cancellationRate: 7.1,
      deliverySuccessRate: 92.3,
      averageDeliveryTime: 2.8,
      timeRange,
    };

    return NextResponse.json({
      success: true,
      metrics,
    });
  } catch (error) {
    console.error('Global analytics fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch global analytics' },
      { status: 500 }
    );
  }
}
