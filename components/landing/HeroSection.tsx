'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useLanguage } from '@/hooks/useLanguage'
import { useTheme } from '@/hooks/useTheme'
import { CheckCircleIcon, PlayIcon } from '@heroicons/react/24/solid'
import { SparklesIcon, RocketLaunchIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useState } from 'react'
import CountUp from 'react-countup'

export default function HeroSection() {
  const { t } = useLanguage()
  const { theme } = useTheme()
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 500], [0, -150])
  const opacity = useTransform(scrollY, [0, 300], [1, 0.8])

  return (
    <section className={`relative min-h-screen flex items-center overflow-hidden ${
      theme === 'dark' ? 'bg-gradient-to-br from-[#0a0a0a] via-[#121212] to-[#1a1a1a]' : 'bg-gradient-to-br from-white via-gray-50 to-blue-50'
    }`}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating orbs */}
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute top-20 left-20 w-32 h-32 rounded-full blur-xl opacity-30 ${
            theme === 'dark' ? 'bg-[#ADFF2F]' : 'bg-blue-400'
          }`}
        />
        <motion.div
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
            scale: [1, 0.8, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className={`absolute top-40 right-32 w-24 h-24 rounded-full blur-xl opacity-20 ${
            theme === 'dark' ? 'bg-purple-500' : 'bg-pink-400'
          }`}
        />
        <motion.div
          animate={{
            x: [0, 60, 0],
            y: [0, -80, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className={`absolute bottom-32 left-1/3 w-20 h-20 rounded-full blur-xl opacity-25 ${
            theme === 'dark' ? 'bg-blue-500' : 'bg-green-400'
          }`}
        />
      </div>

      <motion.div 
        style={{ y, opacity }}
        className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-32 sm:pt-40"
      >
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left Column - Text */}
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1, type: "spring", stiffness: 100 }}
            className="space-y-10"
          >
            <motion.h1 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight"
            >
              <span className={theme === 'dark' ? 'text-white' : 'text-[#1A1A1A]'}>
                {t('hero.title.part1')}
              </span>
              <br />
              <motion.span 
                className="bg-gradient-to-r from-[#ADFF2F] via-[#32CD32] to-[#00BFFF] bg-clip-text text-transparent"
                animate={{ backgroundPosition: ['0%', '100%', '0%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                style={{ backgroundSize: '200% 200%' }}
              >
                {t('hero.title.part2')}
              </motion.span>
            </motion.h1>
            
            <motion.p 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className={`text-base sm:text-xl lg:text-2xl leading-relaxed max-w-2xl ${
                theme === 'dark' ? 'text-[#E0E0E0]' : 'text-[#6C757D]'
              }`}
            >
              {t('hero.description')}
            </motion.p>

            {/* Stats */}
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="grid grid-cols-3 gap-2 sm:gap-8 py-4 sm:py-8"
            >
              {[
                { number: 99.9, suffix: '%', label: 'Accuracy' },
                { number: 50, suffix: 'K+', label: 'Orders' },
                { number: 24, suffix: '/7', label: 'Support' }
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className={`text-xl sm:text-3xl font-bold ${
                    theme === 'dark' ? 'text-[#ADFF2F]' : 'text-green-600'
                  }`}>
                    <CountUp end={stat.number} duration={2} delay={1 + index * 0.2} />
                    {stat.suffix}
                  </div>
                  <div className={`text-xs sm:text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4"
            >
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto"
              >
                <Link 
                  href="/panel/register"
                  className="group relative flex items-center justify-center w-full px-6 sm:px-8 py-4 bg-gradient-to-r from-[#ADFF2F] to-[#32CD32] text-black font-bold rounded-full overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-[#ADFF2F]/25 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#32CD32] to-[#ADFF2F] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative z-10 flex items-center text-base sm:text-lg">
                    <RocketLaunchIcon className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                    {t('hero.cta')}
                  </span>
                </Link>
              </motion.div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsVideoPlaying(true)}
                className={`w-full sm:w-auto flex items-center justify-center px-6 sm:px-8 py-4 rounded-full font-semibold border-2 transition-all duration-300 text-base sm:text-lg ${
                  theme === 'dark'
                    ? 'border-white/20 text-white hover:border-[#ADFF2F] hover:text-[#ADFF2F] hover:bg-[#ADFF2F]/10'
                    : 'border-gray-300 text-gray-700 hover:border-green-500 hover:text-green-600 hover:bg-green-50'
                }`}
              >
                <PlayIcon className="w-5 h-5 mr-2" />
                Watch Demo
              </motion.button>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.8 }}
              className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-6 pt-4 sm:pt-8"
            >
              <div className="flex items-center space-x-2">
                <ShieldCheckIcon className={`w-5 h-5 flex-shrink-0 ${
                  theme === 'dark' ? 'text-[#ADFF2F]' : 'text-green-600'
                }`} />
                <span className={`text-xs sm:text-sm ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Enterprise Security
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className={`w-5 h-5 flex-shrink-0 ${
                  theme === 'dark' ? 'text-[#ADFF2F]' : 'text-green-600'
                }`} />
                <span className={`text-xs sm:text-sm ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  GDPR Compliant
                </span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - 3D Visual */}
          <motion.div
            initial={{ x: 100, opacity: 0, rotateY: -30 }}
            animate={{ x: 0, opacity: 1, rotateY: 0 }}
            transition={{ duration: 1.2, delay: 0.4, type: "spring", stiffness: 100 }}
            className="relative perspective-1000"
          >
            {/* 3D Card Stack */}
            <div className="relative w-full max-w-lg mx-auto">
              {/* Background cards */}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ rotateX: -20, rotateY: 10, z: -100 * i }}
                  animate={{ 
                    rotateX: [-20, -15, -20], 
                    rotateY: [10, 15, 10],
                    z: [-100 * i, -80 * i, -100 * i]
                  }}
                  transition={{ 
                    duration: 4 + i, 
                    repeat: Infinity, 
                    ease: "easeInOut",
                    delay: i * 0.5
                  }}
                  className={`absolute inset-0 rounded-3xl backdrop-blur-xl border shadow-2xl transform-gpu ${
                    theme === 'dark'
                      ? 'bg-gradient-to-br from-[#1a1a1a]/80 to-[#2a2a2a]/60 border-white/10'
                      : 'bg-gradient-to-br from-white/90 to-gray-100/80 border-gray-200/50'
                  }`}
                  style={{
                    transform: `translateZ(${-50 * i}px) rotateX(-${5 + i * 2}deg) rotateY(${5 + i * 3}deg)`,
                    opacity: 1 - i * 0.2
                  }}
                />
              ))}
              
              {/* Main card */}
              <motion.div
                whileHover={{ 
                  rotateX: -10, 
                  rotateY: 10, 
                  scale: 1.05,
                  z: 50
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={`relative p-8 rounded-3xl backdrop-blur-xl border shadow-2xl transform-gpu cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-gradient-to-br from-[#1a1a1a]/90 to-[#2a2a2a]/70 border-white/20 hover:border-[#ADFF2F]/50'
                    : 'bg-gradient-to-br from-white/95 to-gray-50/90 border-gray-200/60 hover:border-green-300/50'
                }`}
              >
                {/* Floating elements */}
                <div className="relative h-80">
                  {/* AI Brain Icon */}
                  <motion.div
                    animate={{ 
                      y: [0, -10, 0],
                      rotate: [0, 5, 0]
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className={`absolute top-8 left-8 w-16 h-16 border-2 rounded-2xl flex items-center justify-center shadow-lg ${
                      theme === 'dark' ? 'border-white/20' : 'border-gray-300'
                    }`}
                  >
                    <svg className={`w-8 h-8 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-700'
                    }`} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </motion.div>

                  {/* Phone mockup */}
                  <motion.div
                    animate={{ 
                      x: [0, 10, 0],
                      y: [0, -5, 0]
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className={`absolute top-16 right-8 w-32 h-56 rounded-3xl border-4 shadow-xl ${
                      theme === 'dark' ? 'bg-[#2a2a2a] border-gray-600' : 'bg-white border-gray-300'
                    }`}
                  >
                    <div className="p-4 space-y-3">
                      <div className={`h-2 rounded-full ${
                        theme === 'dark' ? 'bg-[#444444]' : 'bg-gray-200'
                      }`} />
                      <div className={`h-2 w-3/4 rounded-full ${
                        theme === 'dark' ? 'bg-[#444444]' : 'bg-gray-200'
                      }`} />
                      <div className={`h-8 border-2 rounded-lg flex items-center justify-center ${
                        theme === 'dark' ? 'border-white/20' : 'border-gray-300'
                      }`}>
                        <CheckCircleIcon className={`w-4 h-4 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-700'
                        }`} />
                      </div>
                    </div>
                  </motion.div>

                  {/* Analytics chart */}
                  <motion.div
                    animate={{ 
                      scale: [1, 1.05, 1],
                      rotate: [0, -2, 0]
                    }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className={`absolute bottom-8 left-4 w-40 h-24 rounded-2xl p-4 shadow-lg ${
                      theme === 'dark' ? 'bg-[#333333]' : 'bg-gray-100'
                    }`}
                  >
                    <div className="flex items-end justify-between h-full space-x-1">
                      {[40, 70, 45, 80, 60, 90, 75].map((height, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${height}%` }}
                          transition={{ delay: 2 + i * 0.1, duration: 0.5 }}
                          className="bg-gradient-to-t from-[#ADFF2F] to-[#32CD32] rounded-sm flex-1"
                        />
                      ))}
                    </div>
                  </motion.div>

                  {/* Success badge */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 1.5, duration: 0.8, type: "spring", stiffness: 200 }}
                    className={`absolute -top-4 -right-4 w-20 h-20 border-2 rounded-full flex items-center justify-center shadow-2xl ${
                      theme === 'dark' ? 'border-white/20' : 'border-gray-300'
                    }`}
                  >
                    <CheckCircleIcon className={`w-12 h-12 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-700'
                    }`} />
                  </motion.div>

                  {/* Floating particles */}
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        y: [0, -20, 0],
                        x: [0, Math.sin(i) * 10, 0],
                        opacity: [0.3, 0.8, 0.3]
                      }}
                      transition={{
                        duration: 3 + i * 0.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.3
                      }}
                      className={`absolute w-2 h-2 rounded-full ${
                        i % 3 === 0 ? 'bg-[#ADFF2F]' : i % 3 === 1 ? 'bg-blue-400' : 'bg-purple-400'
                      }`}
                      style={{
                        left: `${20 + (i * 15)}%`,
                        top: `${30 + (i * 10)}%`
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Video Modal */}
      {isVideoPlaying && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setIsVideoPlaying(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="relative w-full max-w-4xl mx-4 aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsVideoPlaying(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
            >
              ×
            </button>
            <div className="w-full h-full flex items-center justify-center text-white">
              <div className="text-center">
                <PlayIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg opacity-75">Demo video would be embedded here</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </section>
  )
}