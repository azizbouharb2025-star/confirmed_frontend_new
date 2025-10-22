'use client'

import { motion } from 'framer-motion'
import { useLanguage } from '@/hooks/useLanguage'
import { useTheme } from '@/hooks/useTheme'

export default function IntegrationsSection() {
  const { t } = useLanguage()
  const { theme } = useTheme()

  const integrations = [
    { name: 'Shopify', category: 'E-commerce' },
    { name: 'WooCommerce', category: 'E-commerce' },
    { name: 'Magento', category: 'E-commerce' },
    { name: 'Stripe', category: 'Payment' },
    { name: 'PayPal', category: 'Payment' },
    { name: 'Aramex', category: 'Shipping' },
    { name: 'DHL', category: 'Shipping' },
    { name: 'FedEx', category: 'Shipping' },
    { name: 'Zapier', category: 'Automation' },
    { name: 'Slack', category: 'Communication' },
    { name: 'WhatsApp', category: 'Communication' },
    { name: 'Telegram', category: 'Communication' }
  ]

  return (
    <section className={`py-20 ${
      theme === 'dark' ? 'bg-[#121212]' : 'bg-white'
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
            {t('integrations.title')}
          </h2>
          <p className={`text-xl max-w-3xl mx-auto ${
            theme === 'dark' ? 'text-[#E0E0E0]' : 'text-[#6C757D]'
          }`}>
            {t('integrations.subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {integrations.map((integration, index) => (
            <motion.div
              key={integration.name}
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.05, duration: 0.5 }}
              viewport={{ once: true }}
              className={`group p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ${
                theme === 'dark' 
                  ? 'bg-[#1E1E1E] hover:bg-[#2A2A2A]' 
                  : 'bg-[#F8F9FA] hover:bg-white'
              }`}
            >
              <div className="text-center space-y-3">
                <div className={`w-12 h-12 mx-auto border-2 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 ${
                  theme === 'dark' 
                    ? 'border-white/20 group-hover:border-[#ADFF2F]/50' 
                    : 'border-gray-300 group-hover:border-green-500/50'
                }`}>
                  <div className={`w-6 h-6 rounded bg-current opacity-20`} />
                </div>
                <div>
                  <h3 className={`font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-[#1A1A1A]'
                  }`}>
                    {integration.name}
                  </h3>
                  <p className={`text-xs ${
                    theme === 'dark' ? 'text-[#E0E0E0]' : 'text-[#6C757D]'
                  }`}>
                    {integration.category}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Integration stats */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { number: '50+', label: t('integrations.stat1') },
              { number: '99.9%', label: t('integrations.stat2') },
              { number: '< 5min', label: t('integrations.stat3') }
            ].map((stat, index) => (
              <div key={index} className="space-y-2">
                <div className="text-4xl font-bold bg-gradient-to-r from-[#ADFF2F] to-[#32CD32] bg-clip-text text-transparent">
                  {stat.number}
                </div>
                <div className={theme === 'dark' ? 'text-[#E0E0E0]' : 'text-[#6C757D]'}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}