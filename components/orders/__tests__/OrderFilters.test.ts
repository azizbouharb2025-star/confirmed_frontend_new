/**
 * OrderFilters Property Tests
 * 
 * Tests for filter functions used in the Order Management System
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import type { OrderStatus, Order, ShopRef } from '@/types/order'
import {
  filterBySearch,
  filterByStatus,
  filterByDateRange,
  applyAllFilters,
} from '../OrderFilters'
import { filterByShop } from '@/app/panel/admin/orders/page'

// All valid order statuses
const ALL_STATUSES: OrderStatus[] = ['pending', 'assigned', 'in_progress', 'confirmed', 'rejected', 'cancelled']

// Arbitrary for generating order statuses
const orderStatusArb = fc.constantFrom<OrderStatus>(...ALL_STATUSES)

// Arbitrary for generating client info
const clientInfoArb = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  phone: fc.stringMatching(/^\+?[0-9]{7,15}$/),
  email: fc.option(fc.emailAddress(), { nil: undefined }),
})

// Generate a valid ISO date string within a range
const dateStringArb = fc.integer({ 
  min: new Date('2020-01-01').getTime(), 
  max: new Date('2025-12-31').getTime() 
}).map(timestamp => new Date(timestamp).toISOString())

// Arbitrary for generating a minimal order for testing
const minimalOrderArb = fc.record({
  _id: fc.uuid(),
  orderId: fc.string({ minLength: 3, maxLength: 20 }).filter(s => s.trim().length > 0),
  clientInfo: clientInfoArb,
  status: orderStatusArb,
  createdAt: dateStringArb,
  aiRiskScore: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
  region: fc.option(fc.constantFrom('North', 'South', 'East', 'West'), { nil: undefined }),
  courierAssignment: fc.option(fc.constantFrom('FedEx', 'UPS', 'DHL', 'USPS'), { nil: undefined }),
})

// Arbitrary for generating a list of orders
const ordersListArb = fc.array(minimalOrderArb, { minLength: 0, maxLength: 20 })

// Arbitrary for generating search terms
const searchTermArb = fc.string({ minLength: 0, maxLength: 30 })


describe('OrderFilters - Property Tests', () => {
  /**
   * Feature: order-management-system, Property 2: Search filter matches searchable fields
   * Validates: Requirements 2.1
   * 
   * Property: For any search term and order list, all orders in the filtered result 
   * SHALL contain the search term in at least one of: orderId, clientInfo.name, 
   * or clientInfo.phone (case-insensitive).
   */
  describe('Property 2: Search filter matches searchable fields', () => {
    it('all filtered orders contain the search term in orderId, name, or phone', () => {
      fc.assert(
        fc.property(ordersListArb, searchTermArb, (orders, searchTerm) => {
          const filtered = filterBySearch(orders, searchTerm)
          
          // If search term is empty, all orders should be returned
          if (searchTerm.trim() === '') {
            return filtered.length === orders.length
          }
          
          const normalizedSearch = searchTerm.toLowerCase().trim()
          
          // Every filtered order must contain the search term in at least one searchable field
          return filtered.every((order) => {
            const orderId = order.orderId.toLowerCase()
            const name = order.clientInfo.name.toLowerCase()
            const phone = order.clientInfo.phone.toLowerCase()
            
            return (
              orderId.includes(normalizedSearch) ||
              name.includes(normalizedSearch) ||
              phone.includes(normalizedSearch)
            )
          })
        }),
        { numRuns: 100 }
      )
    })

    it('filtered results are a subset of original orders', () => {
      fc.assert(
        fc.property(ordersListArb, searchTermArb, (orders, searchTerm) => {
          const filtered = filterBySearch(orders, searchTerm)
          
          // Filtered results should never exceed original count
          return filtered.length <= orders.length
        }),
        { numRuns: 100 }
      )
    })

    it('search is case-insensitive', () => {
      fc.assert(
        fc.property(ordersListArb, searchTermArb, (orders, searchTerm) => {
          if (searchTerm.trim() === '') return true
          
          const lowerResult = filterBySearch(orders, searchTerm.toLowerCase())
          const upperResult = filterBySearch(orders, searchTerm.toUpperCase())
          
          // Same results regardless of case
          return lowerResult.length === upperResult.length &&
            lowerResult.every((order, i) => order._id === upperResult[i]._id)
        }),
        { numRuns: 100 }
      )
    })
  })


  /**
   * Feature: order-management-system, Property 3: Status filter returns matching orders
   * Validates: Requirements 2.2
   * 
   * Property: For any status filter value and order list, all orders in the filtered 
   * result SHALL have a status equal to the filter value.
   */
  describe('Property 3: Status filter returns matching orders', () => {
    it('all filtered orders have the specified status', () => {
      fc.assert(
        fc.property(ordersListArb, orderStatusArb, (orders, status) => {
          const filtered = filterByStatus(orders, status)
          
          // Every filtered order must have the specified status
          return filtered.every((order) => order.status === status)
        }),
        { numRuns: 100 }
      )
    })

    it('status filter "all" returns all orders', () => {
      fc.assert(
        fc.property(ordersListArb, (orders) => {
          const filtered = filterByStatus(orders, 'all')
          
          // All orders should be returned when status is 'all'
          return filtered.length === orders.length
        }),
        { numRuns: 100 }
      )
    })

    it('filtered results are a subset of original orders', () => {
      fc.assert(
        fc.property(ordersListArb, orderStatusArb, (orders, status) => {
          const filtered = filterByStatus(orders, status)
          
          // Filtered results should never exceed original count
          return filtered.length <= orders.length
        }),
        { numRuns: 100 }
      )
    })

    it('no orders with different status are included', () => {
      fc.assert(
        fc.property(ordersListArb, orderStatusArb, (orders, status) => {
          const filtered = filterByStatus(orders, status)
          
          // No order with a different status should be in the result
          return filtered.every((order) => order.status === status)
        }),
        { numRuns: 100 }
      )
    })
  })


  /**
   * Feature: order-management-system, Property 4: Date range filter returns orders within range
   * Validates: Requirements 2.3
   * 
   * Property: For any date range filter and order list, all orders in the filtered 
   * result SHALL have createdAt timestamp within the specified start and end dates (inclusive).
   */
  describe('Property 4: Date range filter returns orders within range', () => {
    // Arbitrary for generating valid date ranges using timestamps
    const dateRangeArb = fc.tuple(
      fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2024-12-31').getTime() }),
      fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2025-12-31').getTime() })
    ).map(([t1, t2]) => ({
      start: new Date(Math.min(t1, t2)),
      end: new Date(Math.max(t1, t2))
    }))

    it('all filtered orders have createdAt within the date range', () => {
      fc.assert(
        fc.property(ordersListArb, dateRangeArb, (orders, dateRange) => {
          const filtered = filterByDateRange(orders, dateRange)
          
          const startTime = new Date(dateRange.start)
          startTime.setHours(0, 0, 0, 0)
          
          const endTime = new Date(dateRange.end)
          endTime.setHours(23, 59, 59, 999)
          
          // Every filtered order must have createdAt within the range
          return filtered.every((order) => {
            const orderDate = new Date(order.createdAt)
            return orderDate >= startTime && orderDate <= endTime
          })
        }),
        { numRuns: 100 }
      )
    })

    it('null date range returns all orders', () => {
      fc.assert(
        fc.property(ordersListArb, (orders) => {
          const filtered = filterByDateRange(orders, null)
          
          // All orders should be returned when date range is null
          return filtered.length === orders.length
        }),
        { numRuns: 100 }
      )
    })

    it('filtered results are a subset of original orders', () => {
      fc.assert(
        fc.property(ordersListArb, dateRangeArb, (orders, dateRange) => {
          const filtered = filterByDateRange(orders, dateRange)
          
          // Filtered results should never exceed original count
          return filtered.length <= orders.length
        }),
        { numRuns: 100 }
      )
    })

    it('orders outside date range are excluded', () => {
      fc.assert(
        fc.property(ordersListArb, dateRangeArb, (orders, dateRange) => {
          const filtered = filterByDateRange(orders, dateRange)
          const filteredIds = new Set(filtered.map(o => o._id))
          
          const startTime = new Date(dateRange.start)
          startTime.setHours(0, 0, 0, 0)
          
          const endTime = new Date(dateRange.end)
          endTime.setHours(23, 59, 59, 999)
          
          // Orders outside the range should not be in the result
          return orders.every((order) => {
            const orderDate = new Date(order.createdAt)
            const isInRange = orderDate >= startTime && orderDate <= endTime
            const isInResult = filteredIds.has(order._id)
            
            // If in range, should be in result; if not in range, should not be in result
            return isInRange === isInResult
          })
        }),
        { numRuns: 100 }
      )
    })
  })


  /**
   * Feature: order-management-system, Property 5: Multiple filters combine with AND logic
   * Validates: Requirements 2.6
   * 
   * Property: For any combination of active filters and order list, all orders in the 
   * filtered result SHALL satisfy every active filter condition simultaneously.
   */
  describe('Property 5: Multiple filters combine with AND logic', () => {
    // Arbitrary for generating filter combinations using timestamps for dates
    const filterDateRangeArb = fc.tuple(
      fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2024-12-31').getTime() }),
      fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2025-12-31').getTime() })
    ).map(([t1, t2]) => ({
      start: new Date(Math.min(t1, t2)),
      end: new Date(Math.max(t1, t2))
    }))
    
    const filtersArb = fc.record({
      search: fc.oneof(fc.constant(''), searchTermArb),
      status: fc.oneof(fc.constant('all' as const), orderStatusArb),
      dateRange: fc.option(filterDateRangeArb, { nil: null }),
    })

    it('filtered orders satisfy all active filter conditions', () => {
      fc.assert(
        fc.property(ordersListArb, filtersArb, (orders, filters) => {
          const filtered = applyAllFilters(orders, filters)
          
          return filtered.every((order) => {
            // Check search filter
            if (filters.search.trim() !== '') {
              const normalizedSearch = filters.search.toLowerCase().trim()
              const matchesSearch = 
                order.orderId.toLowerCase().includes(normalizedSearch) ||
                order.clientInfo.name.toLowerCase().includes(normalizedSearch) ||
                order.clientInfo.phone.toLowerCase().includes(normalizedSearch)
              if (!matchesSearch) return false
            }
            
            // Check status filter
            if (filters.status !== 'all') {
              if (order.status !== filters.status) return false
            }
            
            // Check date range filter
            if (filters.dateRange) {
              const startTime = new Date(filters.dateRange.start)
              startTime.setHours(0, 0, 0, 0)
              
              const endTime = new Date(filters.dateRange.end)
              endTime.setHours(23, 59, 59, 999)
              
              const orderDate = new Date(order.createdAt)
              if (orderDate < startTime || orderDate > endTime) return false
            }
            
            return true
          })
        }),
        { numRuns: 100 }
      )
    })

    it('applying filters individually then combining equals applying all at once', () => {
      fc.assert(
        fc.property(ordersListArb, filtersArb, (orders, filters) => {
          // Apply all filters at once
          const combinedResult = applyAllFilters(orders, filters)
          
          // Apply filters individually in sequence
          let sequentialResult = orders
          sequentialResult = filterBySearch(sequentialResult, filters.search)
          sequentialResult = filterByStatus(sequentialResult, filters.status)
          sequentialResult = filterByDateRange(sequentialResult, filters.dateRange)
          
          // Results should be identical
          return combinedResult.length === sequentialResult.length &&
            combinedResult.every((order, i) => order._id === sequentialResult[i]._id)
        }),
        { numRuns: 100 }
      )
    })

    it('filtered results are a subset of original orders', () => {
      fc.assert(
        fc.property(ordersListArb, filtersArb, (orders, filters) => {
          const filtered = applyAllFilters(orders, filters)
          
          // Filtered results should never exceed original count
          return filtered.length <= orders.length
        }),
        { numRuns: 100 }
      )
    })

    it('empty filters return all orders', () => {
      fc.assert(
        fc.property(ordersListArb, (orders) => {
          const emptyFilters = {
            search: '',
            status: 'all' as const,
            dateRange: null,
          }
          
          const filtered = applyAllFilters(orders, emptyFilters)
          
          // All orders should be returned with empty filters
          return filtered.length === orders.length
        }),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Feature: order-management-system, Property 15: Admin shop filter returns shop-specific orders
   * Validates: Requirements 6.2
   * 
   * Property: For any shop filter in admin view, all displayed orders SHALL have 
   * shopId matching the selected shop.
   */
  describe('Property 15: Admin shop filter returns shop-specific orders', () => {
    // Arbitrary for generating shop IDs
    const shopIdArb = fc.uuid()
    
    // Arbitrary for generating shop references (can be string or object)
    const shopRefArb = fc.oneof(
      shopIdArb,
      fc.record({
        _id: shopIdArb,
        name: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
      })
    )
    
    // Arbitrary for generating orders with shop IDs
    const orderWithShopArb = fc.record({
      _id: fc.uuid(),
      orderId: fc.string({ minLength: 3, maxLength: 20 }).filter(s => s.trim().length > 0),
      shopId: shopRefArb,
      clientInfo: clientInfoArb,
      status: orderStatusArb,
      createdAt: dateStringArb,
    })
    
    // Arbitrary for generating a list of orders with shops
    const ordersWithShopsArb = fc.array(orderWithShopArb, { minLength: 0, maxLength: 20 })

    it('all filtered orders have shopId matching the selected shop', () => {
      fc.assert(
        fc.property(ordersWithShopsArb, shopIdArb, (orders, shopId) => {
          const filtered = filterByShop(orders as any, shopId)
          
          // Every filtered order must have the specified shopId
          return filtered.every((order) => {
            const orderShopId = typeof order.shopId === 'string' 
              ? order.shopId 
              : (order.shopId as ShopRef)?._id
            return orderShopId === shopId
          })
        }),
        { numRuns: 100 }
      )
    })

    it('empty shop filter returns all orders', () => {
      fc.assert(
        fc.property(ordersWithShopsArb, (orders) => {
          const filtered = filterByShop(orders as any, '')
          
          // All orders should be returned when shop filter is empty
          return filtered.length === orders.length
        }),
        { numRuns: 100 }
      )
    })

    it('undefined shop filter returns all orders', () => {
      fc.assert(
        fc.property(ordersWithShopsArb, (orders) => {
          const filtered = filterByShop(orders as any, undefined)
          
          // All orders should be returned when shop filter is undefined
          return filtered.length === orders.length
        }),
        { numRuns: 100 }
      )
    })

    it('filtered results are a subset of original orders', () => {
      fc.assert(
        fc.property(ordersWithShopsArb, shopIdArb, (orders, shopId) => {
          const filtered = filterByShop(orders as any, shopId)
          
          // Filtered results should never exceed original count
          return filtered.length <= orders.length
        }),
        { numRuns: 100 }
      )
    })

    it('orders from other shops are excluded', () => {
      fc.assert(
        fc.property(ordersWithShopsArb, shopIdArb, (orders, shopId) => {
          const filtered = filterByShop(orders as any, shopId)
          const filteredIds = new Set(filtered.map(o => o._id))
          
          // Orders from other shops should not be in the result
          return orders.every((order) => {
            const orderShopId = typeof order.shopId === 'string' 
              ? order.shopId 
              : (order.shopId as ShopRef)?._id
            const matchesShop = orderShopId === shopId
            const isInResult = filteredIds.has(order._id)
            
            // If matches shop, should be in result; if not, should not be in result
            return matchesShop === isInResult
          })
        }),
        { numRuns: 100 }
      )
    })
  })
})
