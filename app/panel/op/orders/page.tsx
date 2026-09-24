'use client'

import { useState, useEffect } from 'react'
import { ClipboardDocumentListIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useLanguage } from '@/hooks/useLanguage'
import StatusBadge from '@/components/ui/StatusBadge'
import type { OrderStatus } from '@/types/order'
import api from '@/lib/api'
import logger from '@/lib/logger'
import { formatCurrency } from '@/lib/formatCurrency'

interface Order {
  _id: string
  confirmedId: number
  orderId: string
  clientInfo: { name: string; phone: string }
  totalAmount: number
  status: OrderStatus
  createdAt: string
  assignedOperatorId?: { name: string }
}

export default function OrdersReception() {
  const { t } = useLanguage()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchOrders = async () => {
    try {
      const response = await api.get('/api/orders?page=1&limit=50')
      setOrders(response.data.orders)
    } catch (error) {
      logger.error('Failed to fetch orders:', error, 'Orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 30000)
    return () => clearInterval(interval)
  }, [])

  const filteredOrders = orders.filter(order => {
    const normalizedSearch = searchTerm.trim().replace(/^#/, '')
    const matchesSearch =
      String(order.confirmedId ?? '').includes(normalizedSearch) ||
      order.clientInfo.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <ProtectedRoute allowedRoles={['operator']}>
      <DashboardLayout userRole="operator">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">{t('page.ordersReception')}</h1>
            <p className="text-sm dark:text-slate-400 light:text-gray-600 mt-1">{t('page.ordersReceptionDesc')}</p>
          </div>

          {/* Filters */}
          <div className="card p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 dark:text-slate-400 light:text-gray-400" />
                <input
                  type="text"
                  placeholder={t('orders.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border dark:bg-slate-900 dark:border-slate-700 light:bg-white light:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border dark:bg-slate-900 dark:border-slate-700 light:bg-white light:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">{t('filter.allStatus')}</option>
                <option value="pending">{t('common.pending')}</option>
                <option value="confirmed">{t('common.confirmed')}</option>
                <option value="rejected">{t('common.rejected')}</option>
                <option value="shipped">{t('common.shipped')}</option>
                <option value="at_depot">Dépôt</option>
                <option value="out_for_delivery">En livraison</option>
                <option value="delivered">Livrée</option>
                <option value="returned">Retournée</option>
                <option value="failed_delivery">Échec livraison</option>
              </select>
            </div>
          </div>

          {/* Orders Table */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b dark:border-slate-800 light:border-gray-200">
              <h2 className="font-semibold flex items-center gap-2">
                <ClipboardDocumentListIcon className="h-5 w-5" />
                {t('orders.ordersCount')} ({filteredOrders.length})
              </h2>
            </div>

            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse p-4 rounded-lg dark:bg-slate-800 light:bg-gray-100" />
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardDocumentListIcon className="h-12 w-12 mx-auto mb-2 dark:text-slate-600 light:text-gray-400" />
                <p className="text-sm dark:text-slate-400 light:text-gray-600">{t('orders.noOrders')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="dark:bg-slate-800 light:bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">{t('table.orderId')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">{t('table.customer')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">{t('table.amount')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">{t('table.status')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">{t('table.operator')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">{t('table.date')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-800 light:divide-gray-200">
                    {filteredOrders.map((order) => (
                      <tr key={order._id} className="dark:hover:bg-slate-800/50 light:hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="font-medium text-sm">#{order.confirmedId}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-sm">{order.clientInfo.name}</p>
                            <p className="text-xs dark:text-slate-400 light:text-gray-600">{order.clientInfo.phone}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-green-500">{formatCurrency(order.totalAmount)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            status={order.status}
                            size="sm"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm">{order.assignedOperatorId?.name || t('orders.unassigned')}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm dark:text-slate-400 light:text-gray-600">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
