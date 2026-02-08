'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useTheme } from '@/hooks/useTheme'
import { ChatBubbleLeftRightIcon, XMarkIcon, QuestionMarkCircleIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline'

export default function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false)
  const { theme } = useTheme()

  const actions = [
    {
      icon: ChatBubbleLeftRightIcon,
      label: 'Live Chat',
      color: 'from-blue-500 to-blue-600',
      onClick: () => { /* TODO: Implement live chat */ }
    },
    {
      icon: PhoneIcon,
      label: 'Call Us',
      color: 'from-green-500 to-green-600',
      onClick: () => { /* TODO: Implement call action */ }
    },
    {
      icon: EnvelopeIcon,
      label: 'Email',
      color: 'from-purple-500 to-purple-600',
      onClick: () => { /* TODO: Implement email action */ }
    },
    {
      icon: QuestionMarkCircleIcon,
      label: 'Help',
      color: 'from-orange-500 to-orange-600',
      onClick: () => { /* TODO: Implement help action */ }
    }
  ]

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-20 right-0 space-y-3"
          >
            {actions.map((action, index) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, x: 20, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.8 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.1, x: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={action.onClick}
                className={`group flex items-center space-x-3 px-4 py-3 rounded-full backdrop-blur-xl border shadow-lg transition-all duration-300 ${
                  theme === 'dark'
                    ? 'bg-[#1a1a1a]/90 border-white/20 text-white hover:border-[#ADFF2F]/50'
                    : 'bg-white/90 border-gray-200/50 text-gray-800 hover:border-green-300/50'
                }`}
              >
                <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 ${
                  theme === 'dark' 
                    ? 'border-white/20 group-hover:border-[#ADFF2F]/50' 
                    : 'border-gray-300 group-hover:border-green-500/50'
                }`}>
                  <action.icon className={`w-5 h-5 transition-colors duration-300 ${
                    theme === 'dark' 
                      ? 'text-white group-hover:text-[#ADFF2F]' 
                      : 'text-gray-700 group-hover:text-green-600'
                  }`} />
                </div>
                <span className="font-medium whitespace-nowrap">{action.label}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-full bg-gradient-to-r from-[#ADFF2F] to-[#32CD32] flex items-center justify-center shadow-2xl hover:shadow-3xl transition-all duration-300 ${
          isOpen ? 'rotate-45' : 'rotate-0'
        }`}
        animate={{ rotate: isOpen ? 45 : 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ opacity: 0, rotate: -45 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 45 }}
            >
              <XMarkIcon className="w-8 h-8 text-black" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0, rotate: 45 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: -45 }}
            >
              <ChatBubbleLeftRightIcon className="w-8 h-8 text-black" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#ADFF2F] to-[#32CD32] animate-ping opacity-20" />
    </div>
  )
}