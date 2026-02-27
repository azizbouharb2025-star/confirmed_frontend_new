import { NextResponse } from 'next/server';
import { mockAIService } from '@/services/mockAIService';

/**
 * GET /api/admin/kpis
 * Returns system-wide KPI metrics for admin dashboard
 */
export async function GET() {
  try {
    // TODO: Replace with real database queries
    // const data = await adminService.getKPIs();
    
    const data = mockAIService.getAdminKPIs();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Admin KPIs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin KPIs' },
      { status: 500 }
    );
  }
}
