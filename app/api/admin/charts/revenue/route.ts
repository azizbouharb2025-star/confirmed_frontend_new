import { NextResponse } from 'next/server';
import { mockAIService } from '@/services/mockAIService';

// Mark route as dynamic (uses query params)
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/charts/revenue
 * Returns revenue trend data for charts
 * Query params: viewMode (daily|cumulative)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const viewMode = (searchParams.get('viewMode') || 'daily') as 'daily' | 'cumulative';
    
    // TODO: Replace with real database aggregation
    // const data = await analyticsService.getRevenueTrend(viewMode);
    
    const data = mockAIService.getRevenueChartData(viewMode);
    const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
    
    // Calculate growth percent (mock)
    const growthPercent = parseFloat((Math.random() * 25 - 5).toFixed(1));
    
    return NextResponse.json({
      data,
      totalRevenue,
      growthPercent,
    });
  } catch (error) {
    console.error('Revenue chart error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue chart data' },
      { status: 500 }
    );
  }
}
