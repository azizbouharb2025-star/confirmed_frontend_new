import { NextRequest, NextResponse } from 'next/server';
import { getMockTeamMembers, filterOperators } from '@/services/teamService';

/**
 * GET /api/team/members
 * Get all team members and operators for a shop
 * Requirements: 1.1, 1.4, 1.5
 */
export async function GET(_request: NextRequest) {
  try {
    // TODO: Get shopId from session
    // const session = await getServerSession();
    // const shopId = session.user.shopId;
    
    // For now, use mock data
    const shopId = 'shop_123';

    // TODO: Fetch from database
    // const members = await TeamMember.find({ shopId }).sort({ invitedAt: -1 });
    
    // Use mock data for now
    const members = getMockTeamMembers(shopId);
    
    // Filter operators (confirmed members with performance metrics)
    const operators = filterOperators(members);

    return NextResponse.json({
      success: true,
      members,
      operators,
    });
  } catch (error) {
    console.error('Team members fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}
