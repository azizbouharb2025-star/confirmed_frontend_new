/**
 * Order Service - API methods for order management
 * Requirements: 1.1, 3.3, 3.5, 6.1
 */

import api from '@/lib/api';
import logger from '@/lib/logger';
import {
  Order,
  OrderStatus,
  OrderFilters,
  PaginatedOrders,
  GetOrdersParams,
  BulkResult,
} from '@/types/order';

/**
 * Build query string from GetOrdersParams
 */
function buildQueryString(params: GetOrdersParams): string {
  const queryParts: string[] = [];

  // Pagination
  queryParts.push(`page=${params.page}`);
  queryParts.push(`limit=${params.limit}`);

  // Sorting
  if (params.sortBy) {
    queryParts.push(`sortBy=${params.sortBy}`);
    queryParts.push(`sortOrder=${params.sortOrder || 'asc'}`);
  }

  // Filters
  const { filters } = params;

  if (filters.search) {
    queryParts.push(`search=${encodeURIComponent(filters.search)}`);
  }

  if (filters.status && filters.status !== 'all') {
    queryParts.push(`status=${filters.status}`);
  }

  if (filters.dateRange) {
    queryParts.push(`startDate=${filters.dateRange.start.toISOString()}`);
    queryParts.push(`endDate=${filters.dateRange.end.toISOString()}`);
  }

  if (filters.aiScoreRange) {
    queryParts.push(`aiScoreMin=${filters.aiScoreRange.min}`);
    queryParts.push(`aiScoreMax=${filters.aiScoreRange.max}`);
  }

  if (filters.region) {
    queryParts.push(`region=${encodeURIComponent(filters.region)}`);
  }

  if (filters.courier) {
    queryParts.push(`courier=${encodeURIComponent(filters.courier)}`);
  }

  if (filters.shopId) {
    queryParts.push(`shopId=${filters.shopId}`);
  }

  return queryParts.join('&');
}


/**
 * Transform API response to PaginatedOrders format
 */
interface ApiPaginatedResponse {
  orders?: Order[];
  data?: Order[];
  total?: number;
  totalCount?: number;
  page?: number;
  currentPage?: number;
  limit?: number;
  pageSize?: number;
  totalPages?: number;
}

function transformPaginatedResponse(response: ApiPaginatedResponse): PaginatedOrders {
  return {
    orders: response.orders || response.data || [],
    total: response.total || response.totalCount || 0,
    page: response.page || response.currentPage || 1,
    limit: response.limit || response.pageSize || 10,
    totalPages: response.totalPages || Math.ceil((response.total || 0) / (response.limit || 10)),
  };
}

/**
 * Order Service
 * Handles all order-related API calls
 */
export const orderService = {
  /**
   * Get paginated orders with filtering and sorting
   * Requirements: 1.1, 6.1
   */
  async getOrders(params: GetOrdersParams): Promise<PaginatedOrders> {
    const queryString = buildQueryString(params);
    const response = await api.get(`/api/orders?${queryString}`);
    return transformPaginatedResponse(response.data);
  },

  /**
   * Get a single order by ID
   * Requirements: 4.1
   */
  async getOrderById(id: string): Promise<Order> {
    const response = await api.get(`/api/orders/${id}`);
    return response.data;
  },

  /**
   * Update order status with optional notes
   * Requirements: 5.3, 5.4
   */
  async updateOrderStatus(
    id: string,
    status: OrderStatus,
    notes?: string
  ): Promise<Order> {
    const response = await api.patch(`/api/orders/${id}/status`, {
      status,
      notes,
    });
    return response.data;
  },

  /**
   * Assign an operator to an order
   * Requirements: 6.3
   */
  async assignOperator(orderId: string, operatorId: string): Promise<Order> {
    const response = await api.patch(`/api/orders/${orderId}/assign`, {
      operatorId,
    });
    return response.data;
  },

  /**
   * Bulk update status for multiple orders
   * Requirements: 3.3, 3.4, 3.6
   */
  async bulkUpdateStatus(
    ids: string[],
    status: OrderStatus
  ): Promise<BulkResult> {
    const results: BulkResult = {
      successful: 0,
      failed: 0,
      errors: [],
    };

    // Process each order individually to handle partial failures
    // Requirements: 3.6 - Continue processing on partial failure
    for (const id of ids) {
      try {
        await api.patch(`/api/orders/${id}/status`, { status });
        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          orderId: id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  },

  /**
   * Export orders to CSV
   * Requirements: 3.5
   */
  async exportOrders(ids: string[]): Promise<Blob> {
    const response = await api.post('/api/orders/export', { orderIds: ids });
    
    // If the API returns CSV data directly
    if (response.data instanceof Blob) {
      return response.data;
    }

    // If the API returns order data, convert to CSV
    const orders: Order[] = response.data.orders || response.data;
    return generateCSV(orders);
  },
};


/**
 * Escape a value for CSV format
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Generate CSV string from orders array
 * Exported separately for testing
 */
function generateCSVString(orders: Order[]): string {
  if (orders.length === 0) {
    return '';
  }

  // CSV headers
  const headers = [
    'Order ID',
    'Customer Name',
    'Phone',
    'Email',
    'Status',
    'Priority',
    'Total Amount',
    'AI Risk Score',
    'Region',
    'Courier',
    'Is Repeat Buyer',
    'Created At',
    'Updated At',
  ];

  // Build CSV rows
  const rows = orders.map((order) => [
    order.orderId,
    order.clientInfo.name,
    order.clientInfo.phone,
    order.clientInfo.email || '',
    order.status,
    order.priority,
    order.totalAmount.toString(),
    order.aiRiskScore?.toString() || '',
    order.region || '',
    order.courierAssignment || '',
    order.isRepeatBuyer ? 'Yes' : 'No',
    order.createdAt,
    order.updatedAt,
  ]);

  // Build CSV content
  return [
    headers.map(escapeCSV).join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ].join('\n');
}

/**
 * Generate CSV Blob from orders array
 */
function generateCSV(orders: Order[]): Blob {
  const csvContent = generateCSVString(orders);
  return new Blob([csvContent], { type: 'text/csv' });
}

/**
 * Helper to trigger CSV download in browser
 */
export function downloadCSV(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export for testing
export { buildQueryString, transformPaginatedResponse, generateCSV, generateCSVString, escapeCSV };

/**
 * Get orders updated since a specific timestamp
 * Requirements: 7.4 - Sync missed updates on reconnection
 */
export async function getOrdersSince(since: string): Promise<Order[]> {
  try {
    const response = await api.get(`/api/orders/updates?since=${encodeURIComponent(since)}`);
    return response.data.orders || response.data || [];
  } catch (error) {
    logger.error('Failed to fetch updates since:', { since, error }, 'OrderService');
    return [];
  }
}

export default orderService;
