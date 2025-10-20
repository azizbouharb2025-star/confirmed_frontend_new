'use client'

import { motion } from 'framer-motion'
import CountUp from 'react-countup'
import { ReactNode } from 'react'

interface MetricCardProps {
  title: string
  value: number
  change?: number
  icon: ReactNode
  gradient: string
  prefix?: string
  suffix?: string
  decimals?: number
}

export default function MetricCard({ 
  title, 
  value, 
  change, 
  icon, 
  gradient,
  prefix = '',
  suffix = '',
  decimals = 0
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ duration: 0.3 }}
      className={`glass-card p-6 relative overflow-hidden group cursor-pointer`}
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-300`} />
      
      {/* Floating icon */}
      <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-30 transition-opacity duration-300 floating-animation">
        <div className="w-12 h-12">
          {icon}
        </div>
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-neon`}>
            <div className="w-6 h-6 text-white">
              {icon}
            </div>
          </div>
          <h3 className="text-slate-300 font-medium">{title}</h3>
        </div>
        
        <div className="space-y-2">
          <div className="text-3xl font-bold text-white">
            {prefix}
            <CountUp 
              end={value} 
              duration={2} 
              decimals={decimals}
              preserveValue
            />
            {suffix}
          </div>
          
          {change !== undefined && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className={`flex items-center gap-1 text-sm ${
                change >= 0 ? 'text-green-400' : 'text-red-400'
              }`}
            >
              <span>{change >= 0 ? '↗' : '↘'}</span>
              <span>{Math.abs(change)}% from last month</span>
            </motion.div>
          )}
        </div>
      </div>
      
      {/* Shimmer effect */}
      <div className="absolute inset-0 shimmer-effect opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </motion.div>
  )
}