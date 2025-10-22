'use client'

import { motion } from 'framer-motion'
import { useLanguage } from '@/hooks/useLanguage'
import { useTheme } from '@/hooks/useTheme'
import { BoltIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import { TargetIcon } from 'lucide-react'

export default function ProductSection() {
  const { t } = useLanguage()
  const { theme } = useTheme()

  return (
    <section className={`py-20 ${
      theme === 'dark' ? 'bg-[#121212]' : 'bg-white'
    }`}>
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center space-y-16"
        >
          <div className="space-y-6">
            <h2 className={`text-4xl lg:text-5xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-[#1A1A1A]'
            }`}>
              {t('product.title')}
            </h2>
            <p className={`text-xl max-w-3xl mx-auto ${
              theme === 'dark' ? 'text-[#E0E0E0]' : 'text-[#6C757D]'
            }`}>
              {t('product.description')}
            </p>
          </div>

          {/* MacBook Mockup */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="relative max-w-4xl mx-auto"
          >
            <div className={`relative rounded-3xl shadow-2xl overflow-hidden ${
              theme === 'dark' ? 'bg-[#2A2A2A]' : 'bg-[#E0E0E0]'
            }`}>
              {/* MacBook frame */}
              <div className="p-4">
                <div className={`rounded-2xl overflow-hidden ${
                  theme === 'dark' ? 'bg-[#1A1A1A]' : 'bg-white'
                }`}>
                  {/* Browser bar */}
                  <div className={`flex items-center px-4 py-3 border-b ${
                    theme === 'dark' ? 'bg-[#2A2A2A] border-[#333333]' : 'bg-[#F8F9FA] border-[#E0E0E0]'
                  }`}>
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <div className={`flex-1 mx-4 px-3 py-1 rounded-lg text-sm ${
                      theme === 'dark' ? 'bg-[#1A1A1A] text-[#E0E0E0]' : 'bg-white text-[#6C757D]'
                    }`}>
                      confirmed.app/dashboard
                    </div>
                  </div>

                  {/* Dashboard content */}
                  <div className="p-6 space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <h3 className={`text-2xl font-bold ${
                        theme === 'dark' ? 'text-white' : 'text-[#1A1A1A]'
                      }`}>
                        Dashboard
                      </h3>
                      <div className="flex space-x-2">
                        <div className="w-8 h-8 bg-[#ADFF2F] rounded-full" />
                        <div className={`w-8 h-8 rounded-full ${
                          theme === 'dark' ? 'bg-[#333333]' : 'bg-[#E0E0E0]'
                        }`} />
                      </div>
                    </div>

                    {/* Metrics cards */}
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: 'Orders', value: '1,250', color: 'bg-blue-500' },
                        { label: 'Confirmed', value: '1,031', color: 'bg-[#ADFF2F]' },
                        { label: 'Rate', value: '82.5%', color: 'bg-purple-500' }
                      ].map((metric, index) => (
                        <div key={index} className={`p-4 rounded-2xl ${
                          theme === 'dark' ? 'bg-[#2A2A2A]' : 'bg-[#F8F9FA]'
                        }`}>
                          <div className={`w-3 h-3 rounded-full ${metric.color} mb-2`} />
                          <div className={`text-2xl font-bold ${
                            theme === 'dark' ? 'text-white' : 'text-[#1A1A1A]'
                          }`}>
                            {metric.value}
                          </div>
                          <div className={`text-sm ${
                            theme === 'dark' ? 'text-[#E0E0E0]' : 'text-[#6C757D]'
                          }`}>
                            {metric.label}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Chart placeholder */}
                    <div className={`h-32 rounded-2xl ${
                      theme === 'dark' ? 'bg-[#2A2A2A]' : 'bg-[#F8F9FA]'
                    } flex items-center justify-center`}>
                      <div className="flex space-x-1">
                        {[...Array(8)].map((_, i) => (
                          <div 
                            key={i}
                            className="w-4 bg-[#ADFF2F] rounded-t"
                            style={{ height: `${Math.random() * 60 + 20}px` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Key points */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {[
              { icon: BoltIcon, title: t('product.feature1.title'), desc: t('product.feature1.desc') },
              { icon: TargetIcon, title: t('product.feature2.title'), desc: t('product.feature2.desc') },
              { icon: ChartBarIcon, title: t('product.feature3.title'), desc: t('product.feature3.desc') }
            ].map((point, index) => {
              const IconComponent = point.icon
              return (
                <motion.div
                  key={index}
                  initial={{ y: 30, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  viewport={{ once: true }}
                  className="text-center space-y-3"
                >
                  <div className={`w-14 h-14 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mx-auto ${
                    theme === 'dark' ? 'bg-[#ADFF2F]/10' : 'bg-[#32CD32]/10'
                  }`}>
                    <IconComponent className={`w-6 h-6 ${
                      theme === 'dark' ? 'text-[#ADFF2F]' : 'text-[#32CD32]'
                    }`} />
                  </div>
                  <h3 className={`text-xl font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-[#1A1A1A]'
                  }`}>
                    {point.title}
                  </h3>
                  <p className={theme === 'dark' ? 'text-[#E0E0E0]' : 'text-[#6C757D]'}>
                    {point.desc}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </section>
  )
}