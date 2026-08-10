/**
 * AI Score Column Component
 * Displays AI score with color coding and tooltip
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

'use client'

import React, { useState } from 'react'
import { clsx } from 'clsx'
import { getScoreColorClass, getScoreBgColorClass, getRiskLevel } from '@/services/aiScoreService'
import { useLanguage } from '@/hooks/useLanguage'

export interface AIScoreColumnProps {
  score: number
  showDetails?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * AIScoreColumn Component
 * 
 * Displays AI score with:
 * - Color coding based on risk level (red < 40, orange 40-70, green > 70)
 * - Optional tooltip with score breakdown
 * - Responsive sizing
 * 
 * Requirements: 5.3, 5.4, 5.5
 * Property 17: AI score color coding
 */
export default function AIScoreColumn({
  score,
  showDetails = false,
  size = 'md',
  className,
}: AIScoreColumnProps) {
  const { t } = useLanguage()
  const [showTooltip, setShowTooltip] = useState(false)
  
  const riskLevel = getRiskLevel(score)
  const colorClass = getScoreColorClass(score)
  const bgColorClass = getScoreBgColorClass(score)
  
  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  }
  
  // Risk level labels
  const riskLabels = {
    high: t('orders.highRisk'),
    medium: t('orders.mediumRisk'),
    low: t('orders.lowRisk'),
  }
  
  return (
    <div className={clsx('relative inline-block', className)}>
      <div
        className={clsx(
          'inline-flex items-center gap-1.5 rounded-full font-medium',
          bgColorClass,
          colorClass,
          sizeClasses[size],
          showDetails && 'cursor-help'
        )}
        onMouseEnter={() => showDetails && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {/* Score value */}
        <span className="font-semibold">{score}</span>
        
        {/* Risk indicator dot */}
        <span
          className={clsx(
            'w-2 h-2 rounded-full',
            riskLevel === 'high' && 'bg-red-600 dark:bg-red-400',
            riskLevel === 'medium' && 'bg-orange-600 dark:bg-orange-400',
            riskLevel === 'low' && 'bg-green-600 dark:bg-green-400'
          )}
          aria-label={riskLabels[riskLevel]}
        />
      </div>
      
      {/* Tooltip with score details */}
      {showDetails && showTooltip && (
        <div
          className={clsx(
            'absolute z-50 w-48 p-3 mt-2 rounded-lg shadow-lg',
            'bg-white dark:bg-slate-800',
            'border border-gray-200 dark:border-slate-700',
            'text-sm text-gray-700 dark:text-slate-300',
            'left-1/2 transform -translate-x-1/2'
          )}
          role="tooltip"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">{t('orders.aiScore')}</span>
              <span className={clsx('font-bold', colorClass)}>{score}</span>
            </div>
            
            <div className="pt-2 border-t border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-xs">
                <span>{t('orders.riskLevel')}</span>
                <span className={clsx('font-medium', colorClass)}>
                  {riskLabels[riskLevel]}
                </span>
              </div>
            </div>
            
            <div className="text-xs text-gray-500 dark:text-slate-400">
              {riskLevel === 'high' && t('orders.highRiskDesc')}
              {riskLevel === 'medium' && t('orders.mediumRiskDesc')}
              {riskLevel === 'low' && t('orders.lowRiskDesc')}
            </div>
          </div>
          
          {/* Tooltip arrow */}
          <div
            className={clsx(
              'absolute w-2 h-2 transform rotate-45',
              'bg-white dark:bg-slate-800',
              'border-l border-t border-gray-200 dark:border-slate-700',
              '-top-1 left-1/2 -translate-x-1/2'
            )}
          />
        </div>
      )}
    </div>
  )
}
