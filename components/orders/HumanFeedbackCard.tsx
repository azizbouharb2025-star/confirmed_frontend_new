'use client'

import React from 'react'
import type { HumanFeedback } from '@/types/feedback'
import { useLanguage } from '@/hooks/useLanguage'

/**
 * HumanFeedbackCard Component
 * Displays human operator feedback with operator details
 * 
 * Requirements: 7.2, 7.4
 */

export interface HumanFeedbackCardProps {
  feedback: HumanFeedback
}

/**
 * Format timestamp for display
 */
function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Render star rating
 */
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" data-testid="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${
            star <= rating
              ? 'text-yellow-400 fill-current'
              : 'text-gray-300 dark:text-slate-600'
          }`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

/**
 * Operator avatar component
 */
function OperatorAvatar({ name, avatar }: { name: string; avatar?: string }) {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className="w-10 h-10 rounded-full object-cover"
      />
    )
  }

  // Generate initials from name
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm">
      {initials}
    </div>
  )
}

export default function HumanFeedbackCard({ feedback }: HumanFeedbackCardProps) {
  const { t } = useLanguage()

  return (
    <div
      className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 rounded-lg p-4 space-y-3"
      data-testid="human-feedback-card"
    >
      {/* Header: Operator info and rating */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <OperatorAvatar
            name={feedback.operatorName}
            avatar={feedback.operatorAvatar}
          />
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-semibold text-gray-900 dark:text-white truncate"
              data-testid="operator-name"
            >
              {feedback.operatorName}
            </p>
            <p
              className="text-xs text-gray-500 dark:text-slate-400"
              data-testid="feedback-timestamp"
            >
              {formatTimestamp(feedback.timestamp)}
            </p>
          </div>
        </div>
        <StarRating rating={feedback.rating} />
      </div>

      {/* Tags */}
      {feedback.tags.length > 0 && (
        <div className="flex flex-wrap gap-2" data-testid="feedback-tags">
          {feedback.tags.map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Notes */}
      {feedback.notes && (
        <div data-testid="feedback-notes">
          <p className="text-sm text-gray-700 dark:text-slate-300">
            {feedback.notes}
          </p>
        </div>
      )}
    </div>
  )
}
