import { NextResponse } from 'next/server';
import { mockAIService } from '@/services/mockAIService';

/**
 * GET /api/analytics/courier-performance
 * Returns courier performance metrics
 * Business+ tier feature
 */
export async function GET() {
  try {
    // TODO: Replace with real analytics service call
    // const data = await analyticsService.getCourierPerformance(shopId);
    
    const couriers = mockAIService.getCourierPerformance();
    
    return NextResponse.json({ couriers });
  } catch (error) {
    console.error('Courier performance error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courier performance' },
      { status: 500 }
    );
  }
}
