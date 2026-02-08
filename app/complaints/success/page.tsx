'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from '@/hooks/useTheme'
import { useLanguage } from '@/hooks/useLanguage'
import { isValidReferenceNumber } from '@/types/complaint'
import ThemeToggle from '@/components/ui/ThemeToggle'
import LanguageSelector from '@/components/ui/LanguageSelector'
import { CheckCircleIcon, ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline'

export default function ComplaintSuccessPage() {
  const searchParams = useSearchParams()
  const referenceNumber = searchParams.get('ref') || ''
  const { theme } = useTheme()
  const { t } = useLanguage()
  const [copied, setCopied] = useState(false)
  const [isValidRef, setIsValidRef] = useState(false)

  useEffect(() => {
    setIsValidRef(isValidReferenceNumber(referenceNumber))
  }, [referenceNumber])

  const handleCopyReference = async () => {
    try {
      await navigator.clipboard.writeText(referenceNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
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
            theme === 'dark' ? 'bg-[#ADFF2F]' : 'bg-green-400'
          }`}
        />
        <motion.div
          animate={{ x: [0, -80, 0], y: [0, 60, 0], scale: [1, 0.8, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className={`absolute bottom-20 right-20 w-24 h-24 rounded-full blur-xl opacity-20 ${
            theme === 'dark' ? 'bg-emerald-500' : 'bg-teal-400'
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
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          <div className={`backdrop-blur-xl rounded-3xl p-8 shadow-2xl border text-center ${
            theme === 'dark' 
              ? 'bg-white/5 border-white/10' 
              : 'bg-white/80 border-gray-200'
          }`}>
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.2 
              }}
              className="mb-6"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-[#ADFF2F] to-[#32CD32] flex items-center justify-center">
                <CheckCircleIcon className="w-12 h-12 text-black" />
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold mb-2 bg-gradient-to-r from-[#ADFF2F] via-[#32CD32] to-[#00BFFF] bg-clip-text text-transparent"
            >
              {t('complaint.success.title')}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`mb-6 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}
            >
              {t('complaint.success.message')}
            </motion.p>

            {/* Reference Number */}
            {isValidRef && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className={`p-4 rounded-xl mb-6 ${
                  theme === 'dark' ? 'bg-slate-700/50' : 'bg-gray-100'
                }`}
              >
                <p className={`text-sm mb-2 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-gray-600'
                }`}>
                  {t('complaint.success.referenceNumber')}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span className={`text-xl font-mono font-bold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {referenceNumber}
                  </span>
                  <button
                    onClick={handleCopyReference}
                    className={`p-2 rounded-lg transition-colors ${
                      theme === 'dark' 
                        ? 'hover:bg-slate-600' 
                        : 'hover:bg-gray-200'
                    }`}
                    title={t('complaint.success.copy')}
                  >
                    {copied ? (
                      <CheckIcon className="w-5 h-5 text-green-500" />
                    ) : (
                      <ClipboardDocumentIcon className={`w-5 h-5 ${
                        theme === 'dark' ? 'text-slate-400' : 'text-gray-500'
                      }`} />
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Invalid reference warning */}
            {!isValidRef && referenceNumber && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="p-4 rounded-xl mb-6 bg-orange-500/10 border border-orange-500/20"
              >
                <p className="text-sm text-orange-500">
                  {t('complaint.success.invalidReference')}
                </p>
              </motion.div>
            )}

            {/* Info text */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className={`text-sm mb-6 ${
                theme === 'dark' ? 'text-slate-400' : 'text-gray-500'
              }`}
            >
              {t('complaint.success.info')}
            </motion.p>

            {/* Back to home link */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Link
                href="/"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-r from-[#ADFF2F] to-[#32CD32] text-black font-bold hover:from-[#32CD32] hover:to-[#ADFF2F] transition-all duration-300"
              >
                {t('complaint.success.backToHome')}
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
