'use client'

import { motion } from 'framer-motion'
import { useLanguage } from '@/hooks/useLanguage'
import { useTheme } from '@/hooks/useTheme'
import Link from 'next/link'
import { CheckIcon } from '@heroicons/react/24/outline'

export default function PricingSection() {
  const { t } = useLanguage()
  const { theme } = useTheme()

  const plans = [
    {
      name: 'Gratuit',
      price: '0',
      period: '',
      description: 'Pour commencer avec les fonctionnalités essentielles',
      features: [
        'Confirmation des commandes',
        'Gestion centralisée des commandes',
        'Suivi des statuts',
        'Tableau de bord essentiel'
      ],
      cta: t('pricing.getStarted'),
      href: '/panel/register',
      popular: false
    },
    {
      name: 'Premium',
      price: '49',
      period: '/ mois',
      description: 'Pour une analyse avancée de vos commandes',
      features: [
        'Analyse IA avancée',
        'Scoring de risque détaillé',
        'Détection des commandes à risque',
        'Analyse comportementale du client',
        'Statistiques avancées'
      ],
      cta: t('pricing.startTrial'),
      href: '/panel/register',
      popular: true
    },
    {
      name: 'Entreprise',
      price: 'Sur mesure',
      period: '',
      description: 'Pour les besoins avancés de votre entreprise',
      features: [
        'Scoring IA entièrement personnalisable',
        'IA adaptée aux données de l’entreprise',
        'Modèles prédictifs avancés',
        'Détection avancée de fraude',
        'API complète et intégrations personnalisées'
      ],
      cta: t('pricing.contactSales'),
      href: '#contact',
      popular: false
    }
  ]

  return (
    <section className={`pt-32 pb-20 ${
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
          <div className="flex h-full flex-col gap-6">
            <h2 className={`text-4xl lg:text-5xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-[#1A1A1A]'
            }`}>
              {t('pricing.title')}
            </h2>
            <p className={`text-xl max-w-3xl mx-auto ${
              theme === 'dark' ? 'text-[#E0E0E0]' : 'text-[#6C757D]'
            }`}>
              {t('pricing.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto items-stretch">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                className={`relative h-full p-6 sm:p-8 rounded-3xl shadow-xl transition-all duration-300 sm:hover:scale-105 ${
                  plan.popular
                    ? theme === 'dark'
                      ? 'bg-gradient-to-br from-[#ADFF2F]/10 to-[#32CD32]/5 border-2 border-[#ADFF2F]'
                      : 'bg-gradient-to-br from-[#ADFF2F]/10 to-[#32CD32]/5 border-2 border-[#32CD32]'
                    : theme === 'dark'
                      ? 'bg-[#2A2A2A] border border-[#333333]'
                      : 'bg-white border border-[#E0E0E0]'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-[#ADFF2F] to-[#32CD32] text-black px-4 py-1 rounded-full text-sm font-semibold">
                      Le plus populaire
                    </span>
                  </div>
                )}

                <div className="flex h-full flex-col gap-6">
                  <div className="text-center min-h-[76px]">
                    <h3 className={`text-2xl font-bold ${
                      theme === 'dark' ? 'text-white' : 'text-[#1A1A1A]'
                    }`}>
                      {plan.name}
                    </h3>
                    <p className={`text-sm mt-2 ${
                      theme === 'dark' ? 'text-[#E0E0E0]' : 'text-[#6C757D]'
                    }`}>
                      {plan.description}
                    </p>
                  </div>

                  <div className="text-center min-h-[58px] flex items-center justify-center">
                    <div className="flex items-baseline justify-center">
                      <span className={`text-5xl font-bold ${
                        theme === 'dark' ? 'text-white' : 'text-[#1A1A1A]'
                      }`}>
                        {plan.price === 'Sur mesure'
                          ? plan.price
                          : `${plan.price} TND`}
                      </span>
                      <span className={`text-lg ${
                        theme === 'dark' ? 'text-[#E0E0E0]' : 'text-[#6C757D]'
                      }`}>
                        {plan.period}
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-4 flex-1">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center space-x-3">
                        <CheckIcon className={`w-5 h-5 ${
                          plan.popular
                            ? 'text-[#ADFF2F]'
                            : theme === 'dark'
                              ? 'text-green-400'
                              : 'text-green-600'
                        }`} />
                        <span className={theme === 'dark' ? 'text-[#E0E0E0]' : 'text-[#6C757D]'}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={plan.href}
                    className={`block w-full mt-auto py-3 px-6 rounded-full font-semibold text-center transition-all duration-300 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-[#ADFF2F] to-[#32CD32] text-black hover:shadow-lg hover:shadow-[#ADFF2F]/25'
                        : theme === 'dark'
                          ? 'bg-[#333333] text-white hover:bg-[#404040]'
                          : 'bg-[#F8F9FA] text-[#1A1A1A] hover:bg-[#E0E0E0]'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}