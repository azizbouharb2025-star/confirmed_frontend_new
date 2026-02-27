import { NextResponse } from 'next/server';
import { mockAIService } from '@/services/mockAIService';

/**
 * GET /api/analytics/operator-feedback
 * Returns operator feedback metrics and top tags
 * Pro+ tier feature
 */
export async function GET() {
  try {
    // TODO: Replace with real analytics service call
    // const data = await analyticsService.getOperatorFeedback(shopId);
    
    const data = mockAIService.getOperatorFeedback();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Operator feedback error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch operator feedback' },
      { status: 500 }
    );
  }
}
