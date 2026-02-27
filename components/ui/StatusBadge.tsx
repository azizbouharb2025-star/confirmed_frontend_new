'use client'

import React from 'react'
import { clsx } from 'clsx'
import type { OrderStatus } from '@/types/order'
import { useLanguage } from '@/hooks/useLanguage'
import type { TranslationKey } from '@/lib/i18n'

/**
 * StatusBadge Component
 * Displays color-coded status badges for orders
 * 
 * Feature: order-management-system, Property 16: Status badge color mapping
 * Validates: Requirements 8.1
 */

export interface StatusBadgeProps {
  status: OrderStatus
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Color mapping for order statuses
 * - confirmed: green
 * - rejected: red
 * - pending: yellow
 * - in_progress: blue
 * - assigned: purple
 * - cancelled: gray
 */
export const STATUS_COLORS: Record<OrderStatus, { bg: string; text: string; border: string }> = {
  confirmed: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-800 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
  },
  rejected: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-800 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
  },
  pending: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-800 dark:text-yellow-300',
    border: 'border-yellow-200 dark:border-yellow-800',
  },
  in_progress: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-800 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
  },
  assigned: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-800 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
  },
  cancelled: {
    bg: 'bg-gray-100 dark:bg-gray-900/30',
    text: 'text-gray-800 dark:text-gray-300',
    border: 'border-gray-200 dark:border-gray-800',
  },
  shipped: {
    bg: 'bg-indigo-100 dark:bg-indigo-900/30',
    text: 'text-indigo-800 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800',
  },
  delivered: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-800 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  failed_delivery: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-800 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-800',
  },
}


/**
 * Icon components for each status
 */
const StatusIcons: Record<OrderStatus, React.ReactNode> = {
  confirmed: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  rejected: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  pending: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  in_progress: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  assigned: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  cancelled: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
  ),
  shipped: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    </svg>
  ),
  delivered: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  failed_delivery: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
}

/**
 * Display labels for each status
 */
export const STATUS_LABELS: Record<OrderStatus, string> = {
  confirmed: 'Confirmed',
  rejected: 'Rejected',
  pending: 'Pending',
  in_progress: 'In Progress',
  assigned: 'Assigned',
  cancelled: 'Cancelled',
  shipped: 'Shipped',
  delivered: 'Delivered',
  failed_delivery: 'Failed Delivery',
}

/**
 * Get translated status labels
 */
export function getTranslatedStatusLabels(t: (key: TranslationKey) => string): Record<OrderStatus, string> {
  return {
    confirmed: t('status.confirmed'),
    rejected: t('status.rejected'),
    pending: t('status.pending'),
    in_progress: t('status.inProgress'),
    assigned: t('status.assigned'),
    cancelled: t('status.cancelled'),
    shipped: 'Shipped',
    delivered: 'Delivered',
    failed_delivery: 'Failed Delivery',
  }
}

/**
 * Size variants for the badge
 */
const SIZE_CLASSES = {
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-2.5 py-1 text-sm gap-1.5',
  lg: 'px-3 py-1.5 text-base gap-2',
}

/**
 * Get the color class for a given status
 * Exported for use in property tests
 */
export function getStatusColor(status: OrderStatus): string {
  const colors = STATUS_COLORS[status]
  return `${colors.bg} ${colors.text} ${colors.border}`
}

/**
 * Get the expected color category for a status
 * Used for property testing validation
 */
export function getStatusColorCategory(status: OrderStatus): 'green' | 'red' | 'yellow' | 'blue' | 'purple' | 'gray' | 'indigo' | 'emerald' | 'orange' {
  const colorMap: Record<OrderStatus, 'green' | 'red' | 'yellow' | 'blue' | 'purple' | 'gray' | 'indigo' | 'emerald' | 'orange'> = {
    confirmed: 'green',
    rejected: 'red',
    pending: 'yellow',
    in_progress: 'blue',
    assigned: 'purple',
    cancelled: 'gray',
    shipped: 'indigo',
    delivered: 'emerald',
    failed_delivery: 'orange',
  }
  return colorMap[status]
}

export default function StatusBadge({ status, size = 'md', className }: StatusBadgeProps) {
  const colors = STATUS_COLORS[status]
  const { t } = useLanguage()
  const translatedLabels = getTranslatedStatusLabels(t)
  
  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full border',
        colors.bg,
        colors.text,
        colors.border,
        SIZE_CLASSES[size],
        className
      )}
      data-status={status}
      data-color={getStatusColorCategory(status)}
    >
      {StatusIcons[status]}
      {translatedLabels[status]}
    </span>
  )
}
