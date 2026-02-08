/**
 * Call Queue Property Tests
 * 
 * Tests for queue sorting and order processing in the Operator Call Queue
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import type { Order, OrderPriority, CallFeedback } from '@/types/order'
import {
  sortQueueOrders,
  PRIORITY_WEIGHTS,
  processConfirmation,
  processRejection,
  isValidRejectionReason,
  createDefaultFeedback,
} from '../queueUtils'

// All valid order priorities
const ALL_PRIORITIES: OrderPriority[] = ['low', 'normal', 'high', 'urgent']

// Arbitrary for generating order priorities
const orderPriorityArb = fc.constantFrom<OrderPriority>(...ALL_PRIORITIES)

// Arbitrary for generating AI risk scores (0-100 or undefined)
const aiScoreArb = fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined })

// Arbitrary for generating client info
const clientInfoArb = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  phone: fc.stringMatching(/^\+?[0-9]{7,15}$/),
  email: fc.option(fc.emailAddress(), { nil: undefined }),
})

// Generate a valid ISO date string
const dateStringArb = fc.integer({ 
  min: new Date('2020-01-01').getTime(), 
  max: new Date('2025-12-31').getTime() 
}).map(timestamp => new Date(timestamp).toISOString())

// Arbitrary for generating call feedback
const callFeedbackArb: fc.Arbitrary<CallFeedback> = fc.record({
  customerTone: fc.constantFrom('positive', 'neutral', 'negative') as fc.Arbitrary<'positive' | 'neutral' | 'negative'>,
  priceSensitivity: fc.constantFrom('low', 'medium', 'high') as fc.Arbitrary<'low' | 'medium' | 'high'>,
  qualityConcerns: fc.boolean(),
  deliveryIssues: fc.boolean(),
  confirmationStrength: fc.constantFrom('strong', 'moderate', 'weak') as fc.Arbitrary<'strong' | 'moderate' | 'weak'>,
  riskTags: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 5 }),
  notes: fc.string({ minLength: 0, maxLength: 200 }),
})

// Arbitrary for generating a minimal order for queue testing
const queueOrderArb = fc.record({
  _id: fc.uuid(),
  orderId: fc.string({ minLength: 3, maxLength: 20 }).filter(s => s.trim().length > 0),
  shopId: fc.uuid(),
  clientInfo: clientInfoArb,
  items: fc.array(fc.record({
    productId: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 30 }),
    quantity: fc.integer({ min: 1, max: 10 }),
    price: fc.float({ min: 1, max: 1000, noNaN: true }),
  }), { minLength: 1, maxLength: 5 }),
  totalAmount: fc.float({ min: 1, max: 10000, noNaN: true }),
  status: fc.constantFrom('pending', 'assigned') as fc.Arbitrary<'pending' | 'assigned'>,
  priority: orderPriorityArb,
  aiRiskScore: aiScoreArb,
  callHistory: fc.constant([]),
  createdAt: dateStringArb,
  updatedAt: dateStringArb,
}) as fc.Arbitrary<Order>

// Arbitrary for generating a list of queue orders
const queueOrdersListArb = fc.array(queueOrderArb, { minLength: 0, maxLength: 30 })

// Arbitrary for generating non-empty strings (valid rejection reasons)
const validReasonArb = fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0)

// Arbitrary for generating empty/whitespace strings (invalid rejection reasons)
const invalidReasonArb = fc.oneof(
  fc.constant(''),
  fc.constant('   '),
  fc.constant('\t\n'),
  fc.constant('  \t  '),
  fc.constant('\n\n\n')
)

// Arbitrary for operator IDs
const operatorIdArb = fc.uuid()


describe('CallQueue - Property Tests', () => {
  /**
   * Feature: order-management-system, Property 12: Queue sorting by priority then AI score
   * Validates: Requirements 5.1
   */
  describe('Property 12: Queue sorting by priority then AI score', () => {
    it('orders are sorted by priority first (urgent > high > normal > low)', () => {
      fc.assert(
        fc.property(queueOrdersListArb, (orders) => {
          const sorted = sortQueueOrders(orders)
          
          for (let i = 1; i < sorted.length; i++) {
            const prevPriority = PRIORITY_WEIGHTS[sorted[i - 1].priority]
            const currPriority = PRIORITY_WEIGHTS[sorted[i].priority]
            
            if (prevPriority < currPriority) {
              return false
            }
          }
          
          return true
        }),
        { numRuns: 100 }
      )
    })

    it('within same priority, orders are sorted by AI score descending', () => {
      fc.assert(
        fc.property(queueOrdersListArb, (orders) => {
          const sorted = sortQueueOrders(orders)
          
          for (let i = 1; i < sorted.length; i++) {
            const prev = sorted[i - 1]
            const curr = sorted[i]
            
            if (prev.priority === curr.priority) {
              const prevScore = prev.aiRiskScore ?? 0
              const currScore = curr.aiRiskScore ?? 0
              
              if (prevScore < currScore) {
                return false
              }
            }
          }
          
          return true
        }),
        { numRuns: 100 }
      )
    })

    it('sorted result contains all original orders', () => {
      fc.assert(
        fc.property(queueOrdersListArb, (orders) => {
          const sorted = sortQueueOrders(orders)
          
          if (sorted.length !== orders.length) return false
          
          const originalIds = new Set(orders.map(o => o._id))
          const sortedIds = new Set(sorted.map(o => o._id))
          
          return originalIds.size === sortedIds.size &&
            [...originalIds].every(id => sortedIds.has(id))
        }),
        { numRuns: 100 }
      )
    })

    it('empty array returns empty array', () => {
      const sorted = sortQueueOrders([])
      expect(sorted).toEqual([])
    })
  })


  /**
   * Feature: order-management-system, Property 13: Confirmation updates status and history
   * Validates: Requirements 5.3
   * 
   * Property: For any order confirmation action, the resulting order SHALL have status 'confirmed' 
   * AND callHistory SHALL contain a new entry with the confirmation details.
   */
  describe('Property 13: Confirmation updates status and history', () => {
    it('confirmed order has status "confirmed"', () => {
      fc.assert(
        fc.property(queueOrderArb, callFeedbackArb, operatorIdArb, (order, feedback, operatorId) => {
          const result = processConfirmation(order, feedback, operatorId)
          
          return result.success && result.order.status === 'confirmed'
        }),
        { numRuns: 100 }
      )
    })

    it('confirmed order has new call history entry', () => {
      fc.assert(
        fc.property(queueOrderArb, callFeedbackArb, operatorIdArb, (order, feedback, operatorId) => {
          const originalHistoryLength = order.callHistory.length
          const result = processConfirmation(order, feedback, operatorId)
          
          return result.success && 
            result.order.callHistory.length === originalHistoryLength + 1
        }),
        { numRuns: 100 }
      )
    })

    it('call history entry has correct result type', () => {
      fc.assert(
        fc.property(queueOrderArb, callFeedbackArb, operatorIdArb, (order, feedback, operatorId) => {
          const result = processConfirmation(order, feedback, operatorId)
          const lastEntry = result.order.callHistory[result.order.callHistory.length - 1]
          
          return result.success && lastEntry.result === 'confirmed'
        }),
        { numRuns: 100 }
      )
    })

    it('call history entry contains operator ID', () => {
      fc.assert(
        fc.property(queueOrderArb, callFeedbackArb, operatorIdArb, (order, feedback, operatorId) => {
          const result = processConfirmation(order, feedback, operatorId)
          const lastEntry = result.order.callHistory[result.order.callHistory.length - 1]
          
          return result.success && lastEntry.operatorId === operatorId
        }),
        { numRuns: 100 }
      )
    })

    it('call history entry contains feedback', () => {
      fc.assert(
        fc.property(queueOrderArb, callFeedbackArb, operatorIdArb, (order, feedback, operatorId) => {
          const result = processConfirmation(order, feedback, operatorId)
          const lastEntry = result.order.callHistory[result.order.callHistory.length - 1]
          
          return result.success && 
            lastEntry.feedback !== undefined &&
            lastEntry.feedback.customerTone === feedback.customerTone &&
            lastEntry.feedback.priceSensitivity === feedback.priceSensitivity
        }),
        { numRuns: 100 }
      )
    })

    it('call history entry has timestamp', () => {
      fc.assert(
        fc.property(queueOrderArb, callFeedbackArb, operatorIdArb, (order, feedback, operatorId) => {
          const result = processConfirmation(order, feedback, operatorId)
          const lastEntry = result.order.callHistory[result.order.callHistory.length - 1]
          
          // Timestamp should be a valid ISO string
          return result.success && 
            lastEntry.timestamp !== undefined &&
            !isNaN(Date.parse(lastEntry.timestamp))
        }),
        { numRuns: 100 }
      )
    })

    it('original order is not mutated', () => {
      fc.assert(
        fc.property(queueOrderArb, callFeedbackArb, operatorIdArb, (order, feedback, operatorId) => {
          const originalStatus = order.status
          const originalHistoryLength = order.callHistory.length
          
          processConfirmation(order, feedback, operatorId)
          
          // Original order should not be changed
          return order.status === originalStatus && 
            order.callHistory.length === originalHistoryLength
        }),
        { numRuns: 100 }
      )
    })
  })


  /**
   * Feature: order-management-system, Property 14: Rejection requires reason
   * Validates: Requirements 5.4
   * 
   * Property: For any order rejection action without a reason provided, the operation SHALL fail. 
   * With a reason provided, the order status SHALL be 'rejected'.
   */
  describe('Property 14: Rejection requires reason', () => {
    it('rejection without reason fails', () => {
      fc.assert(
        fc.property(queueOrderArb, callFeedbackArb, operatorIdArb, invalidReasonArb, (order, feedback, operatorId, reason) => {
          const result = processRejection(order, reason, feedback, operatorId)
          
          return result.success === false && result.error !== undefined
        }),
        { numRuns: 100 }
      )
    })

    it('rejection with valid reason succeeds', () => {
      fc.assert(
        fc.property(queueOrderArb, callFeedbackArb, operatorIdArb, validReasonArb, (order, feedback, operatorId, reason) => {
          const result = processRejection(order, reason, feedback, operatorId)
          
          return result.success === true && result.order !== undefined
        }),
        { numRuns: 100 }
      )
    })

    it('rejected order has status "rejected"', () => {
      fc.assert(
        fc.property(queueOrderArb, callFeedbackArb, operatorIdArb, validReasonArb, (order, feedback, operatorId, reason) => {
          const result = processRejection(order, reason, feedback, operatorId)
          
          return result.success && result.order!.status === 'rejected'
        }),
        { numRuns: 100 }
      )
    })

    it('rejected order has new call history entry', () => {
      fc.assert(
        fc.property(queueOrderArb, callFeedbackArb, operatorIdArb, validReasonArb, (order, feedback, operatorId, reason) => {
          const originalHistoryLength = order.callHistory.length
          const result = processRejection(order, reason, feedback, operatorId)
          
          return result.success && 
            result.order!.callHistory.length === originalHistoryLength + 1
        }),
        { numRuns: 100 }
      )
    })

    it('call history entry has rejection reason in notes', () => {
      fc.assert(
        fc.property(queueOrderArb, callFeedbackArb, operatorIdArb, validReasonArb, (order, feedback, operatorId, reason) => {
          const result = processRejection(order, reason, feedback, operatorId)
          const lastEntry = result.order!.callHistory[result.order!.callHistory.length - 1]
          
          return result.success && lastEntry.notes === reason
        }),
        { numRuns: 100 }
      )
    })

    it('call history entry has result type "rejected"', () => {
      fc.assert(
        fc.property(queueOrderArb, callFeedbackArb, operatorIdArb, validReasonArb, (order, feedback, operatorId, reason) => {
          const result = processRejection(order, reason, feedback, operatorId)
          const lastEntry = result.order!.callHistory[result.order!.callHistory.length - 1]
          
          return result.success && lastEntry.result === 'rejected'
        }),
        { numRuns: 100 }
      )
    })

    it('isValidRejectionReason returns false for empty strings', () => {
      fc.assert(
        fc.property(invalidReasonArb, (reason) => {
          return isValidRejectionReason(reason) === false
        }),
        { numRuns: 100 }
      )
    })

    it('isValidRejectionReason returns true for non-empty strings', () => {
      fc.assert(
        fc.property(validReasonArb, (reason) => {
          return isValidRejectionReason(reason) === true
        }),
        { numRuns: 100 }
      )
    })

    it('original order is not mutated on rejection', () => {
      fc.assert(
        fc.property(queueOrderArb, callFeedbackArb, operatorIdArb, validReasonArb, (order, feedback, operatorId, reason) => {
          const originalStatus = order.status
          const originalHistoryLength = order.callHistory.length
          
          processRejection(order, reason, feedback, operatorId)
          
          return order.status === originalStatus && 
            order.callHistory.length === originalHistoryLength
        }),
        { numRuns: 100 }
      )
    })
  })
})
