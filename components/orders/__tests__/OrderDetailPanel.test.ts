/**
 * Feature: order-management-system, Property 10: Order detail displays all required sections
 * Validates: Requirements 4.2
 * 
 * Property: For any order, the detail panel SHALL render sections for customer information,
 * order items, delivery address (if present), and call history.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { Order, OrderStatus, OrderPriority, CallHistoryEntry, CallResult, CallType } from '@/types/order';
import { hasRequiredSections, hasRequiredCallHistoryFields } from '../OrderDetailPanel';

// All valid order statuses
const ALL_STATUSES: OrderStatus[] = ['pending', 'assigned', 'in_progress', 'confirmed', 'rejected', 'cancelled'];
const ALL_PRIORITIES: OrderPriority[] = ['low', 'normal', 'high', 'urgent'];
const ALL_CALL_RESULTS: CallResult[] = ['confirmed', 'rejected', 'no_answer', 'busy', 'voicemail'];
const ALL_CALL_TYPES: CallType[] = ['human', 'ai'];

// Arbitrary generators
const orderStatusArb = fc.constantFrom<OrderStatus>(...ALL_STATUSES);
const orderPriorityArb = fc.constantFrom<OrderPriority>(...ALL_PRIORITIES);
const callResultArb = fc.constantFrom<CallResult>(...ALL_CALL_RESULTS);
const callTypeArb = fc.constantFrom<CallType>(...ALL_CALL_TYPES);

// Address arbitrary
const addressArb = fc.record({
  street: fc.string({ minLength: 1, maxLength: 100 }),
  city: fc.string({ minLength: 1, maxLength: 50 }),
  state: fc.string({ minLength: 1, maxLength: 50 }),
  zipCode: fc.string({ minLength: 1, maxLength: 20 }),
  country: fc.string({ minLength: 1, maxLength: 50 }),
});

// Client info arbitrary
const clientInfoArb = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }),
  phone: fc.string({ minLength: 1, maxLength: 20 }),
  email: fc.option(fc.emailAddress(), { nil: undefined }),
  address: fc.option(addressArb, { nil: undefined }),
});

// Order item arbitrary
const orderItemArb = fc.record({
  productId: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  quantity: fc.integer({ min: 1, max: 100 }),
  price: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
  variant: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
});


// Valid date arbitrary (constrained to reasonable range using timestamps)
const minTimestamp = new Date('2020-01-01').getTime();
const maxTimestamp = new Date('2030-12-31').getTime();
const validDateArb = fc.integer({ min: minTimestamp, max: maxTimestamp })
  .map(ts => new Date(ts).toISOString());

// Call history entry arbitrary
const callHistoryEntryArb = fc.record({
  operatorId: fc.uuid(),
  operatorName: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
  callType: callTypeArb,
  result: callResultArb,
  notes: fc.option(fc.string({ minLength: 0, maxLength: 500 }), { nil: undefined }),
  timestamp: validDateArb,
  duration: fc.option(fc.integer({ min: 0, max: 3600 }), { nil: undefined }),
});

// Delivery info arbitrary
const deliveryInfoArb = fc.record({
  courier: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
  trackingNumber: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
  estimatedDelivery: fc.option(validDateArb, { nil: undefined }),
  address: addressArb,
});

// Full order arbitrary
const orderArb: fc.Arbitrary<Order> = fc.record({
  _id: fc.uuid(),
  orderId: fc.string({ minLength: 1, maxLength: 20 }),
  shopId: fc.uuid(),
  clientInfo: clientInfoArb,
  items: fc.array(orderItemArb, { minLength: 1, maxLength: 10 }),
  totalAmount: fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
  status: orderStatusArb,
  priority: orderPriorityArb,
  aiRiskScore: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
  operatorFeedback: fc.option(fc.string({ minLength: 0, maxLength: 500 }), { nil: undefined }),
  courierAssignment: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
  region: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
  complaintFlags: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 5 }), { nil: undefined }),
  isRepeatBuyer: fc.option(fc.boolean(), { nil: undefined }),
  customerLifetimeValue: fc.option(fc.float({ min: Math.fround(0), max: Math.fround(1000000), noNaN: true }), { nil: undefined }),
  assignedOperatorId: fc.option(fc.uuid(), { nil: undefined }),
  callHistory: fc.array(callHistoryEntryArb, { minLength: 0, maxLength: 10 }),
  deliveryInfo: fc.option(deliveryInfoArb, { nil: undefined }),
  createdAt: validDateArb,
  updatedAt: validDateArb,
});


describe('OrderDetailPanel - Property Tests', () => {
  /**
   * Feature: order-management-system, Property 10: Order detail displays all required sections
   * Validates: Requirements 4.2
   * 
   * For any order, the detail panel SHALL render sections for customer information,
   * order items, delivery address (if present), and call history.
   */
  it('Property 10: order detail has all required sections', () => {
    fc.assert(
      fc.property(orderArb, (order) => {
        const sections = hasRequiredSections(order);
        
        // Customer info section is always required
        if (!sections.hasCustomerInfo) return false;
        
        // Order items section is always required
        if (!sections.hasOrderItems) return false;
        
        // Call history section is always present (even if empty)
        if (!sections.hasCallHistory) return false;
        
        // Delivery address is only required if order has delivery info or client address
        const hasAddressData = order.deliveryInfo?.address || order.clientInfo?.address;
        if (hasAddressData && !sections.hasDeliveryAddress) return false;
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Customer info section requires name and phone
   * For any order, customer info section should have name and phone
   */
  it('customer info section requires name and phone', () => {
    fc.assert(
      fc.property(orderArb, (order) => {
        const sections = hasRequiredSections(order);
        
        // If order has valid client info, section should be present
        const hasValidClientInfo = order.clientInfo && 
          order.clientInfo.name && 
          order.clientInfo.phone;
        
        return sections.hasCustomerInfo === Boolean(hasValidClientInfo);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Order items section requires at least one item
   * For any order, items section should be present if items array is non-empty
   */
  it('order items section requires at least one item', () => {
    fc.assert(
      fc.property(orderArb, (order) => {
        const sections = hasRequiredSections(order);
        
        const hasItems = order.items && order.items.length > 0;
        return sections.hasOrderItems === hasItems;
      }),
      { numRuns: 100 }
    );
  });
});


describe('CallHistory - Property Tests', () => {
  /**
   * Feature: order-management-system, Property 11: Call history displays required fields
   * Validates: Requirements 4.3
   * 
   * For any order with non-empty call history, each call history entry display 
   * SHALL include operator name, timestamp, outcome, and notes fields.
   */
  it('Property 11: call history entry has all required fields', () => {
    fc.assert(
      fc.property(callHistoryEntryArb, (entry) => {
        const fields = hasRequiredCallHistoryFields(entry);
        
        // Operator name (or ID as fallback) is required
        if (!fields.hasOperatorName) return false;
        
        // Timestamp is required
        if (!fields.hasTimestamp) return false;
        
        // Outcome (result) is required
        if (!fields.hasOutcome) return false;
        
        // Notes field should always be present (can be empty)
        if (!fields.hasNotes) return false;
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Operator identification is always available
   * For any call history entry, either operatorName or operatorId must be present
   */
  it('operator identification is always available', () => {
    fc.assert(
      fc.property(callHistoryEntryArb, (entry) => {
        const fields = hasRequiredCallHistoryFields(entry);
        
        // Either operatorName or operatorId should provide identification
        const hasIdentification = entry.operatorName || entry.operatorId;
        return fields.hasOperatorName === Boolean(hasIdentification);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Timestamp is always a valid ISO string
   * For any call history entry, timestamp should be parseable as a date
   */
  it('timestamp is always a valid date string', () => {
    fc.assert(
      fc.property(callHistoryEntryArb, (entry) => {
        const date = new Date(entry.timestamp);
        return !isNaN(date.getTime());
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Outcome is always a valid call result
   * For any call history entry, result should be one of the valid call results
   */
  it('outcome is always a valid call result', () => {
    fc.assert(
      fc.property(callHistoryEntryArb, (entry) => {
        return ALL_CALL_RESULTS.includes(entry.result);
      }),
      { numRuns: 100 }
    );
  });
});

describe('OrderDetailPanel - Unit Tests', () => {
  it('hasRequiredSections returns correct values for complete order', () => {
    const order: Order = {
      _id: '123',
      orderId: 'ORD-001',
      shopId: 'shop-1',
      clientInfo: {
        name: 'John Doe',
        phone: '+1234567890',
        email: 'john@example.com',
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA',
        },
      },
      items: [
        { productId: 'prod-1', name: 'Product 1', quantity: 2, price: 29.99 },
      ],
      totalAmount: 59.98,
      status: 'pending',
      priority: 'normal',
      callHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const sections = hasRequiredSections(order);
    
    expect(sections.hasCustomerInfo).toBe(true);
    expect(sections.hasOrderItems).toBe(true);
    expect(sections.hasDeliveryAddress).toBe(true);
    expect(sections.hasCallHistory).toBe(true);
  });

  it('hasRequiredCallHistoryFields returns correct values for complete entry', () => {
    const entry: CallHistoryEntry = {
      operatorId: 'op-1',
      operatorName: 'Jane Smith',
      callType: 'human',
      result: 'confirmed',
      notes: 'Customer confirmed the order',
      timestamp: new Date().toISOString(),
      duration: 120,
    };

    const fields = hasRequiredCallHistoryFields(entry);
    
    expect(fields.hasOperatorName).toBe(true);
    expect(fields.hasTimestamp).toBe(true);
    expect(fields.hasOutcome).toBe(true);
    expect(fields.hasNotes).toBe(true);
  });

  it('hasRequiredCallHistoryFields works with operatorId only', () => {
    const entry: CallHistoryEntry = {
      operatorId: 'op-1',
      callType: 'ai',
      result: 'no_answer',
      timestamp: new Date().toISOString(),
    };

    const fields = hasRequiredCallHistoryFields(entry);
    
    expect(fields.hasOperatorName).toBe(true); // operatorId serves as fallback
    expect(fields.hasTimestamp).toBe(true);
    expect(fields.hasOutcome).toBe(true);
    expect(fields.hasNotes).toBe(true);
  });
});
