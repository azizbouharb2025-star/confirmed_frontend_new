'use client'

import { useState, useEffect } from 'react'
import { ClipboardDocumentListIcon, CheckCircleIcon, XCircleIcon, ClockIcon, TruckIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useLanguage } from '@/hooks/useLanguage'
import api from '@/lib/api'
import logger from '@/lib/logger'

interface Order {
  _id: string
  orderId: string
  clientInfo: { name: string; phone: string }
  totalAmount: number
  status: string
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-500 bg-green-500/10'
      case 'rejected': return 'text-red-500 bg-red-500/10'
      case 'pending': return 'text-yellow-500 bg-yellow-500/10'
      case 'shipped': return 'text-blue-500 bg-blue-500/10'
      default: return 'text-gray-500 bg-gray-500/10'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircleIcon className="h-4 w-4" />
      case 'rejected': return <XCircleIcon className="h-4 w-4" />
      case 'pending': return <ClockIcon className="h-4 w-4" />
      case 'shipped': return <TruckIcon className="h-4 w-4" />
      default: return <ClockIcon className="h-4 w-4" />
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
                  placeholder="Search orders..."
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
              </select>
            </div>
          </div>

          {/* Orders Table */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b dark:border-slate-800 light:border-gray-200">
              <h2 className="font-semibold flex items-center gap-2">
                <ClipboardDocumentListIcon className="h-5 w-5" />
                Orders ({filteredOrders.length})
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
                <p className="text-sm dark:text-slate-400 light:text-gray-600">No orders found</p>
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
                          <span className="font-medium text-sm">#{order.orderId}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-sm">{order.clientInfo.name}</p>
                            <p className="text-xs dark:text-slate-400 light:text-gray-600">{order.clientInfo.phone}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-green-500">${order.totalAmount.toFixed(2)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm">{order.assignedOperatorId?.name || 'Unassigned'}</span>
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
