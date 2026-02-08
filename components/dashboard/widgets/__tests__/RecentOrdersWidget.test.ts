/**
 * Feature: subscription-tiered-dashboards, Property 3: Recent orders table shows correct count
 * Validates: Requirements 1.2
 * 
 * Property: For any list of orders, the recent orders table SHALL display 
 * exactly min(10, totalOrders) orders.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getDisplayOrders } from '../RecentOrdersWidget';
import type { Order, OrderStatus, OrderPriority } from '@/types/order';

// All valid order statuses
const ORDER_STATUSES: OrderStatus[] = ['pending', 'assigned', 'in_progress', 'confirmed', 'rejected', 'cancelled'];
const ORDER_PRIORITIES: OrderPriority[] = ['low', 'normal', 'high', 'urgent'];

/**
 * Arbitrary for generating a valid Order object
 */
const orderArb: fc.Arbitrary<Order> = fc.record({
  _id: fc.uuid(),
  orderId: fc.string({ minLength: 5, maxLength: 20 }),
  shopId: fc.uuid(),
  clientInfo: fc.record({
    name: fc.string({ minLength: 1, maxLength: 50 }),
    phone: fc.string({ minLength: 10, maxLength: 15 }),
    email: fc.option(fc.emailAddress(), { nil: undefined }),
    address: fc.option(
      fc.record({
        street: fc.string({ minLength: 1, maxLength: 100 }),
        city: fc.string({ minLength: 1, maxLength: 50 }),
        state: fc.string({ minLength: 1, maxLength: 50 }),
        zipCode: fc.string({ minLength: 5, maxLength: 10 }),
        country: fc.string({ minLength: 1, maxLength: 50 }),
      }),
      { nil: undefined }
    ),
  }),
  items: fc.array(
    fc.record({
      productId: fc.uuid(),
      name: fc.string({ minLength: 1, maxLength: 100 }),
      quantity: fc.integer({ min: 1, max: 100 }),
      price: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
      variant: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
    }),
    { minLength: 1, maxLength: 10 }
  ),
  totalAmount: fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
  status: fc.constantFrom<OrderStatus>(...ORDER_STATUSES),
  priority: fc.constantFrom<OrderPriority>(...ORDER_PRIORITIES),
  callHistory: fc.constant([]),
  createdAt: fc.integer({ min: 1577836800000, max: 1767225600000 }).map(ts => new Date(ts).toISOString()),
  updatedAt: fc.integer({ min: 1577836800000, max: 1767225600000 }).map(ts => new Date(ts).toISOString()),
});

/**
 * Arbitrary for generating a list of orders
 */
const ordersListArb = fc.array(orderArb, { minLength: 0, maxLength: 50 });

/**
 * Arbitrary for generating maxOrders value (typically 10, but can vary)
 */
const maxOrdersArb = fc.integer({ min: 1, max: 20 });

describe('RecentOrdersWidget - Property Tests', () => {
  /**
   * Property 3: Recent orders table shows correct count
   * For any list of orders and maxOrders value, the display count is min(maxOrders, totalOrders)
   */
  it('Property 3: displays exactly min(maxOrders, totalOrders) orders', () => {
    fc.assert(
      fc.property(ordersListArb, maxOrdersArb, (orders, maxOrders) => {
        const displayOrders = getDisplayOrders(orders, maxOrders);
        const expectedCount = Math.min(maxOrders, orders.length);
        
        return displayOrders.length === expectedCount;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Display orders are a prefix of the original orders
   * The displayed orders should be the first N orders from the original list
   */
  it('displayed orders are a prefix of the original orders', () => {
    fc.assert(
      fc.property(ordersListArb, maxOrdersArb, (orders, maxOrders) => {
        const displayOrders = getDisplayOrders(orders, maxOrders);
        
        // Each displayed order should match the corresponding order in the original list
        return displayOrders.every((order, index) => order._id === orders[index]._id);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Empty orders list results in empty display
   */
  it('empty orders list results in empty display', () => {
    fc.assert(
      fc.property(maxOrdersArb, (maxOrders) => {
        const displayOrders = getDisplayOrders([], maxOrders);
        return displayOrders.length === 0;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Display count never exceeds maxOrders
   */
  it('display count never exceeds maxOrders', () => {
    fc.assert(
      fc.property(ordersListArb, maxOrdersArb, (orders, maxOrders) => {
        const displayOrders = getDisplayOrders(orders, maxOrders);
        return displayOrders.length <= maxOrders;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Display count never exceeds total orders
   */
  it('display count never exceeds total orders', () => {
    fc.assert(
      fc.property(ordersListArb, maxOrdersArb, (orders, maxOrders) => {
        const displayOrders = getDisplayOrders(orders, maxOrders);
        return displayOrders.length <= orders.length;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: When orders.length <= maxOrders, all orders are displayed
   */
  it('when orders count is less than or equal to maxOrders, all orders are displayed', () => {
    fc.assert(
      fc.property(ordersListArb, maxOrdersArb, (orders, maxOrders) => {
        if (orders.length <= maxOrders) {
          const displayOrders = getDisplayOrders(orders, maxOrders);
          return displayOrders.length === orders.length;
        }
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Default maxOrders of 10 shows at most 10 orders
   */
  it('default maxOrders of 10 shows at most 10 orders', () => {
    fc.assert(
      fc.property(ordersListArb, (orders) => {
        const displayOrders = getDisplayOrders(orders, 10);
        return displayOrders.length <= 10;
      }),
      { numRuns: 100 }
    );
  });
});

describe('RecentOrdersWidget - Unit Tests', () => {
  it('returns empty array for empty input', () => {
    expect(getDisplayOrders([], 10)).toEqual([]);
  });

  it('returns all orders when count is less than maxOrders', () => {
    const orders = [
      { _id: '1' },
      { _id: '2' },
      { _id: '3' },
    ] as Order[];
    
    const result = getDisplayOrders(orders, 10);
    expect(result.length).toBe(3);
  });

  it('returns exactly maxOrders when count exceeds maxOrders', () => {
    const orders = Array.from({ length: 15 }, (_, i) => ({ _id: String(i) })) as Order[];
    
    const result = getDisplayOrders(orders, 10);
    expect(result.length).toBe(10);
  });

  it('returns first N orders, not random selection', () => {
    const orders = Array.from({ length: 15 }, (_, i) => ({ _id: String(i) })) as Order[];
    
    const result = getDisplayOrders(orders, 5);
    expect(result.map(o => o._id)).toEqual(['0', '1', '2', '3', '4']);
  });
});
