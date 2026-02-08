'use client'

import { useEffect, useState } from 'react'
import { useWebSocketContext } from '@/components/providers/WebSocketProvider'
import { useLanguage } from '@/hooks/useLanguage'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline'

interface OrderPayload {
  orderId: string
  [key: string]: unknown
}

interface OrderMessage {
  payload: OrderPayload
}

interface Notification {
  id: string
  type: 'order:update' | 'order:new' | 'order:delete'
  message: string
  timestamp: Date
}

export default function RealTimeNotifications() {
  const { socket } = useWebSocketContext()
  const { t } = useLanguage()
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    if (!socket) return

    const handleOrderUpdate = (message: OrderMessage) => {
      const notification: Notification = {
        id: Date.now().toString(),
        type: 'order:update',
        message: `${t('websocket.orderUpdate')}: ${message.payload.orderId}`,
        timestamp: new Date()
      }
      addNotification(notification)
    }

    const handleNewOrder = (message: OrderMessage) => {
      const notification: Notification = {
        id: Date.now().toString(),
        type: 'order:new',
        message: `${t('websocket.newOrder')}: ${message.payload.orderId}`,
        timestamp: new Date()
      }
      addNotification(notification)
    }

    const handleOrderDelete = (message: OrderMessage) => {
      const notification: Notification = {
        id: Date.now().toString(),
        type: 'order:delete',
        message: `${t('websocket.orderDeleted')}: ${message.payload.orderId}`,
        timestamp: new Date()
      }
      addNotification(notification)
    }

    socket.on('order:update', handleOrderUpdate)
    socket.on('order:new', handleNewOrder)
    socket.on('order:delete', handleOrderDelete)

    return () => {
      socket.off('order:update', handleOrderUpdate)
      socket.off('order:new', handleNewOrder)
      socket.off('order:delete', handleOrderDelete)
    }
  }, [socket, t])

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 4)]) // Keep only 5 notifications
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id))
    }, 5000)
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'order:new':
        return <InformationCircleIcon className="w-5 h-5 text-blue-500" />
      case 'order:update':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />
      case 'order:delete':
        return <XCircleIcon className="w-5 h-5 text-red-500" />
      default:
        return <InformationCircleIcon className="w-5 h-5 text-gray-500" />
    }
  }

  const getBgColor = (type: string) => {
    switch (type) {
      case 'order:new':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
      case 'order:update':
        return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
      case 'order:delete':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
      default:
        return 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            className={`p-4 rounded-lg border shadow-lg backdrop-blur-sm ${getBgColor(notification.type)}`}
          >
            <div className="flex items-start gap-3">
              {getIcon(notification.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {notification.message}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {notification.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}