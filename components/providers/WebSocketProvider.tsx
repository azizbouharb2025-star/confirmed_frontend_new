'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useWebSocket } from '@/hooks/useWebSocket'
import { Socket } from 'socket.io-client'

interface WebSocketContextType {
  socket: Socket | null
  isConnected: boolean
  requestSync: (since?: string) => void
}

const WebSocketContext = createContext<WebSocketContextType | null>(null)

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocketContext must be used within WebSocketProvider')
  }
  return context
}

interface WebSocketProviderProps {
  children: ReactNode
}

export const WebSocketProvider = ({ children }: WebSocketProviderProps) => {
  const { socket, isConnected, requestSync } = useWebSocket()

  return (
    <WebSocketContext.Provider value={{ socket, isConnected, requestSync }}>
      {children}
    </WebSocketContext.Provider>
  )
}