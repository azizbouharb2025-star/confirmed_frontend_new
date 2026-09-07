/**
 * AI Score Column Component
 * Displays AI score with a progress bar and optional tooltip.
 */

'use client'

import React, { useEffect, useState } from 'react'
import { clsx } from 'clsx'
import {
  getScoreColorClass,
  getRiskLevel,
} from '@/services/aiScoreService'
import { useLanguage } from '@/hooks/useLanguage'

export interface AIScoreColumnProps {
  score: number
  showDetails?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function AIScoreColumn({
  score,
  showDetails = false,
  size = 'md',
  className,
}: AIScoreColumnProps) {
  const { t } = useLanguage()
  const [showTooltip, setShowTooltip] = useState(false)
  const [animatedScore, setAnimatedScore] = useState(0)

  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)))

  useEffect(() => {
    setAnimatedScore(0)

    const animationFrame = requestAnimationFrame(() => {
      setAnimatedScore(normalizedScore)
    })

    return () => cancelAnimationFrame(animationFrame)
  }, [normalizedScore])
  const riskLevel = getRiskLevel(normalizedScore)
  const colorClass = getScoreColorClass(normalizedScore)


  const sizeClasses = {
    sm: {
      container: 'min-w-[130px]',
      text: 'text-xs',
      bar: 'h-2',
    },
    md: {
      container: 'min-w-[160px]',
      text: 'text-sm',
      bar: 'h-2.5',
    },
    lg: {
      container: 'min-w-[190px]',
      text: 'text-base',
      bar: 'h-3',
    },
  }

  const riskLabels = {
    critical: t('orders.riskCritical'),
    high: t('orders.riskHigh'),
    medium: t('orders.riskModerate'),
    low: t('orders.riskLow'),
    very_low: t('orders.riskVeryLow'),
  }


  return (
    <div
      className={clsx(
        'relative',
        sizeClasses[size].container,
        showDetails && 'cursor-help',
        className
      )}
      onMouseEnter={() => showDetails && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="flex items-center gap-3">
        <span
          className={clsx(
            'w-10 shrink-0 font-bold tabular-nums',
            sizeClasses[size].text,
            colorClass
          )}
        >
          {normalizedScore}%
        </span>

        <div
          className={clsx(
            'flex-1 overflow-hidden rounded-full',
            'bg-gray-200 dark:bg-slate-700',
            sizeClasses[size].bar
          )}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={normalizedScore}
          aria-label={`${t('orders.aiScore')} ${normalizedScore}%`}
        >
          <div
        className="h-full rounded-full transition-[width] duration-700 ease-out"
        style={{
          width: `${animatedScore}%`,
          backgroundColor: `hsl(${normalizedScore * 1.2}, 78%, 45%)`,
        }}
      />
        </div>
      </div>

      {showDetails && showTooltip && (
        <div
          className={clsx(
            'absolute z-50 w-48 p-3 mt-2 rounded-lg shadow-lg',
            'bg-white dark:bg-slate-800',
            'border border-gray-200 dark:border-slate-700',
            'text-sm text-gray-700 dark:text-slate-300',
            'left-1/2 -translate-x-1/2'
          )}
          role="tooltip"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">{t('orders.aiScore')}</span>
              <span className={clsx('font-bold', colorClass)}>
                {normalizedScore}%
              </span>
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

          <div
            className={clsx(
              'absolute w-2 h-2 rotate-45',
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
