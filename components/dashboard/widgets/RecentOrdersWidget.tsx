'use client';

/**
 * RecentOrdersWidget Component
 * Displays a table with the last 10 orders
 * Requirements: 1.2
 */

import { useState, useEffect } from 'react';
import { ShoppingBagIcon } from '@heroicons/react/24/outline';
import WidgetContainer from '../WidgetContainer';
import StatusBadge from '@/components/ui/StatusBadge';
import api from '@/lib/api';
import type { Order } from '@/types/order';

export interface RecentOrdersWidgetProps {
  /** Maximum number of orders to display (default: 10) */
  maxOrders?: number;
  /** Optional class name for styling */
  className?: string;
}

/**
 * Format currency value
 */
function formatCurrency(amount: number | undefined | null): string {
  const value = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  return new Intl.NumberFormat('fr-TN', {
    style: 'currency',
    currency: 'TND',
  }).format(value);
}

/**
 * Format date to relative or short format
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Get customer name from order
 */
function getCustomerName(order: Order): string {
  return order.clientInfo?.name || 'Unknown Customer';
}

/**
 * Empty state component
 */
function EmptyState(): JSX.Element {
  return (
    <div 
      className="flex flex-col items-center justify-center py-8 text-center"
      data-testid="recent-orders-empty"
    >
      <div className="mb-4 p-3 rounded-full bg-slate-500/10">
        <ShoppingBagIcon className="w-8 h-8 text-slate-400" />
      </div>
      <p className="text-sm text-slate-400 dark:text-slate-400 light:text-gray-600">
        No recent orders found
      </p>
    </div>
  );
}

/**
 * Get the orders to display (limited to maxOrders)
 * Property 3: Recent orders table shows correct count
 * For any list of orders, displays exactly min(maxOrders, totalOrders) orders
 */
export function getDisplayOrders(orders: Order[], maxOrders: number): Order[] {
  return orders.slice(0, Math.min(maxOrders, orders.length));
}

/**
 * RecentOrdersWidget - Displays a table with recent orders
 * 
 * Features:
 * - Shows last 10 orders (configurable via maxOrders prop)
 * - Displays order ID, customer name, status, and amount
 * - Loading and empty states
 * 
 * Requirements: 1.2 - Display recent orders table showing last 10 orders
 */
export function RecentOrdersWidget({
  maxOrders = 10,
  className = '',
}: RecentOrdersWidgetProps): JSX.Element {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get(`/api/orders/recent?limit=${maxOrders}`);

      if (response.data?.orders) {
        setOrders(response.data.orders);
      } else if (Array.isArray(response.data)) {
        setOrders(response.data);
      } else {
        setOrders([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to fetch recent orders';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [maxOrders]);

  const displayOrders = getDisplayOrders(orders, maxOrders);

  return (
    <WidgetContainer
      title="Recent Orders"
      icon={<ShoppingBagIcon className="w-5 h-5" />}
      isLoading={isLoading}
      error={error ?? undefined}
      onRetry={fetchOrders}
      className={className}
    >
      {displayOrders.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-x-auto" data-testid="recent-orders-table">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 dark:border-slate-700 light:border-gray-200">
                <th className="text-left py-2 px-2 font-medium text-slate-400 dark:text-slate-400 light:text-gray-600">
                  Order ID
                </th>
                <th className="text-left py-2 px-2 font-medium text-slate-400 dark:text-slate-400 light:text-gray-600">
                  Customer
                </th>
                <th className="text-left py-2 px-2 font-medium text-slate-400 dark:text-slate-400 light:text-gray-600">
                  Status
                </th>
                <th className="text-right py-2 px-2 font-medium text-slate-400 dark:text-slate-400 light:text-gray-600">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {displayOrders.map((order) => (
                <tr 
                  key={order._id}
                  className="border-b border-slate-800 dark:border-slate-800 light:border-gray-100 hover:bg-slate-800/50 dark:hover:bg-slate-800/50 light:hover:bg-gray-50 transition-colors"
                  data-testid="recent-order-row"
                >
                  <td className="py-3 px-2">
                    <span className="font-mono text-xs">
                      {order.orderId || order._id.slice(-8)}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex flex-col">
                      <span className="font-medium truncate max-w-[150px]">
                        {getCustomerName(order)}
                      </span>
                      <span className="text-xs text-slate-500">
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <StatusBadge status={order.status} size="sm" />
                  </td>
                  <td className="py-3 px-2 text-right font-medium">
                    {formatCurrency(order.totalAmount ?? (order as any).total ?? (order as any).amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </WidgetContainer>
  );
}

export default RecentOrdersWidget;
