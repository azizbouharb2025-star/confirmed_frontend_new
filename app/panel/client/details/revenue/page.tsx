'use client';

/**
 * Revenue Detail Page
 * Detailed revenue breakdown by product, region, and time period
 * Requirements: 6.1, 6.2, 6.3, 6.5
 */

import { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import WidgetDetailPage from '@/components/dashboard/WidgetDetailPage';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';
import api from '@/lib/api';

interface Order {
  _id: string;
  orderId: string;
  total: number;
  status: string;
  createdAt: string;
  items?: Array<{ productName: string; price: number; quantity: number }>;
}

interface RevenueByProduct {
  productName: string;
  revenue: number;
  orderCount: number;
}

export default function RevenueDetailPage() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get('/api/orders?status=confirmed');
      setOrders(response.data.orders || []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Failed to load revenue data');
    } finally {
      setIsLoading(false);
    }
  };

  const filterOrdersByTime = (orders: Order[]) => {
    const now = new Date();
    return orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      switch (timeFilter) {
        case 'today':
          return orderDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return orderDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return orderDate >= monthAgo;
        default:
          return true;
      }
    });
  };

  const filteredOrders = filterOrdersByTime(orders.filter(o => o.status === 'confirmed'));
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
  const avgOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;

  // Calculate revenue by product - Requirements: 6.5
  const revenueByProduct: RevenueByProduct[] = [];
  const productMap = new Map<string, { revenue: number; count: number }>();

  filteredOrders.forEach(order => {
    if (order.items && order.items.length > 0) {
      order.items.forEach(item => {
        const existing = productMap.get(item.productName) || { revenue: 0, count: 0 };
        productMap.set(item.productName, {
          revenue: existing.revenue + (item.price * item.quantity),
          count: existing.count + 1,
        });
      });
    }
  });

  productMap.forEach((data, productName) => {
    revenueByProduct.push({
      productName,
      revenue: data.revenue,
      orderCount: data.count,
    });
  });

  revenueByProduct.sort((a, b) => b.revenue - a.revenue);

  return (
    <ProtectedRoute allowedRoles={['shop_owner']}>
      <DashboardLayout>
        <WidgetDetailPage
          title={t('breadcrumb.revenue')}
          description="Detailed revenue breakdown and analytics"
          breadcrumbs={[{ label: t('breadcrumb.revenue') }]}
        >
          {/* Time Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setTimeFilter('today')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeFilter === 'today'
                  ? 'bg-primary-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeFilter('week')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeFilter === 'week'
                  ? 'bg-primary-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setTimeFilter('month')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeFilter === 'month'
                  ? 'bg-primary-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setTimeFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeFilter === 'all'
                  ? 'bg-primary-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All Time
            </button>
          </div>

          {/* Summary Stats - Requirements: 6.2 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-6">
              <div className="flex items-center gap-3">
                <CurrencyDollarIcon className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    ${totalRevenue.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="card p-6">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Orders</p>
                <p className="text-2xl font-bold">{filteredOrders.length}</p>
              </div>
            </div>
            
            <div className="card p-6">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Avg Order Value</p>
                <p className="text-2xl font-bold">${avgOrderValue.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Revenue by Product - Requirements: 6.5 */}
          <div className="card">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold">Revenue by Product</h2>
            </div>
            
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="p-8 text-center text-slate-500">Loading revenue data...</div>
              ) : error ? (
                <div className="p-8 text-center text-red-500">{error}</div>
              ) : revenueByProduct.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No revenue data available</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Orders
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Avg per Order
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                    {revenueByProduct.map((product, index) => (
                      <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {product.productName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">
                          ${product.revenue.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {product.orderCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          ${(product.revenue / product.orderCount).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </WidgetDetailPage>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
