'use client'

import React from 'react'
import { clsx } from 'clsx'

/**
 * RepeatBuyerBadge Component
 * Displays a badge indicating a repeat/returning customer
 * 
 * Feature: order-management-system, Property 18: Repeat buyer badge visibility
 * Validates: Requirements 8.5
 */

export interface RepeatBuyerBadgeProps {
  isRepeatBuyer: boolean
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

/**
 * Size configurations for the badge
 */
const SIZE_CLASSES = {
  sm: {
    container: 'px-1.5 py-0.5 text-xs gap-1',
    icon: 'w-3 h-3',
  },
  md: {
    container: 'px-2 py-1 text-sm gap-1.5',
    icon: 'w-4 h-4',
  },
  lg: {
    container: 'px-2.5 py-1.5 text-base gap-2',
    icon: 'w-5 h-5',
  },
}

/**
 * Determines if the badge should be visible
 * Badge is only shown when isRepeatBuyer is true
 * 
 * @param isRepeatBuyer - Whether the customer is a repeat buyer
 * @returns true if badge should be displayed
 */
export function shouldShowRepeatBuyerBadge(isRepeatBuyer: boolean): boolean {
  return isRepeatBuyer === true
}

/**
 * Star icon for repeat buyer badge
 */
function StarIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      fill="currentColor" 
      viewBox="0 0 20 20"
      aria-hidden="true"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )
}

export default function RepeatBuyerBadge({ 
  isRepeatBuyer, 
  size = 'md', 
  showLabel = true,
  className 
}: RepeatBuyerBadgeProps) {
  // Only render if isRepeatBuyer is true
  if (!shouldShowRepeatBuyerBadge(isRepeatBuyer)) {
    return null
  }
  
  const sizeClasses = SIZE_CLASSES[size]
  
  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full',
        'bg-amber-100 dark:bg-amber-900/30',
        'text-amber-800 dark:text-amber-300',
        'border border-amber-200 dark:border-amber-800',
        sizeClasses.container,
        className
      )}
      data-repeat-buyer="true"
      title="Repeat Customer"
    >
      <StarIcon className={sizeClasses.icon} />
      {showLabel && <span>Repeat Customer</span>}
    </span>
  )
}
