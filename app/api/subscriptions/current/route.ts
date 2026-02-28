import { NextResponse } from 'next/server';

/**
 * GET /api/subscriptions/current
 * Returns the current user's subscription plan
 * 
 * For testing/demo purposes, returns 'enterprise' plan
 * In production, this would check the user's actual subscription from database
 */
export async function GET() {
  try {
    // TODO: In production, get user from session and query database
    // const session = await getServerSession();
    // const user = await User.findById(session.user.id);
    // return NextResponse.json({ plan: user.subscriptionPlan });
    
    // For now, return enterprise plan so all features are visible
    return NextResponse.json({
      plan: 'enterprise', // Change this to test different tiers: 'starter' | 'pro' | 'business' | 'enterprise'
      status: 'active',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
    });
  } catch (error) {
    console.error('Subscription fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}
