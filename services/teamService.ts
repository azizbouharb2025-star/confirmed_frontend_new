/**
 * Team Management Service
 * Handles team member invitations, acceptance, and management
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

import { 
  TeamMember, 
  TeamInvitation, 
  Operator, 
  TeamMemberStatus,
  TeamMemberRole,
  InviteTeamMemberRequest 
} from '@/types/team';

/**
 * Generate a unique invitation token
 */
export function generateInvitationToken(): string {
  return `inv_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Calculate invitation expiration date (7 days from now)
 */
export function calculateExpirationDate(): string {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 7);
  return expirationDate.toISOString();
}

/**
 * Create a team invitation
 * Status is set to 'pending' by default
 */
export function createTeamInvitation(
  shopId: string,
  email: string,
  role: TeamMemberRole,
  invitedBy: string
): TeamInvitation {
  return {
    _id: `invitation_${Date.now()}`,
    shopId,
    email,
    role,
    token: generateInvitationToken(),
    expiresAt: calculateExpirationDate(),
    createdAt: new Date().toISOString(),
    createdBy: invitedBy,
  };
}

/**
 * Create a team member from an invitation
 * Initial status is 'pending'
 */
export function createTeamMemberFromInvitation(
  invitation: TeamInvitation
): TeamMember {
  return {
    _id: `member_${Date.now()}`,
    shopId: invitation.shopId,
    email: invitation.email,
    role: invitation.role,
    status: 'pending',
    invitedAt: invitation.createdAt,
    invitedBy: invitation.createdBy,
  };
}

/**
 * Accept a team invitation
 * Updates status from 'pending' to 'confirmed'
 */
export function acceptTeamInvitation(
  member: TeamMember,
  name: string
): TeamMember {
  return {
    ...member,
    name,
    status: 'confirmed',
    acceptedAt: new Date().toISOString(),
  };
}

/**
 * Filter operators from team members
 * Returns only confirmed team members
 */
export function filterOperators(members: TeamMember[]): Operator[] {
  return members.filter(
    (member): member is Operator => 
      member.status === 'confirmed' && 
      member.performanceMetrics !== undefined
  );
}

/**
 * Check if an invitation is expired
 */
export function isInvitationExpired(invitation: TeamInvitation): boolean {
  return new Date(invitation.expiresAt) < new Date();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate invitation request
 */
export function validateInvitationRequest(
  request: InviteTeamMemberRequest
): { valid: boolean; error?: string } {
  if (!request.email || !isValidEmail(request.email)) {
    return { valid: false, error: 'Invalid email address' };
  }

  if (!request.role || !['operator', 'manager', 'admin'].includes(request.role)) {
    return { valid: false, error: 'Invalid role' };
  }

  return { valid: true };
}

/**
 * Calculate operator performance metrics
 * This is a placeholder - actual implementation would query call history
 */
export function calculateOperatorMetrics(
  operatorId: string,
  callHistory: any[]
): {
  totalCalls: number;
  confirmedCalls: number;
  confirmationRate: number;
  averageCallDuration: number;
  lastCallAt?: string;
} {
  const operatorCalls = callHistory.filter(call => call.operatorId === operatorId);
  const totalCalls = operatorCalls.length;
  const confirmedCalls = operatorCalls.filter(call => call.result === 'confirmed').length;
  const confirmationRate = totalCalls > 0 ? (confirmedCalls / totalCalls) * 100 : 0;
  
  const totalDuration = operatorCalls.reduce((sum, call) => sum + (call.duration || 0), 0);
  const averageCallDuration = totalCalls > 0 ? totalDuration / totalCalls : 0;
  
  const lastCall = operatorCalls.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )[0];
  
  return {
    totalCalls,
    confirmedCalls,
    confirmationRate: Math.round(confirmationRate * 100) / 100,
    averageCallDuration: Math.round(averageCallDuration),
    lastCallAt: lastCall?.timestamp,
  };
}

/**
 * Mock data for development
 */
export function getMockTeamMembers(shopId: string): TeamMember[] {
  return [
    {
      _id: 'member_1',
      shopId,
      email: 'operator1@example.com',
      name: 'Ahmed Hassan',
      role: 'operator',
      status: 'confirmed',
      invitedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      invitedBy: 'owner_1',
      acceptedAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString(),
      lastActiveAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      performanceMetrics: {
        totalCalls: 145,
        confirmedCalls: 112,
        confirmationRate: 77.24,
        averageCallDuration: 180,
        lastCallAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
    },
    {
      _id: 'member_2',
      shopId,
      email: 'operator2@example.com',
      name: 'Fatima Zahra',
      role: 'operator',
      status: 'confirmed',
      invitedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      invitedBy: 'owner_1',
      acceptedAt: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString(),
      lastActiveAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      performanceMetrics: {
        totalCalls: 98,
        confirmedCalls: 82,
        confirmationRate: 83.67,
        averageCallDuration: 165,
        lastCallAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      },
    },
    {
      _id: 'member_3',
      shopId,
      email: 'manager@example.com',
      name: 'Youssef Alami',
      role: 'manager',
      status: 'confirmed',
      invitedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      invitedBy: 'owner_1',
      acceptedAt: new Date(Date.now() - 44 * 24 * 60 * 60 * 1000).toISOString(),
      lastActiveAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      _id: 'member_4',
      shopId,
      email: 'newoperator@example.com',
      role: 'operator',
      status: 'pending',
      invitedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      invitedBy: 'owner_1',
    },
  ];
}
