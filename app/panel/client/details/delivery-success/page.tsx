'use client';

/**
 * Delivery Success Detail Page
 * Detailed view of delivery success rates and analytics
 * Requirements: 6.1, 6.2, 6.3
 */

import { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import WidgetDetailPage from '@/components/dashboard/WidgetDetailPage';
import { TruckIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import api from '@/lib/api';

interface Order {
  _id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  total: number;
  status: string;
  deliveryStatus?: string;
  createdAt: string;
  deliveredAt?: string;
}

export default function DeliverySuccessDetailPage() {
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
      setError('Failed to load delivery data');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter orders that have been shipped
  const shippedOrders = orders.filter(o => 
    o.status === 'shipped' || o.status === 'delivered' || o.deliveryStatus
  );
  
  const deliveredOrders = shippedOrders.filter(o => 
    o.status === 'delivered' || o.deliveryStatus === 'delivered'
  );
  
  const failedDeliveries = shippedOrders.filter(o => 
    o.deliveryStatus === 'failed' || o.deliveryStatus === 'returned'
  );
  
  const successRate = shippedOrders.length > 0 
    ? (deliveredOrders.length / shippedOrders.length) * 100 
    : 0;

  return (
    <ProtectedRoute allowedRoles={['shop_owner']}>
      <DashboardLayout userRole="shop_owner">
        <WidgetDetailPage
          title={t('breadcrumb.deliverySuccess')}
          description="Detailed delivery success rates and performance analytics"
          breadcrumbs={[{ label: t('breadcrumb.deliverySuccess') }]}
        >
          {/* Summary Stats - Requirements: 6.2 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card p-6">
              <div className="flex items-center gap-3">
                <TruckIcon className="w-8 h-8 text-primary-500" />
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Shipped</p>
                  <p className="text-2xl font-bold">{shippedOrders.length}</p>
                </div>
              </div>
            </div>
            
            <div className="card p-6">
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Delivered</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {deliveredOrders.length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="card p-6">
              <div className="flex items-center gap-3">
                <XCircleIcon className="w-8 h-8 text-red-500" />
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Failed</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {failedDeliveries.length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="card p-6">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Success Rate</p>
                <p className={`text-2xl font-bold ${
                  successRate >= 80 ? 'text-green-600 dark:text-green-400' :
                  successRate >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-red-600 dark:text-red-400'
                }`}>
                  {successRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Delivered Orders Table - Requirements: 6.3 */}
          <div className="card">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold">Delivered Orders</h2>
            </div>
            
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="p-8 text-center text-slate-500">Loading delivery data...</div>
              ) : error ? (
                <div className="p-8 text-center text-red-500">{error}</div>
              ) : deliveredOrders.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No delivered orders found</div>
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
                        Delivered Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                    {deliveredOrders.map((order) => (
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {order.deliveredAt 
                            ? new Date(order.deliveredAt).toLocaleDateString()
                            : new Date(order.createdAt).toLocaleDateString()
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Failed Deliveries Table */}
          {failedDeliveries.length > 0 && (
            <div className="card">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
                  Failed Deliveries
                </h2>
              </div>
              
              <div className="overflow-x-auto">
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
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                    {failedDeliveries.map((order) => (
                      <tr key={order._id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {order.orderId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {order.customerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            {order.deliveryStatus || 'failed'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </WidgetDetailPage>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
