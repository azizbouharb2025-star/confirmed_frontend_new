/**
 * Call Queue Utilities
 * 
 * Utility functions for the Operator Call Queue
 * These functions are extracted for testability
 */

import type { Order, OrderPriority, CallFeedback, CallHistoryEntry, OrderStatus } from '@/types/order'

/**
 * Priority weight mapping for queue sorting
 * Higher weight = higher priority in queue
 */
export const PRIORITY_WEIGHTS: Record<OrderPriority, number> = {
  urgent: 4,
  high: 3,
  normal: 2,
  low: 1,
}

/**
 * Sort orders by priority (descending) then by AI risk score (descending)
 * Requirements: 5.1
 * 
 * Property 12: Queue sorting by priority then AI score
 * For any call queue with multiple orders, orders SHALL be sorted first by priority 
 * (urgent > high > normal > low), then by AI risk score descending within the same priority level.
 */
export function sortQueueOrders(orders: Order[]): Order[] {
  return [...orders].sort((a, b) => {
    // First sort by priority (higher weight first)
    const priorityDiff = PRIORITY_WEIGHTS[b.priority] - PRIORITY_WEIGHTS[a.priority]
    if (priorityDiff !== 0) return priorityDiff
    
    // Then sort by AI risk score (higher score first, treat undefined as 0)
    const aScore = a.aiRiskScore ?? 0
    const bScore = b.aiRiskScore ?? 0
    return bScore - aScore
  })
}

/**
 * Result of a confirmation operation
 */
export interface ConfirmationResult {
  success: boolean
  order: Order
  callHistoryEntry: CallHistoryEntry
}

/**
 * Result of a rejection operation
 */
export interface RejectionResult {
  success: boolean
  error?: string
  order?: Order
  callHistoryEntry?: CallHistoryEntry
}

/**
 * Process order confirmation
 * Requirements: 5.3
 * 
 * Property 13: Confirmation updates status and history
 * For any order confirmation action, the resulting order SHALL have status 'confirmed' 
 * AND callHistory SHALL contain a new entry with the confirmation details.
 * 
 * @param order - The order to confirm
 * @param feedback - The call feedback from the operator
 * @param operatorId - The ID of the operator confirming the order
 * @returns The updated order with confirmed status and new call history entry
 */
export function processConfirmation(
  order: Order,
  feedback: CallFeedback,
  operatorId: string
): ConfirmationResult {
  const callHistoryEntry: CallHistoryEntry = {
    operatorId,
    callType: 'human',
    result: 'confirmed',
    notes: feedback.notes,
    feedback: feedback,
    timestamp: new Date().toISOString(),
  }

  const updatedOrder: Order = {
    ...order,
    status: 'confirmed' as OrderStatus,
    callHistory: [...order.callHistory, callHistoryEntry],
    updatedAt: new Date().toISOString(),
  }

  return {
    success: true,
    order: updatedOrder,
    callHistoryEntry,
  }
}

/**
 * Process order rejection
 * Requirements: 5.4
 * 
 * Property 14: Rejection requires reason
 * For any order rejection action without a reason provided, the operation SHALL fail. 
 * With a reason provided, the order status SHALL be 'rejected'.
 * 
 * @param order - The order to reject
 * @param reason - The rejection reason (required)
 * @param feedback - The call feedback from the operator
 * @param operatorId - The ID of the operator rejecting the order
 * @returns The result of the rejection operation
 */
export function processRejection(
  order: Order,
  reason: string,
  feedback: CallFeedback,
  operatorId: string
): RejectionResult {
  // Validate rejection reason is provided
  if (!reason || reason.trim() === '') {
    return {
      success: false,
      error: 'Rejection reason is required',
    }
  }

  const callHistoryEntry: CallHistoryEntry = {
    operatorId,
    callType: 'human',
    result: 'rejected',
    notes: reason,
    feedback: feedback,
    timestamp: new Date().toISOString(),
  }

  const updatedOrder: Order = {
    ...order,
    status: 'rejected' as OrderStatus,
    callHistory: [...order.callHistory, callHistoryEntry],
    updatedAt: new Date().toISOString(),
  }

  return {
    success: true,
    order: updatedOrder,
    callHistoryEntry,
  }
}

/**
 * Validate rejection reason
 * 
 * @param reason - The rejection reason to validate
 * @returns true if valid, false otherwise
 */
export function isValidRejectionReason(reason: string): boolean {
  return reason !== undefined && reason !== null && reason.trim().length > 0
}

/**
 * Get priority badge color
 */
export function getPriorityColor(priority: OrderPriority): string {
  switch (priority) {
    case 'urgent': return 'bg-red-500 text-white'
    case 'high': return 'bg-orange-500 text-white'
    case 'normal': return 'bg-blue-500 text-white'
    case 'low': return 'bg-gray-500 text-white'
    default: return 'bg-gray-500 text-white'
  }
}

/**
 * Get AI score color based on thresholds
 */
export function getAIScoreColor(score: number | undefined): string {
  if (score === undefined) return 'text-gray-400'
  if (score > 70) return 'text-green-500'
  if (score >= 40) return 'text-orange-500'
  return 'text-red-500'
}

/**
 * Create default call feedback
 */
export function createDefaultFeedback(): CallFeedback {
  return {
    customerTone: 'neutral',
    priceSensitivity: 'medium',
    qualityConcerns: false,
    deliveryIssues: false,
    confirmationStrength: 'moderate',
    riskTags: [],
    notes: '',
  }
}
