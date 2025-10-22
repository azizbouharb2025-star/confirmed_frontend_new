'use client'

import { motion } from 'framer-motion'
import { useLanguage } from '@/hooks/useLanguage'
import { useTheme } from '@/hooks/useTheme'
import { DevicePhoneMobileIcon, BellIcon, ChartBarIcon } from '@heroicons/react/24/outline'

export default function MobileAppSection() {
  const { t } = useLanguage()
  const { theme } = useTheme()

  return (
    <section className={`py-20 ${
      theme === 'dark' ? 'bg-[#121212]' : 'bg-white'
    }`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Mobile mockup */}
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className={`relative mx-auto w-64 h-[500px] rounded-[3rem] border-8 shadow-2xl ${
              theme === 'dark' ? 'bg-[#1A1A1A] border-[#333333]' : 'bg-white border-gray-300'
            }`}>
              {/* Phone screen */}
              <div className={`absolute inset-4 rounded-[2rem] overflow-hidden ${
                theme === 'dark' ? 'bg-[#121212]' : 'bg-gray-50'
              }`}>
                {/* Status bar */}
                <div className={`h-8 flex items-center justify-between px-4 text-xs ${
                  theme === 'dark' ? 'text-white' : 'text-black'
                }`}>
                  <span>9:41</span>
                  <span>100%</span>
                </div>
                
                {/* App content */}
                <div className="p-4 space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[#ADFF2F] rounded-full flex items-center justify-center">
                      <span className="text-black font-bold text-sm">C</span>
                    </div>
                    <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                      Confirmed
                    </span>
                  </div>
                  
                  {/* Order cards */}
                  {[1, 2, 3].map((i) => (
                    <div key={i} className={`p-3 rounded-2xl ${
                      theme === 'dark' ? 'bg-[#2A2A2A]' : 'bg-white'
                    } shadow-lg`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-sm font-medium ${
                          theme === 'dark' ? 'text-white' : 'text-black'
                        }`}>
                          Order #{1000 + i}
                        </span>
                        <div className="w-2 h-2 bg-[#ADFF2F] rounded-full" />
                      </div>
                      <div className={`text-xs ${
                        theme === 'dark' ? 'text-[#E0E0E0]' : 'text-[#6C757D]'
                      }`}>
                        Customer: John Doe
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right - Content */}
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="space-y-6">
              <h2 className={`text-4xl lg:text-5xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-[#1A1A1A]'
              }`}>
                {t('mobile.title')}
              </h2>
              <p className={`text-xl leading-relaxed ${
                theme === 'dark' ? 'text-[#E0E0E0]' : 'text-[#6C757D]'
              }`}>
                {t('mobile.description')}
              </p>
            </div>

            <div className="space-y-4">
              {[
                { icon: BellIcon, title: t('mobile.feature1.title'), desc: t('mobile.feature1.desc') },
                { icon: DevicePhoneMobileIcon, title: t('mobile.feature2.title'), desc: t('mobile.feature2.desc') },
                { icon: ChartBarIcon, title: t('mobile.feature3.title'), desc: t('mobile.feature3.desc') }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 + index * 0.1, duration: 0.6 }}
                  viewport={{ once: true }}
                  className="flex items-start space-x-4"
                >
                  <div className={`w-8 h-8 border-2 rounded-lg flex items-center justify-center transition-colors duration-300 ${
                    theme === 'dark' 
                      ? 'border-white/20 hover:border-[#ADFF2F]/50' 
                      : 'border-gray-300 hover:border-green-500/50'
                  }`}>
                    <feature.icon className={`w-5 h-5 transition-colors duration-300 ${
                      theme === 'dark' 
                        ? 'text-white hover:text-[#ADFF2F]' 
                        : 'text-gray-700 hover:text-green-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className={`font-semibold mb-1 ${
                      theme === 'dark' ? 'text-white' : 'text-[#1A1A1A]'
                    }`}>
                      {feature.title}
                    </h3>
                    <p className={theme === 'dark' ? 'text-[#E0E0E0]' : 'text-[#6C757D]'}>
                      {feature.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}