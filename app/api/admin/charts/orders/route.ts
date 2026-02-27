import { NextResponse } from 'next/server';
import { mockAIService } from '@/services/mockAIService';

/**
 * GET /api/admin/charts/orders
 * Returns order trend data for charts
 * Query params: period (daily|weekly|monthly)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') || 'daily') as 'daily' | 'weekly' | 'monthly';
    
    // TODO: Replace with real database aggregation
    // const data = await analyticsService.getOrdersTrend(period);
    
    const data = mockAIService.getOrdersChartData(period);
    const totalOrders = data.reduce((sum, d) => sum + d.orders, 0);
    
    // Calculate change percent (mock)
    const changePercent = parseFloat((Math.random() * 20 - 5).toFixed(1));
    
    return NextResponse.json({
      data,
      totalOrders,
      changePercent,
    });
  } catch (error) {
    console.error('Orders chart error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders chart data' },
      { status: 500 }
    );
  }
}
