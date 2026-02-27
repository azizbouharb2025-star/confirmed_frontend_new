import { NextResponse } from 'next/server';
import { mockAIService } from '@/services/mockAIService';

/**
 * GET /api/analytics/risk-score-distribution
 * Returns distribution of orders by AI confidence level
 * Pro+ tier feature
 */
export async function GET() {
  try {
    // TODO: Replace with real AI service call
    // const data = await aiService.getRiskScoreDistribution(shopId);
    
    const data = mockAIService.getRiskScoreData();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Risk score distribution error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch risk score distribution' },
      { status: 500 }
    );
  }
}
