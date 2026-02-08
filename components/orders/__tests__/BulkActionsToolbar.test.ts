/**
 * BulkActionsToolbar Property Tests
 * 
 * Tests for BulkActionsToolbar component functions
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { 
  getSelectionDisplayCount, 
  validateBulkResultTotals,
  processBulkAction,
  validateExportContainsAllOrders,
  generateOrdersCSV,
  countCSVDataRows
} from '../BulkActionsToolbar'
import type { BulkResult, Order, OrderStatus, OrderPriority } from '@/types/order'

// Arbitrary for generating arrays of unique IDs (simulating selected order IDs)
const selectedIdsArb = fc.array(fc.uuid(), { minLength: 0, maxLength: 100 })
  .map(ids => [...new Set(ids)]) // Ensure unique IDs

describe('BulkActionsToolbar - Property Tests', () => {
  /**
   * Feature: order-management-system, Property 6: Selection count matches toolbar display
   * Validates: Requirements 3.1
   * 
   * Property: For any set of selected order IDs, the bulk action toolbar 
   * SHALL display a count equal to the length of the selected IDs array.
   */
  describe('Property 6: Selection count matches toolbar display', () => {
    it('getSelectionDisplayCount returns the exact length of selectedIds array', () => {
      fc.assert(
        fc.property(selectedIdsArb, (selectedIds) => {
          const displayCount = getSelectionDisplayCount(selectedIds)
          
          // The display count should exactly match the array length
          return displayCount === selectedIds.length
        }),
        { numRuns: 100 }
      )
    })

    it('getSelectionDisplayCount returns 0 for empty selection', () => {
      const displayCount = getSelectionDisplayCount([])
      expect(displayCount).toBe(0)
    })

    it('getSelectionDisplayCount returns 1 for single selection', () => {
      fc.assert(
        fc.property(fc.uuid(), (id) => {
          const displayCount = getSelectionDisplayCount([id])
          return displayCount === 1
        }),
        { numRuns: 100 }
      )
    })


    it('getSelectionDisplayCount is consistent across multiple calls', () => {
      fc.assert(
        fc.property(selectedIdsArb, (selectedIds) => {
          const count1 = getSelectionDisplayCount(selectedIds)
          const count2 = getSelectionDisplayCount(selectedIds)
          
          // Multiple calls with same input should return same result
          return count1 === count2
        }),
        { numRuns: 100 }
      )
    })

    it('getSelectionDisplayCount handles large selections correctly', () => {
      fc.assert(
        fc.property(
          fc.array(fc.uuid(), { minLength: 50, maxLength: 200 }).map(ids => [...new Set(ids)]),
          (selectedIds) => {
            const displayCount = getSelectionDisplayCount(selectedIds)
            return displayCount === selectedIds.length
          }
        ),
        { numRuns: 50 }
      )
    })
  })
})


// Arbitrary for generating BulkResult with valid totals
const bulkResultArb = (totalSelected: number): fc.Arbitrary<BulkResult> => {
  return fc.integer({ min: 0, max: totalSelected }).map((successful) => ({
    successful,
    failed: totalSelected - successful,
    errors: Array.from({ length: totalSelected - successful }, (_, i) => ({
      orderId: `order-${i}`,
      error: 'Test error',
    })),
  }))
}

describe('BulkActionsToolbar - Property Tests (continued)', () => {
  /**
   * Feature: order-management-system, Property 9: Bulk action continues on partial failure
   * Validates: Requirements 3.6
   * 
   * Property: For any bulk action where some operations fail, the result SHALL report
   * the count of successful operations plus the count of failed operations equal to
   * the total selected count.
   */
  describe('Property 9: Bulk action continues on partial failure', () => {
    it('validateBulkResultTotals returns true when successful + failed equals total', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          (totalSelected) => {
            return fc.assert(
              fc.property(bulkResultArb(totalSelected), (result) => {
                return validateBulkResultTotals(result, totalSelected) === true
              }),
              { numRuns: 10 }
            )
          }
        ),
        { numRuns: 20 }
      )
    })

    it('validateBulkResultTotals returns false when totals do not match', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 0, max: 50 }),
          fc.integer({ min: 0, max: 50 }),
          (totalSelected, successful, failed) => {
            // Only test cases where the sum doesn't equal total
            if (successful + failed === totalSelected) return true
            
            const result: BulkResult = {
              successful,
              failed,
              errors: [],
            }
            return validateBulkResultTotals(result, totalSelected) === false
          }
        ),
        { numRuns: 100 }
      )
    })

    it('processBulkAction returns correct totals for all success', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.uuid(), { minLength: 1, maxLength: 20 }),
          async (ids) => {
            const action = async () => { /* success */ }
            const result = await processBulkAction(ids, action, (id) => id)
            
            return (
              result.successful === ids.length &&
              result.failed === 0 &&
              result.errors.length === 0 &&
              validateBulkResultTotals(result, ids.length)
            )
          }
        ),
        { numRuns: 50 }
      )
    })

    it('processBulkAction returns correct totals for all failures', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.uuid(), { minLength: 1, maxLength: 20 }),
          async (ids) => {
            const action = async () => { throw new Error('Test error') }
            const result = await processBulkAction(ids, action, (id) => id)
            
            return (
              result.successful === 0 &&
              result.failed === ids.length &&
              result.errors.length === ids.length &&
              validateBulkResultTotals(result, ids.length)
            )
          }
        ),
        { numRuns: 50 }
      )
    })


    it('processBulkAction returns correct totals for partial failures', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.uuid(), { minLength: 2, maxLength: 20 }),
          fc.integer({ min: 0, max: 100 }), // failure percentage
          async (ids, failurePercent) => {
            let callIndex = 0
            const failureThreshold = Math.floor(ids.length * (failurePercent / 100))
            
            const action = async () => {
              const shouldFail = callIndex < failureThreshold
              callIndex++
              if (shouldFail) {
                throw new Error('Test error')
              }
            }
            
            const result = await processBulkAction(ids, action, (id) => id)
            
            // The key property: successful + failed must equal total
            return validateBulkResultTotals(result, ids.length)
          }
        ),
        { numRuns: 50 }
      )
    })

    it('processBulkAction continues processing after failures', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.uuid(), { minLength: 3, maxLength: 10 }),
          async (ids) => {
            const processedIds: string[] = []
            
            // First item fails, rest succeed
            const action = async (id: string) => {
              processedIds.push(id)
              if (processedIds.length === 1) {
                throw new Error('First item fails')
              }
            }
            
            const result = await processBulkAction(ids, action, (id) => id)
            
            // All items should have been processed
            return (
              processedIds.length === ids.length &&
              result.successful === ids.length - 1 &&
              result.failed === 1 &&
              validateBulkResultTotals(result, ids.length)
            )
          }
        ),
        { numRuns: 50 }
      )
    })

    it('processBulkAction records error details for failed items', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.uuid(), { minLength: 1, maxLength: 10 }),
          async (ids) => {
            const errorMessage = 'Custom error message'
            const action = async () => { throw new Error(errorMessage) }
            
            const result = await processBulkAction(ids, action, (id) => id)
            
            // All errors should have the correct message
            return result.errors.every((e) => e.error === errorMessage)
          }
        ),
        { numRuns: 50 }
      )
    })
  })
})


// All valid order statuses and priorities for generating orders
const ALL_STATUSES: OrderStatus[] = ['pending', 'assigned', 'in_progress', 'confirmed', 'rejected', 'cancelled']
const ALL_PRIORITIES: OrderPriority[] = ['low', 'normal', 'high', 'urgent']

// Arbitrary for generating order statuses
const orderStatusArb = fc.constantFrom<OrderStatus>(...ALL_STATUSES)
const orderPriorityArb = fc.constantFrom<OrderPriority>(...ALL_PRIORITIES)

// Arbitrary for generating client info
// Names should avoid special CSV characters for simpler validation
const clientInfoArb = fc.record({
  name: fc.stringMatching(/^[A-Za-z ]{1,50}$/).filter(s => s.trim().length > 0),
  phone: fc.stringMatching(/^\+?[0-9]{7,15}$/),
  email: fc.option(fc.emailAddress(), { nil: undefined }),
})

// Generate a valid ISO date string
const dateStringArb = fc.integer({ 
  min: new Date('2020-01-01').getTime(), 
  max: new Date('2025-12-31').getTime() 
}).map(timestamp => new Date(timestamp).toISOString())


// Arbitrary for generating a complete order for testing
// Order IDs should be alphanumeric to avoid CSV escaping issues
const orderArb: fc.Arbitrary<Order> = fc.record({
  _id: fc.uuid(),
  orderId: fc.stringMatching(/^[A-Za-z0-9]{3,20}$/),
  shopId: fc.uuid(),
  clientInfo: clientInfoArb,
  items: fc.array(fc.record({
    productId: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    quantity: fc.integer({ min: 1, max: 100 }),
    price: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
    variant: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
  }), { minLength: 1, maxLength: 5 }),
  totalAmount: fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
  status: orderStatusArb,
  priority: orderPriorityArb,
  aiRiskScore: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
  operatorFeedback: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: undefined }),
  courierAssignment: fc.option(fc.constantFrom('FedEx', 'UPS', 'DHL', 'USPS'), { nil: undefined }),
  region: fc.option(fc.constantFrom('North', 'South', 'East', 'West'), { nil: undefined }),
  complaintFlags: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 3 }), { nil: undefined }),
  isRepeatBuyer: fc.option(fc.boolean(), { nil: undefined }),
  customerLifetimeValue: fc.option(fc.float({ min: Math.fround(0), max: Math.fround(1000000), noNaN: true }), { nil: undefined }),
  assignedOperatorId: fc.option(fc.uuid(), { nil: undefined }),
  callHistory: fc.constant([]),
  deliveryInfo: fc.option(fc.record({
    courier: fc.option(fc.string(), { nil: undefined }),
    trackingNumber: fc.option(fc.string(), { nil: undefined }),
    estimatedDelivery: fc.option(dateStringArb, { nil: undefined }),
    address: fc.record({
      street: fc.string({ minLength: 1, maxLength: 100 }),
      city: fc.string({ minLength: 1, maxLength: 50 }),
      state: fc.string({ minLength: 1, maxLength: 50 }),
      zipCode: fc.string({ minLength: 1, maxLength: 20 }),
      country: fc.string({ minLength: 1, maxLength: 50 }),
    }),
  }), { nil: undefined }),
  createdAt: dateStringArb,
  updatedAt: dateStringArb,
})

// Arbitrary for generating a list of orders with unique IDs
const ordersListArb = fc.array(orderArb, { minLength: 0, maxLength: 20 })
  .map(orders => {
    // Ensure unique order IDs
    const seen = new Set<string>()
    return orders.filter(order => {
      if (seen.has(order.orderId)) return false
      seen.add(order.orderId)
      return true
    })
  })


describe('BulkActionsToolbar - Property Tests (Export)', () => {
  /**
   * Feature: order-management-system, Property 8: Bulk export contains all selected orders
   * Validates: Requirements 3.5
   * 
   * Property: For any selection of order IDs and export operation, the generated CSV
   * SHALL contain a row for each selected order ID.
   */
  describe('Property 8: Bulk export contains all selected orders', () => {
    it('generateOrdersCSV produces CSV with row for each order', () => {
      fc.assert(
        fc.property(ordersListArb, (orders) => {
          const csv = generateOrdersCSV(orders)
          const rowCount = countCSVDataRows(csv)
          
          // Number of data rows should equal number of orders
          return rowCount === orders.length
        }),
        { numRuns: 100 }
      )
    })

    it('validateExportContainsAllOrders returns true when all orders are in CSV', () => {
      fc.assert(
        fc.property(ordersListArb, (orders) => {
          const csv = generateOrdersCSV(orders)
          return validateExportContainsAllOrders(csv, orders)
        }),
        { numRuns: 100 }
      )
    })

    it('generateOrdersCSV returns empty string for empty orders array', () => {
      const csv = generateOrdersCSV([])
      expect(csv).toBe('')
      expect(countCSVDataRows(csv)).toBe(0)
    })

    it('generateOrdersCSV includes header row', () => {
      fc.assert(
        fc.property(
          fc.array(orderArb, { minLength: 1, maxLength: 5 }),
          (orders) => {
            const csv = generateOrdersCSV(orders)
            const lines = csv.split('\n')
            
            // First line should be header
            return lines[0].includes('Order ID') && lines[0].includes('Customer Name')
          }
        ),
        { numRuns: 50 }
      )
    })

    it('each order ID appears exactly once in CSV', () => {
      fc.assert(
        fc.property(ordersListArb.filter(orders => orders.length > 0), (orders) => {
          const csv = generateOrdersCSV(orders)
          const lines = csv.split('\n').filter(line => line.trim().length > 0)
          
          // Skip header row, get order IDs from first column of each data row
          const dataRows = lines.slice(1)
          const orderIdsInCsv = dataRows.map(row => {
            // First column is the order ID (before first comma, handling quoted values)
            const match = row.match(/^"?([^",]*)"?,/)
            return match ? match[1] : ''
          })
          
          // Each order ID should appear exactly once in the CSV order ID column
          return orders.every((order) => {
            const count = orderIdsInCsv.filter(id => id === order.orderId).length
            return count === 1
          })
        }),
        { numRuns: 100 }
      )
    })

    it('CSV contains all required fields for each order', () => {
      fc.assert(
        fc.property(
          fc.array(orderArb, { minLength: 1, maxLength: 5 }),
          (orders) => {
            const csv = generateOrdersCSV(orders)
            
            // Each order should have its key fields in the CSV
            return orders.every((order) => 
              csv.includes(order.orderId) &&
              csv.includes(order.clientInfo.name) &&
              csv.includes(order.clientInfo.phone) &&
              csv.includes(order.status)
            )
          }
        ),
        { numRuns: 50 }
      )
    })

    it('countCSVDataRows returns 0 for empty or whitespace-only content', () => {
      expect(countCSVDataRows('')).toBe(0)
      expect(countCSVDataRows('   ')).toBe(0)
      expect(countCSVDataRows('\n')).toBe(0)
    })

    it('countCSVDataRows correctly counts rows excluding header', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }),
          (numOrders) => {
            // Create a simple CSV with header and data rows
            const header = 'col1,col2,col3'
            const dataRows = Array.from({ length: numOrders }, (_, i) => `val${i}1,val${i}2,val${i}3`)
            const csv = [header, ...dataRows].join('\n')
            
            return countCSVDataRows(csv) === numOrders
          }
        ),
        { numRuns: 50 }
      )
    })
  })
})
