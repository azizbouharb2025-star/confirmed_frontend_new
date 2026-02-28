'use client';

/**
 * Orders Confirmed Detail Page
 * Detailed view of confirmed orders with analytics
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

import { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import WidgetDetailPage from '@/components/dashboard/WidgetDetailPage';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import api from '@/lib/api';

interface Order {
  _id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  total: number;
  status: string;
  createdAt: string;
  confirmedAt?: string;
}

export default function OrdersConfirmedDetailPage() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConfirmedOrders();
  }, []);

  const fetchConfirmedOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get('/api/orders?status=confirmed');
      setOrders(response.data.orders || []);
    } catch (err) {
      console.error('Failed to fetch confirmed orders:', err);
      setError('Failed to load confirmed orders');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmedOrders = orders.filter(o => o.status === 'confirmed');
  const totalRevenue = confirmedOrders.reduce((sum, o) => sum + o.total, 0);
  const avgOrderValue = confirmedOrders.length > 0 ? totalRevenue / confirmedOrders.length : 0;

  return (
    <ProtectedRoute allowedRoles={['shop_owner']}>
      <DashboardLayout>
        <WidgetDetailPage
          title={t('breadcrumb.ordersConfirmed')}
          description="View all confirmed orders with detailed analytics"
          breadcrumbs={[{ label: t('breadcrumb.ordersConfirmed') }]}
        >
          {/* Summary Stats - Requirements: 6.2 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card p-6">
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Confirmed</p>
                  <p className="text-2xl font-bold">{confirmedOrders.length}</p>
                </div>
              </div>
            </div>
            
            <div className="card p-6">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Today</p>
                <p className="text-2xl font-bold">
                  {confirmedOrders.filter(o => {
                    const orderDate = new Date(o.confirmedAt || o.createdAt);
                    const today = new Date();
                    return orderDate.toDateString() === today.toDateString();
                  }).length}
                </p>
              </div>
            </div>
            
            <div className="card p-6">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Revenue</p>
                <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
              </div>
            </div>
            
            <div className="card p-6">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Avg Order Value</p>
                <p className="text-2xl font-bold">${avgOrderValue.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Orders Table - Requirements: 6.4 */}
          <div className="card">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold">Confirmed Orders</h2>
            </div>
            
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="p-8 text-center text-slate-500">Loading confirmed orders...</div>
              ) : error ? (
                <div className="p-8 text-center text-red-500">{error}</div>
              ) : confirmedOrders.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No confirmed orders found</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Confirmed Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                    {confirmedOrders.map((order) => (
                      <tr key={order._id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {order.orderId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {order.customerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {order.customerPhone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">
                          ${order.total.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {new Date(order.confirmedAt || order.createdAt).toLocaleDateString()}
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
