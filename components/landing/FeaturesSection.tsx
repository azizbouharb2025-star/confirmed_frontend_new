'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useLanguage } from '@/hooks/useLanguage'
import { useTheme } from '@/hooks/useTheme'
import { PhoneIcon, CpuChipIcon, ChartBarIcon, SparklesIcon, BoltIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'
import { useRef } from 'react'

export default function FeaturesSection() {
  const { t } = useLanguage()
  const { theme } = useTheme()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  })
  
  const y = useTransform(scrollYProgress, [0, 1], [100, -100])
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0])

  const features = [
    {
      icon: PhoneIcon,
      title: t('features.ai.title'),
      description: t('features.ai.description'),
      color: 'from-[#ADFF2F] to-[#32CD32]',
      bgColor: theme === 'dark' ? 'from-[#ADFF2F]/20 to-[#32CD32]/10' : 'from-green-100 to-emerald-100',
      stats: '99.9% Accuracy'
    },
    {
      icon: CpuChipIcon,
      title: t('features.automation.title'),
      description: t('features.automation.description'),
      color: 'from-blue-400 to-blue-600',
      bgColor: theme === 'dark' ? 'from-blue-500/20 to-blue-600/10' : 'from-blue-100 to-sky-100',
      stats: '10x Faster'
    },
    {
      icon: ChartBarIcon,
      title: t('features.analytics.title'),
      description: t('features.analytics.description'),
      color: 'from-purple-400 to-purple-600',
      bgColor: theme === 'dark' ? 'from-purple-500/20 to-purple-600/10' : 'from-purple-100 to-violet-100',
      stats: 'Real-time Insights'
    }
  ]

  const additionalFeatures = [
    { icon: SparklesIcon, title: 'AI-Powered', desc: 'Advanced machine learning' },
    { icon: BoltIcon, title: 'Lightning Fast', desc: 'Sub-second response times' },
    { icon: ShieldCheckIcon, title: 'Enterprise Security', desc: 'Bank-grade encryption' }
  ]

  return (
    <section 
      ref={ref}
      className={`relative py-32 overflow-hidden ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-[#0f0f0f] via-[#1a1a1a] to-[#0f0f0f]' 
          : 'bg-gradient-to-br from-gray-50 via-white to-blue-50'
      }`}
    >
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          style={{ y }}
          className={`absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-20 ${
            theme === 'dark' ? 'bg-[#ADFF2F]' : 'bg-green-400'
          }`}
        />
        <motion.div
          style={{ y: useTransform(scrollYProgress, [0, 1], [-50, 50]) }}
          className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl opacity-20 ${
            theme === 'dark' ? 'bg-purple-500' : 'bg-purple-400'
          }`}
        />
      </div>

      <motion.div 
        style={{ opacity }}
        className="relative max-w-7xl mx-auto px-6"
      >
        {/* Section header */}
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium mb-6 ${
              theme === 'dark'
                ? 'bg-[#ADFF2F]/10 border border-[#ADFF2F]/30 text-[#ADFF2F]'
                : 'bg-green-100 border border-green-200 text-green-800'
            }`}
          >
            <SparklesIcon className="w-4 h-4 mr-2" />
            Powerful Features
          </motion.div>
          
          <h2 className={`text-5xl lg:text-6xl font-bold mb-8 ${
            theme === 'dark' ? 'text-white' : 'text-[#1A1A1A]'
          }`}>
            <span className="bg-gradient-to-r from-[#ADFF2F] via-[#32CD32] to-[#00BFFF] bg-clip-text text-transparent">
              {t('features.title')}
            </span>
          </h2>
          
          <p className={`text-xl lg:text-2xl max-w-4xl mx-auto leading-relaxed ${
            theme === 'dark' ? 'text-[#E0E0E0]' : 'text-[#6C757D]'
          }`}>
            {t('features.subtitle')}
          </p>
        </motion.div>

        {/* Main features grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ y: 100, opacity: 0, rotateX: -30 }}
              whileInView={{ y: 0, opacity: 1, rotateX: 0 }}
              transition={{ 
                delay: index * 0.2, 
                duration: 0.8,
                type: "spring",
                stiffness: 100
              }}
              viewport={{ once: true }}
              whileHover={{ 
                y: -10, 
                rotateX: 5, 
                rotateY: 5,
                scale: 1.02
              }}
              className={`group relative p-8 rounded-3xl backdrop-blur-xl border transition-all duration-500 transform-gpu perspective-1000 ${
                theme === 'dark'
                  ? 'bg-gradient-to-br from-[#1a1a1a]/80 to-[#2a2a2a]/60 border-white/10 hover:border-[#ADFF2F]/30'
                  : 'bg-gradient-to-br from-white/90 to-gray-50/80 border-gray-200/50 hover:border-green-300/50'
              }`}
            >
              {/* Gradient background */}
              <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${feature.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              {/* Content */}
              <div className="relative z-10 text-center space-y-6">
                {/* Icon with glow effect */}
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className={`relative w-20 h-20 mx-auto rounded-2xl border-2 flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-300 ${
                    theme === 'dark' 
                      ? 'border-white/20 group-hover:border-[#ADFF2F]/50' 
                      : 'border-gray-300 group-hover:border-green-500/50'
                  }`}
                >
                  <feature.icon className={`w-10 h-10 transition-colors duration-300 ${
                    theme === 'dark' 
                      ? 'text-white group-hover:text-[#ADFF2F]' 
                      : 'text-gray-700 group-hover:text-green-600'
                  }`} />
                </motion.div>
                
                {/* Stats badge */}
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    theme === 'dark'
                      ? 'bg-[#ADFF2F]/20 text-[#ADFF2F]'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {feature.stats}
                </motion.div>
                
                <h3 className={`text-2xl lg:text-3xl font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-[#1A1A1A]'
                }`}>
                  {feature.title}
                </h3>
                
                <p className={`text-lg leading-relaxed ${
                  theme === 'dark' ? 'text-[#E0E0E0]' : 'text-[#6C757D]'
                }`}>
                  {feature.description}
                </p>

                {/* Hover effect particles */}
                <div className="absolute inset-0 overflow-hidden rounded-3xl">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className={`absolute w-1 h-1 rounded-full opacity-0 group-hover:opacity-100 ${
                        i % 3 === 0 ? 'bg-[#ADFF2F]' : i % 3 === 1 ? 'bg-blue-400' : 'bg-purple-400'
                      }`}
                      style={{
                        left: `${20 + (i * 15)}%`,
                        top: `${30 + (i * 10)}%`
                      }}
                      animate={{
                        y: [0, -20, 0],
                        opacity: [0, 1, 0]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.3
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional features */}
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-6"
        >
          {additionalFeatures.map((feature, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05, y: -5 }}
              className={`flex items-center space-x-4 p-6 rounded-2xl backdrop-blur-sm border transition-all duration-300 ${
                theme === 'dark'
                  ? 'bg-white/5 border-white/10 hover:border-[#ADFF2F]/30'
                  : 'bg-white/80 border-gray-200/50 hover:border-green-300/50'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-colors duration-300 ${
                theme === 'dark' 
                  ? 'border-white/20 hover:border-[#ADFF2F]/50' 
                  : 'border-gray-300 hover:border-green-500/50'
              }`}>
                <feature.icon className={`w-6 h-6 transition-colors duration-300 ${
                  theme === 'dark' 
                    ? 'text-white hover:text-[#ADFF2F]' 
                    : 'text-gray-700 hover:text-green-600'
                }`} />
              </div>
              <div>
                <h4 className={`font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {feature.title}
                </h4>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {feature.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}