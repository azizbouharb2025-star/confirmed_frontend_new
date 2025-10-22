'use client'

import { useState, useEffect } from 'react'
import { PhoneIcon, UserIcon, ShoppingBagIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import api from '@/lib/api'

interface Order {
  _id: string
  orderId: string
  clientInfo: {
    name: string
    phone: string
    email: string
    address: { city: string; state: string }
  }
  items: Array<{ name: string; quantity: number; price: number }>
  totalAmount: number
  status: string
  priority: string
  createdAt: string
}

export default function CallQueue() {
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [notes, setNotes] = useState('')

  const fetchOrders = async () => {
    try {
      const response = await api.get('/api/orders?page=1&limit=20')
      const pendingOrders = response.data.orders.filter((order: Order) => 
        order.status === 'pending' || order.status === 'assigned'
      )
      setOrders(pendingOrders)
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, status: 'confirmed' | 'rejected') => {
    setProcessing(true)
    try {
      await api.patch(`/api/orders/${orderId}/status`, { status, notes })
      await fetchOrders()
      setSelectedOrder(null)
      setNotes('')
    } catch (error) {
      console.error('Failed to update order:', error)
    } finally {
      setProcessing(false)
    }
  }

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <ProtectedRoute allowedRoles={['operator']}>
      <DashboardLayout userRole="operator">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">Call Queue</h1>
            <p className="text-sm dark:text-slate-400 light:text-gray-600 mt-1">Outgoing calls • {orders.length} pending</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Orders List */}
            <div className="lg:col-span-1">
              <div className="card p-4">
                <h2 className="font-semibold mb-4">Pending Calls ({orders.length})</h2>
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse p-3 rounded-lg dark:bg-slate-800 light:bg-gray-100" />
                    ))}
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8">
                    <PhoneIcon className="h-12 w-12 mx-auto mb-2 dark:text-slate-600 light:text-gray-400" />
                    <p className="text-sm dark:text-slate-400 light:text-gray-600">No pending calls</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {orders.map((order) => (
                      <div
                        key={order._id}
                        onClick={() => setSelectedOrder(order)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedOrder?._id === order._id
                            ? 'bg-blue-500 text-white'
                            : 'dark:bg-slate-800 dark:hover:bg-slate-700 light:bg-gray-50 light:hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">#{order.orderId}</span>
                          <span className="text-xs">{new Date(order.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-sm font-medium">{order.clientInfo.name}</p>
                        <p className="text-xs opacity-75">{order.clientInfo.phone}</p>
                        <p className="text-sm font-semibold mt-1">${order.totalAmount.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Call Interface */}
            <div className="lg:col-span-2">
              <div className="card p-6 min-h-96">
                {!selectedOrder ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <PhoneIcon className="h-16 w-16 mb-4 dark:text-slate-600 light:text-gray-400" />
                    <h3 className="text-xl font-semibold mb-2">Ready to Connect</h3>
                    <p className="text-sm dark:text-slate-400 light:text-gray-600">Select an order from the queue to start calling</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-semibold">{selectedOrder.clientInfo.name}</h2>
                        <p className="text-sm dark:text-slate-400 light:text-gray-600">Order #{selectedOrder.orderId}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="card p-4">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <UserIcon className="h-5 w-5" />
                          Customer Info
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div>
                            <p className="dark:text-slate-400 light:text-gray-600">Phone</p>
                            <p className="font-medium">{selectedOrder.clientInfo.phone}</p>
                          </div>
                          <div>
                            <p className="dark:text-slate-400 light:text-gray-600">Email</p>
                            <p className="font-medium">{selectedOrder.clientInfo.email}</p>
                          </div>
                          <div>
                            <p className="dark:text-slate-400 light:text-gray-600">Location</p>
                            <p className="font-medium">{selectedOrder.clientInfo.address.city}, {selectedOrder.clientInfo.address.state}</p>
                          </div>
                        </div>
                      </div>

                      <div className="card p-4">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <ShoppingBagIcon className="h-5 w-5" />
                          Order Summary
                        </h3>
                        <div className="space-y-2 text-sm">
                          {selectedOrder.items.map((item, i) => (
                            <div key={i} className="flex justify-between">
                              <span>{item.name} x{item.quantity}</span>
                              <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                          <div className="pt-2 border-t dark:border-slate-700 light:border-gray-200 flex justify-between font-semibold">
                            <span>Total</span>
                            <span className="text-green-500">${selectedOrder.totalAmount.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Call Notes</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add notes about the call..."
                        className="w-full p-3 rounded-lg border dark:bg-slate-900 dark:border-slate-700 light:bg-white light:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => updateOrderStatus(selectedOrder._id, 'confirmed')}
                        disabled={processing}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        <CheckCircleIcon className="h-5 w-5" />
                        {processing ? 'Processing...' : 'Confirm'}
                      </button>

                      <button
                        onClick={() => updateOrderStatus(selectedOrder._id, 'rejected')}
                        disabled={processing}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        <XCircleIcon className="h-5 w-5" />
                        {processing ? 'Processing...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
