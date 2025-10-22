'use client'

import CountUp from 'react-countup'
import { ReactNode } from 'react'

interface MetricCardProps {
  title: string
  value: number
  change?: number
  icon: ReactNode
  prefix?: string
  suffix?: string
  decimals?: number
}

export default function MetricCard({ title, value, change, icon, prefix = '', suffix = '', decimals = 0 }: MetricCardProps) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium dark:text-slate-400 light:text-gray-600">{title}</h3>
        <div className="dark:text-slate-400 light:text-gray-400">{icon}</div>
      </div>
      
      <div className="space-y-1">
        <div className="text-2xl font-semibold">
          {prefix}<CountUp end={value} duration={1} decimals={decimals} preserveValue />{suffix}
        </div>
        
        {change !== undefined && (
          <div className={`text-xs ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {change >= 0 ? '↗' : '↘'} {Math.abs(change)}% from last month
          </div>
        )}
      </div>
    </div>
  )
}