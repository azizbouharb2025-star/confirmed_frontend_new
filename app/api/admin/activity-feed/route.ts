import { NextResponse } from 'next/server';
import { mockAIService } from '@/services/mockAIService';

/**
 * GET /api/admin/activity-feed
 * Returns recent system activities
 */
export async function GET() {
  try {
    // TODO: Replace with real activity log queries
    // const activities = await activityService.getRecentActivities(limit);
    
    const activities = mockAIService.getActivityFeed();
    
    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Activity feed error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity feed' },
      { status: 500 }
    );
  }
}
