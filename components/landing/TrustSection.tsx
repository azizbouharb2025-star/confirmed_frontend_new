'use client'

import { motion } from 'framer-motion'
import { useLanguage } from '@/hooks/useLanguage'
import { useTheme } from '@/hooks/useTheme'
import { ShoppingBagIcon, ShoppingCartIcon, CreditCardIcon, TruckIcon, CurrencyDollarIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline'

export default function TrustSection() {
  const { t } = useLanguage()
  const { theme } = useTheme()

  const partners = [
    { name: 'Shopify', icon: ShoppingBagIcon },
    { name: 'WooCommerce', icon: ShoppingCartIcon },
    { name: 'Stripe', icon: CreditCardIcon },
    { name: 'Aramex', icon: TruckIcon },
    { name: 'PayPal', icon: CurrencyDollarIcon },
    { name: 'Amazon', icon: ClipboardDocumentListIcon }
  ]

  return (
    <section className={`py-16 ${
      theme === 'dark' ? 'bg-[#1E1E1E]' : 'bg-[#F8F9FA]'
    }`}>
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center space-y-12"
        >
          <h2 className={`text-2xl font-semibold ${
            theme === 'dark' ? 'text-[#E0E0E0]' : 'text-[#6C757D]'
          }`}>
            {t('trust.title')}
          </h2>

          <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-16">
            {partners.map((partner, index) => (
              <motion.div
                key={partner.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                className={`flex items-center space-x-3 px-6 py-3 rounded-2xl transition-all duration-300 hover:scale-105 ${
                  theme === 'dark' 
                    ? 'bg-[#2A2A2A] hover:bg-[#333333]' 
                    : 'bg-white hover:bg-gray-50'
                } shadow-lg`}
              >
                <partner.icon className={`w-6 h-6 ${
                  theme === 'dark' ? 'text-[#ADFF2F]' : 'text-[#32CD32]'
                }`} />
                <span className={`font-medium ${
                  theme === 'dark' ? 'text-[#E0E0E0]' : 'text-[#6C757D]'
                }`}>
                  {partner.name}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}