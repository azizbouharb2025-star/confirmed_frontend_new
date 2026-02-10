'use client'

import { useState, useEffect, useMemo } from 'react'
import { PhoneIcon, UserIcon, ShoppingBagIcon, CheckCircleIcon, XCircleIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useLanguage } from '@/hooks/useLanguage'
import api from '@/lib/api'
import logger from '@/lib/logger'
import type { Order, CallFeedback, CallHistoryEntry } from '@/types/order'
import {
  sortQueueOrders,
  getPriorityColor,
  getAIScoreColor,
  createDefaultFeedback,
} from './queueUtils'

export default function CallQueue() {
  const { t } = useLanguage()
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectionModal, setShowRejectionModal] = useState(false)
  const [rejectionError, setRejectionError] = useState('')

  // Call feedback state
  const [feedback, setFeedback] = useState<CallFeedback>(createDefaultFeedback())

  // Sort orders by priority then AI score
  const sortedOrders = useMemo(() => sortQueueOrders(orders), [orders])

  const fetchOrders = async () => {
    try {
      const response = await api.get('/api/orders?page=1&limit=50')
      const pendingOrders = (response.data.orders || []).filter((order: Order) => 
        order.status === 'pending' || order.status === 'assigned'
      )
      setOrders(pendingOrders)
    } catch (error) {
      logger.error('Failed to fetch orders:', error, 'Queue')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Confirm an order with feedback
   * Requirements: 5.3
   */
  const confirmOrder = async () => {
    if (!selectedOrder) return
    
    setProcessing(true)
    try {
      const callEntry: Partial<CallHistoryEntry> = {
        callType: 'human',
        result: 'confirmed',
        notes: feedback.notes,
        feedback: feedback,
        timestamp: new Date().toISOString(),
      }
      
      await api.patch(`/api/orders/${selectedOrder._id}/status`, { 
        status: 'confirmed',
        notes: feedback.notes,
        callHistory: callEntry,
        feedback: feedback,
      })
      
      await fetchOrders()
      resetState()
    } catch (error) {
      logger.error('Failed to confirm order:', error, 'Queue')
    } finally {
      setProcessing(false)
    }
  }

  /**
   * Reject an order with required reason
   * Requirements: 5.4
   */
  const rejectOrder = async () => {
    if (!selectedOrder) return
    
    // Validate rejection reason is provided
    if (!rejectionReason.trim()) {
      setRejectionError(t('queue.rejectionRequired'))
      return
    }
    
    setProcessing(true)
    setRejectionError('')
    
    try {
      const callEntry: Partial<CallHistoryEntry> = {
        callType: 'human',
        result: 'rejected',
        notes: rejectionReason,
        feedback: feedback,
        timestamp: new Date().toISOString(),
      }
      
      await api.patch(`/api/orders/${selectedOrder._id}/status`, { 
        status: 'rejected',
        notes: rejectionReason,
        callHistory: callEntry,
        feedback: feedback,
      })
      
      await fetchOrders()
      resetState()
      setShowRejectionModal(false)
    } catch (error) {
      logger.error('Failed to reject order:', error, 'Queue')
    } finally {
      setProcessing(false)
    }
  }

  const resetState = () => {
    setSelectedOrder(null)
    setRejectionReason('')
    setRejectionError('')
    setFeedback(createDefaultFeedback())
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
            <h1 className="text-2xl font-semibold">{t('page.callQueue')}</h1>
            <p className="text-sm dark:text-slate-400 light:text-gray-600 mt-1">
              {t('page.callQueueDesc')} • {sortedOrders.length} {t('common.pending')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Orders List - Sorted by priority then AI score */}
            <div className="lg:col-span-1">
              <div className="card p-4">
                <h2 className="font-semibold mb-4">{t('common.pending')} ({sortedOrders.length})</h2>
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse p-3 rounded-lg dark:bg-slate-800 light:bg-gray-100 h-24" />
                    ))}
                  </div>
                ) : sortedOrders.length === 0 ? (
                  /* Empty queue state - Requirements: 5.6 */
                  <div className="text-center py-8">
                    <CheckCircleIcon className="h-12 w-12 mx-auto mb-2 text-green-500" />
                    <p className="text-lg font-medium mb-1">{t('queue.queueEmpty')}</p>
                    <p className="text-sm dark:text-slate-400 light:text-gray-600">
                      {t('queue.noPendingOrders')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                    {sortedOrders.map((order) => (
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
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(order.priority)}`}>
                              {order.priority}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm font-medium">{order.clientInfo.name}</p>
                        <p className="text-xs opacity-75">{order.clientInfo.phone}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-semibold">${order.totalAmount.toFixed(2)}</span>
                          {order.aiRiskScore !== undefined && (
                            <span className={`text-xs font-medium ${
                              selectedOrder?._id === order._id ? 'text-white' : getAIScoreColor(order.aiRiskScore)
                            }`}>
                              AI: {order.aiRiskScore}%
                            </span>
                          )}
                        </div>
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
                    <h3 className="text-xl font-semibold mb-2">{t('message.readyToConnect')}</h3>
                    <p className="text-sm dark:text-slate-400 light:text-gray-600">{t('message.selectOrder')}</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Order Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-semibold">{selectedOrder.clientInfo.name}</h2>
                        <p className="text-sm dark:text-slate-400 light:text-gray-600">
                          Order #{selectedOrder.orderId}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm ${getPriorityColor(selectedOrder.priority)}`}>
                          {selectedOrder.priority}
                        </span>
                        {selectedOrder.aiRiskScore !== undefined && (
                          <span className={`px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-slate-700 ${getAIScoreColor(selectedOrder.aiRiskScore)}`}>
                            AI: {selectedOrder.aiRiskScore}%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Customer and Order Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="card p-4">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <UserIcon className="h-5 w-5" />
                          {t('info.customerInfo')}
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div>
                            <p className="dark:text-slate-400 light:text-gray-600">{t('info.phone')}</p>
                            <p className="font-medium">{selectedOrder.clientInfo.phone}</p>
                          </div>
                          {selectedOrder.clientInfo.email && (
                            <div>
                              <p className="dark:text-slate-400 light:text-gray-600">{t('info.email')}</p>
                              <p className="font-medium">{selectedOrder.clientInfo.email}</p>
                            </div>
                          )}
                          {selectedOrder.clientInfo.address && (
                            <div>
                              <p className="dark:text-slate-400 light:text-gray-600">{t('info.location')}</p>
                              <p className="font-medium">
                                {selectedOrder.clientInfo.address.city}, {selectedOrder.clientInfo.address.state}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="card p-4">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <ShoppingBagIcon className="h-5 w-5" />
                          {t('info.orderSummary')}
                        </h3>
                        <div className="space-y-2 text-sm">
                          {selectedOrder.items.map((item, i) => (
                            <div key={i} className="flex justify-between">
                              <span>{item.name} x{item.quantity}</span>
                              <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                          <div className="pt-2 border-t dark:border-slate-700 light:border-gray-200 flex justify-between font-semibold">
                            <span>{t('info.total')}</span>
                            <span className="text-green-500">${selectedOrder.totalAmount.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>


                    {/* Call Feedback Form - Requirements: 5.5 */}
                    <div className="card p-4">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <ClockIcon className="h-5 w-5" />
                        {t('queue.callFeedback')}
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Customer Tone */}
                        <div>
                          <label className="block text-sm font-medium mb-1">{t('queue.customerTone')}</label>
                          <select
                            value={feedback.customerTone}
                            onChange={(e) => setFeedback({ ...feedback, customerTone: e.target.value as CallFeedback['customerTone'] })}
                            className="w-full p-2 rounded-lg border dark:bg-slate-900 dark:border-slate-700 light:bg-white light:border-gray-300"
                          >
                            <option value="positive">{t('queue.tonePositive')}</option>
                            <option value="neutral">{t('queue.toneNeutral')}</option>
                            <option value="negative">{t('queue.toneNegative')}</option>
                          </select>
                        </div>

                        {/* Price Sensitivity */}
                        <div>
                          <label className="block text-sm font-medium mb-1">{t('queue.priceSensitivity')}</label>
                          <select
                            value={feedback.priceSensitivity}
                            onChange={(e) => setFeedback({ ...feedback, priceSensitivity: e.target.value as CallFeedback['priceSensitivity'] })}
                            className="w-full p-2 rounded-lg border dark:bg-slate-900 dark:border-slate-700 light:bg-white light:border-gray-300"
                          >
                            <option value="low">{t('queue.sensitivityLow')}</option>
                            <option value="medium">{t('queue.sensitivityMedium')}</option>
                            <option value="high">{t('queue.sensitivityHigh')}</option>
                          </select>
                        </div>

                        {/* Confirmation Strength */}
                        <div>
                          <label className="block text-sm font-medium mb-1">{t('queue.confirmationStrength')}</label>
                          <select
                            value={feedback.confirmationStrength}
                            onChange={(e) => setFeedback({ ...feedback, confirmationStrength: e.target.value as CallFeedback['confirmationStrength'] })}
                            className="w-full p-2 rounded-lg border dark:bg-slate-900 dark:border-slate-700 light:bg-white light:border-gray-300"
                          >
                            <option value="strong">{t('queue.strengthStrong')}</option>
                            <option value="moderate">{t('queue.strengthModerate')}</option>
                            <option value="weak">{t('queue.strengthWeak')}</option>
                          </select>
                        </div>
                      </div>

                      {/* Checkboxes */}
                      <div className="flex flex-wrap gap-4 mt-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={feedback.qualityConcerns}
                            onChange={(e) => setFeedback({ ...feedback, qualityConcerns: e.target.checked })}
                            className="rounded"
                          />
                          <span className="text-sm">{t('queue.qualityConcerns')}</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={feedback.deliveryIssues}
                            onChange={(e) => setFeedback({ ...feedback, deliveryIssues: e.target.checked })}
                            className="rounded"
                          />
                          <span className="text-sm">{t('queue.deliveryIssues')}</span>
                        </label>
                      </div>

                      {/* Notes */}
                      <div className="mt-4">
                        <label className="block text-sm font-medium mb-2">{t('info.callNotes')}</label>
                        <textarea
                          value={feedback.notes}
                          onChange={(e) => setFeedback({ ...feedback, notes: e.target.value })}
                          placeholder={t('info.addNotes')}
                          className="w-full p-3 rounded-lg border dark:bg-slate-900 dark:border-slate-700 light:bg-white light:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={2}
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={confirmOrder}
                        disabled={processing}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        <CheckCircleIcon className="h-5 w-5" />
                        {processing ? t('action.processing') : t('action.confirm')}
                      </button>

                      <button
                        onClick={() => setShowRejectionModal(true)}
                        disabled={processing}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        <XCircleIcon className="h-5 w-5" />
                        {t('action.reject')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Rejection Modal - Requirements: 5.4 */}
        {showRejectionModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="card p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
                {t('queue.rejectOrder')}
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  {t('queue.rejectionReason')} <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => {
                    setRejectionReason(e.target.value)
                    setRejectionError('')
                  }}
                  placeholder={t('queue.rejectionReasonPlaceholder')}
                  className={`w-full p-3 rounded-lg border dark:bg-slate-900 light:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    rejectionError 
                      ? 'border-red-500' 
                      : 'dark:border-slate-700 light:border-gray-300'
                  }`}
                  rows={3}
                />
                {rejectionError && (
                  <p className="text-red-500 text-sm mt-1">{rejectionError}</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRejectionModal(false)
                    setRejectionReason('')
                    setRejectionError('')
                  }}
                  className="flex-1 px-4 py-2 border dark:border-slate-700 light:border-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {t('queue.cancel')}
                </button>
                <button
                  onClick={rejectOrder}
                  disabled={processing}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {processing ? t('queue.processing') : t('queue.confirmReject')}
                </button>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}
