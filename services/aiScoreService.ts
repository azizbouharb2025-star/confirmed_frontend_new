/**
 * AI Score Service
 * Calculates AI-based risk scores for orders
 * Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
 */

import type { Order, RiskLevel } from '@/types/order'

/**
 * Factors that influence AI score calculation
 */
interface ScoreFactors {
  customerHistory: number // 0-100: repeat customer score
  region: number // 0-100: region risk score
  orderValue: number // 0-100: order value score
  timeOfDay: number // 0-100: time-based risk score
}

/**
 * Calculate AI score based on order data
 * Score range: 0-100 (higher is better/lower risk)
 * 
 * Requirements: 5.2, 5.6
 * Property 16: AI score range constraint (0-100)
 * Property 18: AI score calculation factors
 */
export function calculateAIScore(order: Order): number {
  const factors = extractScoreFactors(order)
  
  // Weighted average of all factors
  const weights = {
    customerHistory: 0.35,
    region: 0.25,
    orderValue: 0.25,
    timeOfDay: 0.15,
  }
  
  const score = 
    factors.customerHistory * weights.customerHistory +
    factors.region * weights.region +
    factors.orderValue * weights.orderValue +
    factors.timeOfDay * weights.timeOfDay
  
  // Ensure score is within valid range
  return Math.max(0, Math.min(100, Math.round(score)))
}

/**
 * Extract scoring factors from order data
 */
function extractScoreFactors(order: Order): ScoreFactors {
  return {
    customerHistory: calculateCustomerHistoryScore(order),
    region: calculateRegionScore(order),
    orderValue: calculateOrderValueScore(order),
    timeOfDay: calculateTimeOfDayScore(order),
  }
}

/**
 * Calculate customer history score
 * Repeat buyers get higher scores
 */
function calculateCustomerHistoryScore(order: Order): number {
  if (order.isRepeatBuyer) {
    return 85 // High confidence for repeat buyers
  }
  
  if (order.customerLifetimeValue && order.customerLifetimeValue > 0) {
    // Scale based on lifetime value (higher value = higher score)
    const valueScore = Math.min(order.customerLifetimeValue / 1000, 1) * 30
    return 50 + valueScore // 50-80 range
  }
  
  return 40 // New customer, moderate risk
}

/**
 * Calculate region-based score
 * Some regions may have higher delivery success rates
 */
function calculateRegionScore(order: Order): number {
  if (!order.region) {
    return 50 // No region data, neutral score
  }
  
  // High-confidence regions (example: major cities)
  const highConfidenceRegions = ['tunis', 'sfax', 'sousse', 'ariana']
  const regionLower = order.region.toLowerCase()
  
  if (highConfidenceRegions.some(r => regionLower.includes(r))) {
    return 75
  }
  
  // Medium confidence for other regions
  return 55
}

/**
 * Calculate order value score
 * Very low or very high values may indicate risk
 */
function calculateOrderValueScore(order: Order): number {
  const amount = order.totalAmount
  
  // Suspicious if too low (< 10 TND)
  if (amount < 10) {
    return 30
  }
  
  // Suspicious if too high (> 1000 TND) - potential fraud
  if (amount > 1000) {
    return 40
  }
  
  // Sweet spot: 50-300 TND
  if (amount >= 50 && amount <= 300) {
    return 80
  }
  
  // Moderate range
  return 60
}

/**
 * Calculate time-based score
 * Orders at unusual hours may have higher risk
 */
function calculateTimeOfDayScore(order: Order): number {
  const orderDate = new Date(order.createdAt)
  const hour = orderDate.getHours()
  
  // Business hours (9 AM - 6 PM): high confidence
  if (hour >= 9 && hour <= 18) {
    return 75
  }
  
  // Evening (6 PM - 11 PM): moderate confidence
  if (hour >= 18 && hour <= 23) {
    return 60
  }
  
  // Late night/early morning (11 PM - 9 AM): lower confidence
  return 45
}

/**
 * Determine risk level based on AI score
 * Requirements: 5.3, 5.4, 5.5
 * Property 17: AI score color coding
 */
export function getRiskLevel(score: number): RiskLevel {
  if (score < 40) {
    return 'high'
  }
  if (score <= 70) {
    return 'medium'
  }
  return 'low'
}

/**
 * Get color class for AI score display
 * Requirements: 5.3, 5.4, 5.5
 */
export function getScoreColorClass(score: number): string {
  const riskLevel = getRiskLevel(score)
  
  switch (riskLevel) {
    case 'high':
      return 'text-red-600 dark:text-red-400'
    case 'medium':
      return 'text-orange-600 dark:text-orange-400'
    case 'low':
      return 'text-green-600 dark:text-green-400'
  }
}

/**
 * Get background color class for AI score badge
 */
export function getScoreBgColorClass(score: number): string {
  const riskLevel = getRiskLevel(score)
  
  switch (riskLevel) {
    case 'high':
      return 'bg-red-100 dark:bg-red-900/20'
    case 'medium':
      return 'bg-orange-100 dark:bg-orange-900/20'
    case 'low':
      return 'bg-green-100 dark:bg-green-900/20'
  }
}

/**
 * Generate mock AI score for orders without real scoring
 * Requirements: 5.7 - Mock fallback
 */
export function generateMockAIScore(order: Order): number {
  // Use order ID to generate consistent mock scores
  const hash = order._id.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0)
  }, 0)
  
  // Generate score between 20-95
  const mockScore = 20 + (hash % 76)
  
  return mockScore
}

/**
 * Get or calculate AI score for an order
 * Uses existing score if available, calculates if missing, or generates mock
 * Requirements: 5.6, 5.7
 */
export function getAIScore(order: Order, useMock: boolean = false): number {
  // Use existing aiScore if available
  if (order.aiScore !== undefined) {
    return order.aiScore
  }
  
  // Use legacy aiRiskScore if available
  if (order.aiRiskScore !== undefined) {
    return order.aiRiskScore
  }
  
  // Generate mock score if requested
  if (useMock) {
    return generateMockAIScore(order)
  }
  
  // Calculate score from order data
  return calculateAIScore(order)
}

/**
 * Sort orders by AI score
 * Requirements: 5.8
 * Property 19: AI score sorting
 */
export function sortOrdersByAIScore(
  orders: Order[],
  direction: 'asc' | 'desc' = 'desc',
  useMock: boolean = false
): Order[] {
  return [...orders].sort((a, b) => {
    const scoreA = getAIScore(a, useMock)
    const scoreB = getAIScore(b, useMock)
    
    return direction === 'asc' ? scoreA - scoreB : scoreB - scoreA
  })
}

/**
 * Filter orders by AI score range
 * Requirements: 5.8
 */
export function filterOrdersByAIScore(
  orders: Order[],
  minScore: number,
  maxScore: number,
  useMock: boolean = false
): Order[] {
  return orders.filter(order => {
    const score = getAIScore(order, useMock)
    return score >= minScore && score <= maxScore
  })
}
