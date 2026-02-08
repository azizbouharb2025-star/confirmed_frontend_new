'use client'

import React from 'react'
import { clsx } from 'clsx'

/**
 * RiskScoreIndicator Component
 * Visual indicator for AI risk scores with color thresholds
 * 
 * Feature: order-management-system, Property 17: AI risk score indicator color mapping
 * Validates: Requirements 8.2, 8.3, 8.4
 * 
 * Color thresholds:
 * - Green: score > 70 (high confidence)
 * - Orange: 40 <= score <= 70 (medium confidence)
 * - Red: score < 40 (low confidence)
 */

export interface RiskScoreIndicatorProps {
  score: number  // 0-100
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

/**
 * Color category type for risk scores
 */
export type RiskColorCategory = 'green' | 'orange' | 'red'

/**
 * Get the color category for a given risk score
 * - Green: score > 70 (high confidence)
 * - Orange: 40 <= score <= 70 (medium confidence)
 * - Red: score < 40 (low confidence)
 * 
 * @param score - The AI risk score (0-100)
 * @returns The color category
 */
export function getRiskScoreColor(score: number): RiskColorCategory {
  if (score > 70) {
    return 'green'
  } else if (score >= 40) {
    return 'orange'
  } else {
    return 'red'
  }
}

/**
 * Color configurations for each risk level
 */
export const RISK_COLORS: Record<RiskColorCategory, { bg: string; text: string; ring: string }> = {
  green: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    ring: 'ring-green-500',
  },
  orange: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-300',
    ring: 'ring-orange-500',
  },
  red: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    ring: 'ring-red-500',
  },
}


/**
 * Labels for each risk level
 */
export const RISK_LABELS: Record<RiskColorCategory, string> = {
  green: 'High Confidence',
  orange: 'Medium Confidence',
  red: 'Low Confidence',
}

/**
 * Size configurations
 */
const SIZE_CLASSES = {
  sm: {
    container: 'w-8 h-8',
    text: 'text-xs',
    label: 'text-xs',
  },
  md: {
    container: 'w-10 h-10',
    text: 'text-sm',
    label: 'text-sm',
  },
  lg: {
    container: 'w-14 h-14',
    text: 'text-base',
    label: 'text-base',
  },
}

/**
 * Progress ring SVG component
 */
function ProgressRing({ 
  score, 
  size, 
  colorCategory 
}: { 
  score: number
  size: 'sm' | 'md' | 'lg'
  colorCategory: RiskColorCategory 
}) {
  const dimensions = {
    sm: { size: 32, strokeWidth: 3, radius: 12 },
    md: { size: 40, strokeWidth: 4, radius: 15 },
    lg: { size: 56, strokeWidth: 5, radius: 22 },
  }
  
  const { size: svgSize, strokeWidth, radius } = dimensions[size]
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference
  
  const strokeColors: Record<RiskColorCategory, string> = {
    green: '#22c55e',
    orange: '#f97316',
    red: '#ef4444',
  }
  
  return (
    <svg 
      width={svgSize} 
      height={svgSize} 
      className="transform -rotate-90"
    >
      {/* Background circle */}
      <circle
        cx={svgSize / 2}
        cy={svgSize / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-gray-200 dark:text-gray-700"
      />
      {/* Progress circle */}
      <circle
        cx={svgSize / 2}
        cy={svgSize / 2}
        r={radius}
        fill="none"
        stroke={strokeColors[colorCategory]}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        className="transition-all duration-300"
      />
    </svg>
  )
}

export default function RiskScoreIndicator({ 
  score, 
  size = 'md', 
  showLabel = false,
  className 
}: RiskScoreIndicatorProps) {
  // Clamp score to 0-100 range
  const clampedScore = Math.max(0, Math.min(100, score))
  const colorCategory = getRiskScoreColor(clampedScore)
  const colors = RISK_COLORS[colorCategory]
  const sizeClasses = SIZE_CLASSES[size]
  
  return (
    <div 
      className={clsx('inline-flex items-center gap-2', className)}
      data-score={clampedScore}
      data-color={colorCategory}
    >
      <div className={clsx('relative', sizeClasses.container)}>
        <ProgressRing 
          score={clampedScore} 
          size={size} 
          colorCategory={colorCategory} 
        />
        <div 
          className={clsx(
            'absolute inset-0 flex items-center justify-center font-semibold',
            colors.text,
            sizeClasses.text
          )}
        >
          {Math.round(clampedScore)}
        </div>
      </div>
      {showLabel && (
        <span className={clsx(colors.text, sizeClasses.label)}>
          {RISK_LABELS[colorCategory]}
        </span>
      )}
    </div>
  )
}
