import { NextResponse } from 'next/server';
import { mockAIService } from '@/services/mockAIService';

/**
 * GET /api/admin/system-health
 * Returns health status of all system services
 */
export async function GET() {
  try {
    // TODO: Replace with real health checks
    // const services = await healthCheckService.checkAllServices();
    
    const services = mockAIService.getSystemHealth();
    
    return NextResponse.json({ services });
  } catch (error) {
    console.error('System health error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system health' },
      { status: 500 }
    );
  }
}
