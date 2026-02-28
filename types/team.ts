/**
 * Team Management System - Team Types and Interfaces
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

// Team Member Status Types
export type TeamMemberStatus = 'invited' | 'pending' | 'confirmed';
export type TeamMemberRole = 'operator' | 'manager' | 'admin';

/**
 * Performance metrics for operators
 */
export interface OperatorPerformanceMetrics {
  totalCalls: number;
  confirmedCalls: number;
  confirmationRate: number;
  averageCallDuration: number;
  lastCallAt?: string;
}

/**
 * Team member interface
 */
export interface TeamMember {
  _id: string;
  shopId: string;
  email: string;
  name?: string;
  role: TeamMemberRole;
  status: TeamMemberStatus;
  invitedAt: string;
  invitedBy: string;
  acceptedAt?: string;
  lastActiveAt?: string;
  performanceMetrics?: OperatorPerformanceMetrics;
}

/**
 * Operator interface (confirmed team member with performance metrics)
 */
export interface Operator extends TeamMember {
  status: 'confirmed';
  performanceMetrics: OperatorPerformanceMetrics;
}

/**
 * Team invitation interface
 */
export interface TeamInvitation {
  _id: string;
  shopId: string;
  email: string;
  role: TeamMemberRole;
  token: string;
  expiresAt: string;
  createdAt: string;
  createdBy: string;
}

/**
 * Request body for inviting a team member
 */
export interface InviteTeamMemberRequest {
  email: string;
  role: TeamMemberRole;
}

/**
 * Request body for accepting an invitation
 */
export interface AcceptInvitationRequest {
  token: string;
  name: string;
}

/**
 * Response for team member operations
 */
export interface TeamMemberResponse {
  success: boolean;
  message: string;
  member?: TeamMember;
}

/**
 * Response for team members list
 */
export interface TeamMembersResponse {
  success: boolean;
  members: TeamMember[];
  operators: Operator[];
}
