'use client'

import { useRealTimeOrders } from '@/hooks/useRealTimeOrders'
import { useLanguage } from '@/hooks/useLanguage'
import { motion, AnimatePresence } from 'framer-motion'
import ConnectionStatus from '@/components/ui/ConnectionStatus'

export default function RealTimeOrderList() {
  const { orders, loading, isConnected } = useRealTimeOrders()
  const { t } = useLanguage()

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('dashboard.recentOrders')}
        </h3>
        <ConnectionStatus />
      </div>

      {/* Orders List */}
      <div className="space-y-2">
        <AnimatePresence>
          {orders.map((order) => (
            <motion.div
              key={order._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {order.orderId}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {order.clientInfo.name} • {order.clientInfo.phone}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {order.totalAmount} TND
                  </p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    order.status === 'confirmed' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : order.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      : order.status === 'rejected'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                    {t(`common.${order.status}`)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {orders.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {t('message.noOrdersFound')}
          </div>
        )}
      </div>
    </div>
  )
}