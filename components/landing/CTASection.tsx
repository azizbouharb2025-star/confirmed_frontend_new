'use client'

import { motion } from 'framer-motion'
import { useLanguage } from '@/hooks/useLanguage'
import { useTheme } from '@/hooks/useTheme'
import Link from 'next/link'
import { CheckCircleIcon, RocketLaunchIcon, CreditCardIcon } from '@heroicons/react/24/outline'

export default function CTASection() {
  const { t } = useLanguage()
  const { theme } = useTheme()

  return (
    <section className={`py-20 ${
      theme === 'dark' ? 'bg-[#121212]' : 'bg-[#ADFF2F]'
    }`}>
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center space-y-8"
        >
          <h2 className={`text-4xl lg:text-5xl font-bold ${
            theme === 'dark' ? 'text-white' : 'text-black'
          }`}>
            {t('cta.title')}
          </h2>
          
          <p className={`text-xl max-w-3xl mx-auto ${
            theme === 'dark' ? 'text-[#E0E0E0]' : 'text-black/80'
          }`}>
            {t('cta.description')}
          </p>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link 
              href="/panel/register"
              className={`px-8 py-4 font-semibold rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                theme === 'dark'
                  ? 'bg-[#ADFF2F] text-black hover:bg-[#98E02C]'
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              {t('cta.primary')}
            </Link>
            
            <Link 
              href="/panel/login"
              className={`px-8 py-4 font-semibold rounded-full border-2 transition-all duration-300 transform hover:scale-105 ${
                theme === 'dark'
                  ? 'border-white text-white hover:bg-white hover:text-black'
                  : 'border-black text-black hover:bg-black hover:text-white'
              }`}
            >
              {t('cta.secondary')}
            </Link>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center items-center gap-8 pt-8"
          >
            <div className={`flex items-center space-x-2 ${
              theme === 'dark' ? 'text-[#E0E0E0]' : 'text-black/70'
            }`}>
              <CheckCircleIcon className={`w-6 h-6 ${
                theme === 'dark' ? 'text-green-400' : 'text-green-600'
              }`} />
              <span className="font-medium">{t('cta.feature1')}</span>
            </div>
            <div className={`flex items-center space-x-2 ${
              theme === 'dark' ? 'text-[#E0E0E0]' : 'text-black/70'
            }`}>
              <RocketLaunchIcon className={`w-6 h-6 ${
                theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
              }`} />
              <span className="font-medium">{t('cta.feature2')}</span>
            </div>
            <div className={`flex items-center space-x-2 ${
              theme === 'dark' ? 'text-[#E0E0E0]' : 'text-black/70'
            }`}>
              <CreditCardIcon className={`w-6 h-6 ${
                theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
              }`} />
              <span className="font-medium">{t('cta.feature3')}</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}