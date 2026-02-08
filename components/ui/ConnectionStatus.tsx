'use client'

import { useWebSocketContext } from '@/components/providers/WebSocketProvider'
import { useLanguage } from '@/hooks/useLanguage'
import { motion } from 'framer-motion'

export default function ConnectionStatus() {
  const { isConnected } = useWebSocketContext()
  const { t } = useLanguage()

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 text-sm"
    >
      <div className={`w-2 h-2 rounded-full ${
        isConnected 
          ? 'bg-green-500 animate-pulse' 
          : 'bg-red-500'
      }`} />
      <span className={`${
        isConnected 
          ? 'text-green-600 dark:text-green-400' 
          : 'text-red-600 dark:text-red-400'
      }`}>
        {isConnected ? t('websocket.connected') : t('websocket.disconnected')}
      </span>
    </motion.div>
  )
}