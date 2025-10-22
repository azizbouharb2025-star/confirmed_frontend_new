'use client'

import { useState, useEffect } from 'react'
import { ShoppingBagIcon, MagnifyingGlassIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import api from '@/lib/api'

interface Order {
  _id: string
  orderId: string
  clientInfo: { name: string; phone: string }
  totalAmount: number
  status: string
  createdAt: string
  shopId: { name: string }
  assignedOperatorId?: { name: string }
}

export default function OrdersManagement() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchOrders = async () => {
    try {
      const response = await api.get('/api/orders?page=1&limit=100')
      setOrders(response.data.orders)
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500/10 text-green-500'
      case 'rejected': return 'bg-red-500/10 text-red-500'
      case 'pending': return 'bg-yellow-500/10 text-yellow-500'
      default: return 'bg-gray-500/10 text-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircleIcon className="h-4 w-4" />
      case 'rejected': return <XCircleIcon className="h-4 w-4" />
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
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout userRole="admin">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">Order Management</h1>
            <p className="text-sm dark:text-slate-400 light:text-gray-600 mt-1">View and manage all orders</p>
          </div>

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
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="p-4 border-b dark:border-slate-800 light:border-gray-200">
              <h2 className="font-semibold flex items-center gap-2">
                <ShoppingBagIcon className="h-5 w-5" />
                Orders ({filteredOrders.length})
              </h2>
            </div>

            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse p-4 rounded-lg dark:bg-slate-800 light:bg-gray-100" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="dark:bg-slate-800 light:bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">Order ID</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Customer</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Shop</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Amount</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Operator</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-800 light:divide-gray-200">
                    {filteredOrders.map((order) => (
                      <tr key={order._id} className="dark:hover:bg-slate-800/50 light:hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-sm">#{order.orderId}</td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-sm">{order.clientInfo.name}</p>
                            <p className="text-xs dark:text-slate-400 light:text-gray-600">{order.clientInfo.phone}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{order.shopId?.name || '-'}</td>
                        <td className="px-4 py-3 font-semibold text-green-500">${order.totalAmount.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">{order.assignedOperatorId?.name || 'Unassigned'}</td>
                        <td className="px-4 py-3 text-sm dark:text-slate-400 light:text-gray-600">
                          {new Date(order.createdAt).toLocaleDateString()}
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
