import { NextResponse } from 'next/server';
import { mockAIService } from '@/services/mockAIService';

/**
 * GET /api/analytics/complaints
 * Returns complaint analytics with trends and categories
 * Business+ tier feature
 */
export async function GET() {
  try {
    // TODO: Replace with real analytics service call
    // const data = await analyticsService.getComplaintsAnalytics(shopId);
    
    const data = mockAIService.getComplaintsAnalytics();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Complaints analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch complaints analytics' },
      { status: 500 }
    );
  }
}
