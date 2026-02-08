'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useParams } from 'next/navigation'
import { useTheme } from '@/hooks/useTheme'
import { useLanguage } from '@/hooks/useLanguage'
import { complaintService } from '@/services/complaintService'
import type { OrderData } from '@/types/complaint'
import ComplaintForm from '@/components/complaints/ComplaintForm'
import ThemeToggle from '@/components/ui/ThemeToggle'
import LanguageSelector from '@/components/ui/LanguageSelector'
import Link from 'next/link'
import Image from 'next/image'

type TokenErrorType = 'TOKEN_EXPIRED' | 'TOKEN_INVALID' | 'TOKEN_USED' | 'NETWORK_ERROR' | null

interface TokenState {
  isLoading: boolean
  isValid: boolean
  error: TokenErrorType
  order: OrderData | null
  shopId: string | null
}

export default function ComplaintFormPage() {
  const params = useParams()
  const token = params.token as string
  const { theme } = useTheme()
  const { t } = useLanguage()
  
  const [tokenState, setTokenState] = useState<TokenState>({
    isLoading: true,
    isValid: false,
    error: null,
    order: null,
    shopId: null
  })

  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setTokenState({
          isLoading: false,
          isValid: false,
          error: 'TOKEN_INVALID',
          order: null,
          shopId: null
        })
        return
      }

      try {
        const response = await complaintService.validateToken(token)
        setTokenState({
          isLoading: false,
          isValid: response.valid,
          error: null,
          order: response.order,
          shopId: response.shopId
        })
      } catch (error) {
        const err = error as { status?: number; code?: string }
        let errorType: TokenErrorType = 'NETWORK_ERROR'
        
        if (err.status === 410 || err.code === 'TOKEN_EXPIRED') {
          errorType = 'TOKEN_EXPIRED'
        } else if (err.status === 404 || err.code === 'TOKEN_INVALID') {
          errorType = 'TOKEN_INVALID'
        } else if (err.status === 400 || err.code === 'TOKEN_USED') {
          errorType = 'TOKEN_USED'
        }
        
        setTokenState({
          isLoading: false,
          isValid: false,
          error: errorType,
          order: null,
          shopId: null
        })
      }
    }

    validateToken()
  }, [token])

  const renderErrorState = () => {
    const errorConfig = {
      TOKEN_EXPIRED: {
        title: t('complaint.error.expired.title'),
        message: t('complaint.error.expired.message'),
        icon: '⏰'
      },
      TOKEN_INVALID: {
        title: t('complaint.error.invalid.title'),
        message: t('complaint.error.invalid.message'),
        icon: '❌'
      },
      TOKEN_USED: {
        title: t('complaint.error.used.title'),
        message: t('complaint.error.used.message'),
        icon: '✅'
      },
      NETWORK_ERROR: {
        title: t('complaint.error.network.title'),
        message: t('complaint.error.network.message'),
        icon: '🌐'
      }
    }

    const config = errorConfig[tokenState.error!]

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`text-center p-8 rounded-2xl ${
          theme === 'dark' ? 'bg-slate-800/50' : 'bg-white/80'
        } backdrop-blur-xl shadow-xl`}
      >
        <div className="text-6xl mb-4">{config.icon}</div>
        <h2 className={`text-2xl font-bold mb-2 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          {config.title}
        </h2>
        <p className={`mb-6 ${
          theme === 'dark' ? 'text-slate-400' : 'text-gray-600'
        }`}>
          {config.message}
        </p>
        {tokenState.error === 'TOKEN_EXPIRED' && (
          <div className={`p-4 rounded-xl ${
            theme === 'dark' ? 'bg-slate-700/50' : 'bg-gray-100'
          }`}>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-slate-300' : 'text-gray-700'
            }`}>
              {t('complaint.error.contactSeller')}
            </p>
          </div>
        )}
      </motion.div>
    )
  }

  const renderLoadingState = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center p-8"
    >
      <div className="w-12 h-12 border-4 border-[#ADFF2F]/30 border-t-[#ADFF2F] rounded-full animate-spin mb-4" />
      <p className={theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}>
        {t('complaint.validating')}
      </p>
    </motion.div>
  )

  const renderOrderContext = () => {
    if (!tokenState.order) return null

    const { orderId, createdAt, items, clientInfo, shop } = tokenState.order

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mb-6 p-4 rounded-xl ${
          theme === 'dark' ? 'bg-slate-700/50' : 'bg-gray-100'
        }`}
      >
        <h3 className={`text-sm font-medium mb-2 ${
          theme === 'dark' ? 'text-slate-300' : 'text-gray-700'
        }`}>
          {t('complaint.orderContext')}
        </h3>
        <div className="space-y-1">
          <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
            <span className="font-medium">{t('complaint.orderId')}:</span> {orderId}
          </p>
          <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
            <span className="font-medium">{t('complaint.orderDate')}:</span> {new Date(createdAt).toLocaleDateString()}
          </p>
          <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
            <span className="font-medium">{t('complaint.customer')}:</span> {clientInfo.name}
          </p>
          <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
            <span className="font-medium">{t('complaint.shop')}:</span> {shop.name}
          </p>
          <div className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
            <span className="font-medium">{t('complaint.items')}:</span>
            <ul className="ml-4 mt-1">
              {items.map((item, index) => (
                <li key={index}>• {item.productId?.name || 'Product'} (x{item.quantity})</li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className={`min-h-screen p-4 relative overflow-hidden ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-[#0a0a0a] via-[#121212] to-[#1a1a1a]' 
        : 'bg-gradient-to-br from-white via-gray-50 to-blue-50'
    }`}>
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 100, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute top-20 left-20 w-32 h-32 rounded-full blur-xl opacity-30 ${
            theme === 'dark' ? 'bg-[#ADFF2F]' : 'bg-blue-400'
          }`}
        />
        <motion.div
          animate={{ x: [0, -80, 0], y: [0, 60, 0], scale: [1, 0.8, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className={`absolute bottom-20 right-20 w-24 h-24 rounded-full blur-xl opacity-20 ${
            theme === 'dark' ? 'bg-purple-500' : 'bg-pink-400'
          }`}
        />
      </div>

      {/* Header */}
      <div className="fixed top-6 left-6 z-50">
        <Link href="/">
          <Image 
            src={theme === 'dark' ? '/assets/logo2.png' : '/assets/logo1.png'}
            alt="Logo"
            width={120}
            height={80}
            className="object-contain"
          />
        </Link>
      </div>
      
      <div className="fixed top-6 right-6 flex items-center gap-3 z-50">
        <LanguageSelector />
        <ThemeToggle />
      </div>

      {/* Main content */}
      <div className="flex items-center justify-center min-h-screen pt-20 pb-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg relative z-10"
        >
          <div className={`backdrop-blur-xl rounded-3xl p-8 shadow-2xl border ${
            theme === 'dark' 
              ? 'bg-white/5 border-white/10' 
              : 'bg-white/80 border-gray-200'
          }`}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-center mb-6"
            >
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-[#ADFF2F] via-[#32CD32] to-[#00BFFF] bg-clip-text text-transparent">
                {t('complaint.form.title')}
              </h1>
              <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                {t('complaint.form.subtitle')}
              </p>
            </motion.div>

            {tokenState.isLoading && renderLoadingState()}
            
            {!tokenState.isLoading && tokenState.error && renderErrorState()}
            
            {!tokenState.isLoading && tokenState.isValid && (
              <>
                {renderOrderContext()}
                <ComplaintForm token={token} />
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
