'use client'

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './useAuth'
import logger from '@/lib/logger'
import { Order } from '@/types/order'

interface OrderEvent {
  type: 'order:update' | 'order:new' | 'order:delete'
  payload: Order | { orderId: string }
  timestamp: string
}

interface UseWebSocketReturn {
  socket: Socket | null
  isConnected: boolean
  lastMessage: OrderEvent | null
  requestSync: (since?: string) => void
}

export const useWebSocket = (): UseWebSocketReturn => {
  const { token, isAuthenticated } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<OrderEvent | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
        setSocket(null)
        setIsConnected(false)
      }
      return
    }

    // Don't create a new socket if one already exists
    if (socketRef.current) {
      return
    }

    const newSocket = io(process.env.NEXT_PUBLIC_WS_URL || 'wss://confirmed.tn/ws', {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
    })

    socketRef.current = newSocket

    // Connection events
    newSocket.on('connect', () => {
      logger.info('WebSocket connected', undefined, 'WebSocket')
      setIsConnected(true)
      reconnectAttempts.current = 0
    })

    newSocket.on('disconnect', () => {
      logger.info('WebSocket disconnected', undefined, 'WebSocket')
      setIsConnected(false)
    })

    newSocket.on('connect_error', (error) => {
      logger.error('WebSocket connection error:', error, 'WebSocket')
      reconnectAttempts.current++
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        logger.error('Max reconnection attempts reached', undefined, 'WebSocket')
      }
    })

    // Order events
    newSocket.on('order:update', (message: OrderEvent) => {
      logger.debug('Order updated:', message.payload, 'WebSocket')
      setLastMessage(message)
    })

    newSocket.on('order:new', (message: OrderEvent) => {
      logger.debug('New order:', message.payload, 'WebSocket')
      setLastMessage(message)
    })

    newSocket.on('order:delete', (message: OrderEvent) => {
      logger.debug('Order deleted:', message.payload, 'WebSocket')
      setLastMessage(message)
    })

    // Sync response
    newSocket.on('sync:response', (orders: Order[]) => {
      logger.debug('Synced orders:', orders, 'WebSocket')
    })

    setSocket(newSocket)

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [isAuthenticated, token])

  const requestSync = (since?: string) => {
    if (socket && isConnected) {
      socket.emit('sync:request', { since })
    }
  }

  return {
    socket,
    isConnected,
    lastMessage,
    requestSync,
  }
}