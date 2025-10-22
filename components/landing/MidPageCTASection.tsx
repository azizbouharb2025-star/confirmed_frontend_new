'use client'

import { motion } from 'framer-motion'
import { useLanguage } from '@/hooks/useLanguage'
import { useTheme } from '@/hooks/useTheme'
import Link from 'next/link'
import { CheckCircleIcon, ChartBarIcon, ClockIcon, ShieldCheckIcon, LockClosedIcon, BoltIcon } from '@heroicons/react/24/outline'

export default function MidPageCTASection() {
  const { t } = useLanguage()
  const { theme } = useTheme()

  return (
    <section className={`py-20 relative overflow-hidden ${
      theme === 'dark' ? 'bg-[#1E1E1E]' : 'bg-[#F8F9FA]'
    }`}>
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 1200 600" fill="none">
          <path 
            d="M0,300 Q300,100 600,300 T1200,300 L1200,600 L0,600 Z" 
            fill="currentColor"
            className="text-[#ADFF2F]"
          />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center space-y-8"
        >
          <div className="space-y-6">
            <h2 className={`text-4xl lg:text-5xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-[#1A1A1A]'
            }`}>
              {t('midCta.title')}
            </h2>
            <p className={`text-xl max-w-3xl mx-auto ${
              theme === 'dark' ? 'text-[#E0E0E0]' : 'text-[#6C757D]'
            }`}>
              {t('midCta.description')}
            </p>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12"
          >
            {[
              { number: '95%', label: t('midCta.stat1'), icon: '✅' },
              { number: '2x', label: t('midCta.stat2'), icon: '📈' },
              { number: '24/7', label: t('midCta.stat3'), icon: '🕒' }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                className={`p-6 rounded-3xl ${
                  theme === 'dark' 
                    ? 'bg-[#2A2A2A] border border-[#333333]' 
                    : 'bg-white border border-[#E0E0E0]'
                } shadow-lg`}
              >
                {index === 0 && <CheckCircleIcon className={`w-8 h-8 mb-3 ${
                  theme === 'dark' ? 'text-[#ADFF2F]' : 'text-[#32CD32]'
                }`} />}
                {index === 1 && <ChartBarIcon className={`w-8 h-8 mb-3 ${
                  theme === 'dark' ? 'text-[#ADFF2F]' : 'text-[#32CD32]'
                }`} />}
                {index === 2 && <ClockIcon className={`w-8 h-8 mb-3 ${
                  theme === 'dark' ? 'text-[#ADFF2F]' : 'text-[#32CD32]'
                }`} />}
                <div className="text-3xl font-bold bg-gradient-to-r from-[#ADFF2F] to-[#32CD32] bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className={`text-sm ${
                  theme === 'dark' ? 'text-[#E0E0E0]' : 'text-[#6C757D]'
                }`}>
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link 
              href="/panel/register"
              className="px-8 py-4 bg-[#ADFF2F] text-black font-semibold rounded-full hover:bg-[#98E02C] transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              {t('midCta.primary')}
            </Link>
            
            <Link 
              href="#demo"
              className={`px-8 py-4 font-semibold rounded-full border-2 transition-all duration-300 transform hover:scale-105 ${
                theme === 'dark'
                  ? 'border-white text-white hover:bg-white hover:text-black'
                  : 'border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white'
              }`}
            >
              {t('midCta.secondary')}
            </Link>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center items-center gap-8 pt-8"
          >
            <div className={`flex items-center space-x-2 ${
              theme === 'dark' ? 'text-[#E0E0E0]' : 'text-[#6C757D]'
            }`}>
              <ShieldCheckIcon className={`w-5 h-5 ${
                theme === 'dark' ? 'text-green-400' : 'text-green-600'
              }`} />
              <span className="text-sm font-medium">{t('midCta.trust1')}</span>
            </div>
            <div className={`flex items-center space-x-2 ${
              theme === 'dark' ? 'text-[#E0E0E0]' : 'text-[#6C757D]'
            }`}>
              <LockClosedIcon className={`w-5 h-5 ${
                theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
              }`} />
              <span className="text-sm font-medium">{t('midCta.trust2')}</span>
            </div>
            <div className={`flex items-center space-x-2 ${
              theme === 'dark' ? 'text-[#E0E0E0]' : 'text-[#6C757D]'
            }`}>
              <BoltIcon className={`w-5 h-5 ${
                theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
              }`} />
              <span className="text-sm font-medium">{t('midCta.trust3')}</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}