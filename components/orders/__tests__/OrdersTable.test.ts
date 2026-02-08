/**
 * OrdersTable Property Tests
 * 
 * Tests for OrdersTable component functions
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import type { Order, OrderStatus, OrderPriority } from '@/types/order'
import { SubscriptionPlan } from '@/types/subscription'
import { selectAllOrders } from '../OrdersTable'

// All valid order statuses
const ALL_STATUSES: OrderStatus[] = ['pending', 'assigned', 'in_progress', 'confirmed', 'rejected', 'cancelled']
const ALL_PRIORITIES: OrderPriority[] = ['low', 'normal', 'high', 'urgent']
const ALL_PLANS: SubscriptionPlan[] = ['starter', 'pro', 'business', 'enterprise']

// Arbitrary for generating order statuses
const orderStatusArb = fc.constantFrom<OrderStatus>(...ALL_STATUSES)
const orderPriorityArb = fc.constantFrom<OrderPriority>(...ALL_PRIORITIES)
const _subscriptionPlanArb = fc.constantFrom<SubscriptionPlan>(...ALL_PLANS)

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

// Arbitrary for generating a complete order for testing
const orderArb: fc.Arbitrary<Order> = fc.record({
  _id: fc.uuid(),
  orderId: fc.string({ minLength: 3, maxLength: 20 }).filter(s => s.trim().length > 0),
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

// Arbitrary for generating a list of orders
const ordersListArb = fc.array(orderArb, { minLength: 0, maxLength: 20 })


describe('OrdersTable - Property Tests', () => {
  /**
   * Feature: order-management-system, Property 7: Select all captures all filtered orders
   * Validates: Requirements 3.2
   * 
   * Property: For any filtered order list, after triggering "Select All", 
   * the selected IDs array SHALL contain exactly the IDs of all orders 
   * in the current filtered view.
   */
  describe('Property 7: Select all captures all filtered orders', () => {
    it('selectAllOrders returns all order IDs from the input list', () => {
      fc.assert(
        fc.property(ordersListArb, (orders) => {
          const selectedIds = selectAllOrders(orders)
          
          // The selected IDs should have the same length as the orders list
          if (selectedIds.length !== orders.length) {
            return false
          }
          
          // Every order ID should be in the selected IDs
          const selectedSet = new Set(selectedIds)
          return orders.every((order) => selectedSet.has(order._id))
        }),
        { numRuns: 100 }
      )
    })

    it('selectAllOrders returns exactly the IDs of all orders', () => {
      fc.assert(
        fc.property(ordersListArb, (orders) => {
          const selectedIds = selectAllOrders(orders)
          const orderIds = orders.map((o) => o._id)
          
          // Selected IDs should match order IDs exactly
          if (selectedIds.length !== orderIds.length) {
            return false
          }
          
          // Check that both arrays contain the same elements
          const selectedSet = new Set(selectedIds)
          const orderIdSet = new Set(orderIds)
          
          return (
            selectedIds.every((id) => orderIdSet.has(id)) &&
            orderIds.every((id) => selectedSet.has(id))
          )
        }),
        { numRuns: 100 }
      )
    })

    it('selectAllOrders returns empty array for empty orders list', () => {
      const selectedIds = selectAllOrders([])
      expect(selectedIds).toEqual([])
      expect(selectedIds.length).toBe(0)
    })

    it('selectAllOrders preserves order of IDs', () => {
      fc.assert(
        fc.property(ordersListArb, (orders) => {
          const selectedIds = selectAllOrders(orders)
          
          // IDs should be in the same order as the orders
          return orders.every((order, index) => order._id === selectedIds[index])
        }),
        { numRuns: 100 }
      )
    })

    it('selectAllOrders handles orders with unique IDs', () => {
      fc.assert(
        fc.property(ordersListArb, (orders) => {
          const selectedIds = selectAllOrders(orders)
          
          // All selected IDs should be unique (no duplicates)
          const uniqueIds = new Set(selectedIds)
          return uniqueIds.size === selectedIds.length
        }),
        { numRuns: 100 }
      )
    })
  })
})
