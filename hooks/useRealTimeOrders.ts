'use client'

import { useState, useEffect, useCallback } from 'react'
import { useWebSocketContext } from '@/components/providers/WebSocketProvider'
import logger from '@/lib/logger'

interface Order {
  _id: string
  orderId: string
  status: string
  clientInfo: {
    name: string
    phone: string
    email?: string
  }
  totalAmount: number
  createdAt: string
  updatedAt: string
}

interface OrderMessage {
  payload: Order | { orderId: string }
}

export const useRealTimeOrders = () => {
  const { socket, isConnected } = useWebSocketContext()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  // Handle real-time order updates
  useEffect(() => {
    if (!socket) return

    const handleOrderUpdate = (message: OrderMessage) => {
      const updatedOrder = message.payload as Order
      setOrders(prev => 
        prev.map(order => 
          order._id === updatedOrder._id ? updatedOrder : order
        )
      )
    }

    const handleNewOrder = (message: OrderMessage) => {
      const newOrder = message.payload as Order
      setOrders(prev => [newOrder, ...prev])
    }

    const handleOrderDelete = (message: OrderMessage) => {
      const { orderId } = message.payload as { orderId: string }
      setOrders(prev => prev.filter(order => order._id !== orderId))
    }

    socket.on('order:update', handleOrderUpdate)
    socket.on('order:new', handleNewOrder)
    socket.on('order:delete', handleOrderDelete)

    return () => {
      socket.off('order:update', handleOrderUpdate)
      socket.off('order:new', handleNewOrder)
      socket.off('order:delete', handleOrderDelete)
    }
  }, [socket])

  // Initial data fetch
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      })
      const data = await response.json()
      setOrders(data.orders || [])
    } catch (error) {
      logger.error('Failed to fetch orders:', error, 'RealTimeOrders')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  return {
    orders,
    loading,
    isConnected,
    refetch: fetchOrders
  }
}