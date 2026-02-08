/**
 * OrderService Unit Tests
 * Requirements: 1.6 - Test API call formatting and error handling
 * 
 * Tests cover:
 * - Query string building for API calls
 * - Response transformation
 * - CSV generation for export
 */

import { describe, it, expect } from 'vitest';
import {
  buildQueryString,
  transformPaginatedResponse,
  generateCSVString,
} from '../orderService';
import { GetOrdersParams, Order, OrderFilters } from '@/types/order';

describe('buildQueryString', () => {
  it('builds basic pagination query string', () => {
    const params: GetOrdersParams = {
      page: 1,
      limit: 10,
      filters: {
        search: '',
        status: 'all',
        dateRange: null,
      },
    };

    const queryString = buildQueryString(params);
    expect(queryString).toContain('page=1');
    expect(queryString).toContain('limit=10');
  });

  it('includes sorting parameters when provided', () => {
    const params: GetOrdersParams = {
      page: 1,
      limit: 10,
      filters: { search: '', status: 'all', dateRange: null },
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };

    const queryString = buildQueryString(params);
    expect(queryString).toContain('sortBy=createdAt');
    expect(queryString).toContain('sortOrder=desc');
  });


  it('includes search filter when provided', () => {
    const params: GetOrdersParams = {
      page: 1,
      limit: 10,
      filters: {
        search: 'john doe',
        status: 'all',
        dateRange: null,
      },
    };

    const queryString = buildQueryString(params);
    expect(queryString).toContain('search=john%20doe');
  });

  it('includes status filter when not "all"', () => {
    const params: GetOrdersParams = {
      page: 1,
      limit: 10,
      filters: {
        search: '',
        status: 'pending',
        dateRange: null,
      },
    };

    const queryString = buildQueryString(params);
    expect(queryString).toContain('status=pending');
  });

  it('excludes status filter when "all"', () => {
    const params: GetOrdersParams = {
      page: 1,
      limit: 10,
      filters: {
        search: '',
        status: 'all',
        dateRange: null,
      },
    };

    const queryString = buildQueryString(params);
    expect(queryString).not.toContain('status=');
  });

  it('includes date range filter when provided', () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');
    const params: GetOrdersParams = {
      page: 1,
      limit: 10,
      filters: {
        search: '',
        status: 'all',
        dateRange: { start: startDate, end: endDate },
      },
    };

    const queryString = buildQueryString(params);
    expect(queryString).toContain('startDate=');
    expect(queryString).toContain('endDate=');
  });

  it('includes AI score range filter when provided', () => {
    const params: GetOrdersParams = {
      page: 1,
      limit: 10,
      filters: {
        search: '',
        status: 'all',
        dateRange: null,
        aiScoreRange: { min: 40, max: 80 },
      },
    };

    const queryString = buildQueryString(params);
    expect(queryString).toContain('aiScoreMin=40');
    expect(queryString).toContain('aiScoreMax=80');
  });

  it('includes region and courier filters when provided', () => {
    const params: GetOrdersParams = {
      page: 1,
      limit: 10,
      filters: {
        search: '',
        status: 'all',
        dateRange: null,
        region: 'North',
        courier: 'DHL',
      },
    };

    const queryString = buildQueryString(params);
    expect(queryString).toContain('region=North');
    expect(queryString).toContain('courier=DHL');
  });

  it('includes shopId filter for admin queries', () => {
    const params: GetOrdersParams = {
      page: 1,
      limit: 10,
      filters: {
        search: '',
        status: 'all',
        dateRange: null,
        shopId: 'shop123',
      },
    };

    const queryString = buildQueryString(params);
    expect(queryString).toContain('shopId=shop123');
  });
});


describe('transformPaginatedResponse', () => {
  it('transforms standard API response format', () => {
    const apiResponse = {
      orders: [{ _id: '1', orderId: 'ORD-001' }],
      total: 100,
      page: 2,
      limit: 10,
      totalPages: 10,
    };

    const result = transformPaginatedResponse(apiResponse);

    expect(result.orders).toEqual(apiResponse.orders);
    expect(result.total).toBe(100);
    expect(result.page).toBe(2);
    expect(result.limit).toBe(10);
    expect(result.totalPages).toBe(10);
  });

  it('handles alternative response format with data array', () => {
    const apiResponse = {
      data: [{ _id: '1', orderId: 'ORD-001' }],
      totalCount: 50,
      currentPage: 1,
      pageSize: 20,
    };

    const result = transformPaginatedResponse(apiResponse);

    expect(result.orders).toEqual(apiResponse.data);
    expect(result.total).toBe(50);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('calculates totalPages when not provided', () => {
    const apiResponse = {
      orders: [],
      total: 45,
      page: 1,
      limit: 10,
    };

    const result = transformPaginatedResponse(apiResponse);

    expect(result.totalPages).toBe(5); // ceil(45/10)
  });

  it('handles empty response gracefully', () => {
    const apiResponse = {};

    const result = transformPaginatedResponse(apiResponse);

    expect(result.orders).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.totalPages).toBe(0);
  });
});


describe('generateCSVString', () => {
  const createMockOrder = (overrides: Partial<Order> = {}): Order => ({
    _id: '1',
    orderId: 'ORD-001',
    shopId: 'shop1',
    clientInfo: {
      name: 'John Doe',
      phone: '+1234567890',
      email: 'john@example.com',
    },
    items: [],
    totalAmount: 99.99,
    status: 'pending',
    priority: 'normal',
    callHistory: [],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    ...overrides,
  });

  it('generates empty string for empty orders array', () => {
    const csv = generateCSVString([]);
    expect(csv).toBe('');
  });

  it('generates CSV with headers and data rows', () => {
    const orders = [createMockOrder()];
    const csv = generateCSVString(orders);

    // Check headers
    expect(csv).toContain('Order ID');
    expect(csv).toContain('Customer Name');
    expect(csv).toContain('Phone');
    expect(csv).toContain('Status');

    // Check data
    expect(csv).toContain('ORD-001');
    expect(csv).toContain('John Doe');
    expect(csv).toContain('+1234567890');
    expect(csv).toContain('pending');
  });

  it('includes optional fields when present', () => {
    const orders = [
      createMockOrder({
        aiRiskScore: 85,
        region: 'North',
        courierAssignment: 'DHL',
        isRepeatBuyer: true,
      }),
    ];
    const csv = generateCSVString(orders);

    expect(csv).toContain('85');
    expect(csv).toContain('North');
    expect(csv).toContain('DHL');
    expect(csv).toContain('Yes');
  });

  it('handles values with commas by quoting', () => {
    const orders = [
      createMockOrder({
        clientInfo: {
          name: 'Doe, John',
          phone: '+1234567890',
        },
      }),
    ];
    const csv = generateCSVString(orders);

    expect(csv).toContain('"Doe, John"');
  });

  it('handles values with quotes by escaping', () => {
    const orders = [
      createMockOrder({
        clientInfo: {
          name: 'John "Johnny" Doe',
          phone: '+1234567890',
        },
      }),
    ];
    const csv = generateCSVString(orders);

    expect(csv).toContain('"John ""Johnny"" Doe"');
  });

  it('generates multiple rows for multiple orders', () => {
    const orders = [
      createMockOrder({ orderId: 'ORD-001' }),
      createMockOrder({ orderId: 'ORD-002', _id: '2' }),
      createMockOrder({ orderId: 'ORD-003', _id: '3' }),
    ];
    const csv = generateCSVString(orders);
    const lines = csv.split('\n');

    // 1 header + 3 data rows
    expect(lines.length).toBe(4);
    expect(csv).toContain('ORD-001');
    expect(csv).toContain('ORD-002');
    expect(csv).toContain('ORD-003');
  });
});
