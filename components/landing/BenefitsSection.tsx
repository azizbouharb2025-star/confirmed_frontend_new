'use client'

import { motion } from 'framer-motion'
import { useLanguage } from '@/hooks/useLanguage'
import { useTheme } from '@/hooks/useTheme'
import { 
  ClockIcon, 
  ShieldCheckIcon, 
  BanknotesIcon, 
  ChartBarSquareIcon 
} from '@heroicons/react/24/outline'

export default function BenefitsSection() {
  const { t } = useLanguage()
  const { theme } = useTheme()

  const benefits = [
    {
      icon: ClockIcon,
      title: t('benefits.time.title'),
      description: t('benefits.time.description')
    },
    {
      icon: ShieldCheckIcon,
      title: t('benefits.security.title'),
      description: t('benefits.security.description')
    },
    {
      icon: BanknotesIcon,
      title: t('benefits.cost.title'),
      description: t('benefits.cost.description')
    },
    {
      icon: ChartBarSquareIcon,
      title: t('benefits.growth.title'),
      description: t('benefits.growth.description')
    }
  ]

  return (
    <section className={`py-20 ${
      theme === 'dark' ? 'bg-[#1E1E1E]' : 'bg-[#F8F9FA]'
    }`}>
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className={`text-4xl lg:text-5xl font-bold mb-6 ${
            theme === 'dark' ? 'text-white' : 'text-[#1A1A1A]'
          }`}>
            {t('benefits.title')}
          </h2>
          <p className={`text-xl max-w-3xl mx-auto ${
            theme === 'dark' ? 'text-[#E0E0E0]' : 'text-[#6C757D]'
          }`}>
            {t('benefits.subtitle')}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              viewport={{ once: true }}
              className={`p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ${
                theme === 'dark' 
                  ? 'bg-[#2A2A2A] hover:bg-[#333333]' 
                  : 'bg-white hover:bg-gray-50'
              }`}
            >
              <div className="text-center space-y-6">
                <div className={`w-16 h-16 mx-auto border-2 rounded-2xl flex items-center justify-center transition-colors duration-300 ${
                  theme === 'dark' 
                    ? 'border-white/20 hover:border-[#ADFF2F]/50' 
                    : 'border-gray-300 hover:border-green-500/50'
                }`}>
                  <benefit.icon className={`w-8 h-8 transition-colors duration-300 ${
                    theme === 'dark' 
                      ? 'text-white hover:text-[#ADFF2F]' 
                      : 'text-gray-700 hover:text-green-600'
                  }`} />
                </div>
                
                <h3 className={`text-xl font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-[#1A1A1A]'
                }`}>
                  {benefit.title}
                </h3>
                
                <p className={`leading-relaxed ${
                  theme === 'dark' ? 'text-[#E0E0E0]' : 'text-[#6C757D]'
                }`}>
                  {benefit.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}