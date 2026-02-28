'use client';

/**
 * Orders Received Detail Page
 * Detailed view of all received orders with filtering and analytics
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

import { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import WidgetDetailPage from '@/components/dashboard/WidgetDetailPage';
import { ShoppingBagIcon } from '@heroicons/react/24/outline';
import api from '@/lib/api';

interface Order {
  _id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  total: number;
  status: string;
  createdAt: string;
}

export default function OrdersReceivedDetailPage() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get('/api/orders');
      setOrders(response.data.orders || []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['shop_owner']}>
      <DashboardLayout userRole="shop_owner">
        <WidgetDetailPage
          title={t('breadcrumb.ordersReceived')}
          description="View all received orders with detailed information and analytics"
          breadcrumbs={[{ label: t('breadcrumb.ordersReceived') }]}
        >
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-6">
              <div className="flex items-center gap-3">
                <ShoppingBagIcon className="w-8 h-8 text-primary-500" />
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Orders</p>
                  <p className="text-2xl font-bold">{orders.length}</p>
                </div>
              </div>
            </div>
            
            <div className="card p-6">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Today</p>
                <p className="text-2xl font-bold">
                  {orders.filter(o => {
                    const orderDate = new Date(o.createdAt);
                    const today = new Date();
                    return orderDate.toDateString() === today.toDateString();
                  }).length}
                </p>
              </div>
            </div>
            
            <div className="card p-6">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">This Week</p>
                <p className="text-2xl font-bold">
                  {orders.filter(o => {
                    const orderDate = new Date(o.createdAt);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return orderDate >= weekAgo;
                  }).length}
                </p>
              </div>
            </div>
          </div>

          {/* Orders Table - Requirements: 6.4 */}
          <div className="card">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold">All Orders</h2>
            </div>
            
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="p-8 text-center text-slate-500">Loading orders...</div>
              ) : error ? (
                <div className="p-8 text-center text-red-500">{error}</div>
              ) : orders.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No orders found</div>
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
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                    {orders.map((order) => (
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          ${order.total.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            order.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {new Date(order.createdAt).toLocaleDateString()}
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
