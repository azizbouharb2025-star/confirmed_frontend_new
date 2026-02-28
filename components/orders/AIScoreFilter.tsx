/**
 * AI Score Filter Component
 * Dual-range slider for filtering orders by AI score
 * Requirements: 5.8
 */

'use client'

import React, { useState, useEffect } from 'react'
import { clsx } from 'clsx'
import { useLanguage } from '@/hooks/useLanguage'

export interface AIScoreFilterProps {
  minScore: number
  maxScore: number
  onChange: (min: number, max: number) => void
  className?: string
}

/**
 * AIScoreFilter Component
 * 
 * Provides a dual-range slider for filtering orders by AI score
 * - Min and max score selection (0-100)
 * - Visual feedback with color coding
 * - Real-time value display
 * 
 * Requirements: 5.8
 */
export default function AIScoreFilter({
  minScore,
  maxScore,
  onChange,
  className,
}: AIScoreFilterProps) {
  const { t } = useLanguage()
  const [localMin, setLocalMin] = useState(minScore)
  const [localMax, setLocalMax] = useState(maxScore)
  
  // Sync with props
  useEffect(() => {
    setLocalMin(minScore)
    setLocalMax(maxScore)
  }, [minScore, maxScore])
  
  const handleMinChange = (value: number) => {
    const newMin = Math.min(value, localMax - 1)
    setLocalMin(newMin)
    onChange(newMin, localMax)
  }
  
  const handleMaxChange = (value: number) => {
    const newMax = Math.max(value, localMin + 1)
    setLocalMax(newMax)
    onChange(localMin, newMax)
  }
  
  // Calculate color based on score range
  const getScoreColor = (score: number): string => {
    if (score < 40) return 'text-red-600 dark:text-red-400'
    if (score <= 70) return 'text-orange-600 dark:text-orange-400'
    return 'text-green-600 dark:text-green-400'
  }
  
  return (
    <div className={clsx('space-y-3', className)}>
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
        {t('orders.filterByScore')}
      </label>
      
      {/* Score range display */}
      <div className="flex items-center justify-between text-sm">
        <span className={clsx('font-semibold', getScoreColor(localMin))}>
          {localMin}
        </span>
        <span className="text-gray-500 dark:text-slate-400">-</span>
        <span className={clsx('font-semibold', getScoreColor(localMax))}>
          {localMax}
        </span>
      </div>
      
      {/* Dual range slider */}
      <div className="relative pt-2 pb-6">
        {/* Track background */}
        <div className="absolute w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-full" />
        
        {/* Active range highlight */}
        <div
          className="absolute h-2 bg-blue-500 dark:bg-blue-400 rounded-full"
          style={{
            left: `${localMin}%`,
            width: `${localMax - localMin}%`,
          }}
        />
        
        {/* Min slider */}
        <input
          type="range"
          min="0"
          max="100"
          value={localMin}
          onChange={(e) => handleMinChange(parseInt(e.target.value))}
          className={clsx(
            'absolute w-full h-2 appearance-none bg-transparent',
            'pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto',
            '[&::-webkit-slider-thumb]:appearance-none',
            '[&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4',
            '[&::-webkit-slider-thumb]:rounded-full',
            '[&::-webkit-slider-thumb]:bg-blue-600 dark:[&::-webkit-slider-thumb]:bg-blue-400',
            '[&::-webkit-slider-thumb]:cursor-pointer',
            '[&::-webkit-slider-thumb]:shadow-md',
            '[&::-webkit-slider-thumb]:hover:scale-110',
            '[&::-webkit-slider-thumb]:transition-transform',
            '[&::-moz-range-thumb]:appearance-none',
            '[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4',
            '[&::-moz-range-thumb]:rounded-full',
            '[&::-moz-range-thumb]:bg-blue-600 dark:[&::-moz-range-thumb]:bg-blue-400',
            '[&::-moz-range-thumb]:cursor-pointer',
            '[&::-moz-range-thumb]:border-0',
            '[&::-moz-range-thumb]:shadow-md'
          )}
          aria-label={t('orders.minScore')}
        />
        
        {/* Max slider */}
        <input
          type="range"
          min="0"
          max="100"
          value={localMax}
          onChange={(e) => handleMaxChange(parseInt(e.target.value))}
          className={clsx(
            'absolute w-full h-2 appearance-none bg-transparent',
            'pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto',
            '[&::-webkit-slider-thumb]:appearance-none',
            '[&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4',
            '[&::-webkit-slider-thumb]:rounded-full',
            '[&::-webkit-slider-thumb]:bg-blue-600 dark:[&::-webkit-slider-thumb]:bg-blue-400',
            '[&::-webkit-slider-thumb]:cursor-pointer',
            '[&::-webkit-slider-thumb]:shadow-md',
            '[&::-webkit-slider-thumb]:hover:scale-110',
            '[&::-webkit-slider-thumb]:transition-transform',
            '[&::-moz-range-thumb]:appearance-none',
            '[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4',
            '[&::-moz-range-thumb]:rounded-full',
            '[&::-moz-range-thumb]:bg-blue-600 dark:[&::-moz-range-thumb]:bg-blue-400',
            '[&::-moz-range-thumb]:cursor-pointer',
            '[&::-moz-range-thumb]:border-0',
            '[&::-moz-range-thumb]:shadow-md'
          )}
          aria-label={t('orders.maxScore')}
        />
      </div>
      
      {/* Risk level indicators */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          {t('orders.highRisk')} (&lt;40)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-orange-500" />
          {t('orders.mediumRisk')} (40-70)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          {t('orders.lowRisk')} (&gt;70)
        </span>
      </div>
    </div>
  )
}
