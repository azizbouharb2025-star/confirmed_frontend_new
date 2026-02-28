'use client'

import React from 'react'
import type { AIFeedback } from '@/types/feedback'
import { useLanguage } from '@/hooks/useLanguage'

/**
 * AIFeedbackCard Component
 * Displays AI-generated feedback with confidence score and reasoning
 * 
 * Requirements: 7.3, 7.4
 */

export interface AIFeedbackCardProps {
  feedback: AIFeedback
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
 * Get confidence score color based on value
 */
function getConfidenceColor(score: number): string {
  if (score >= 80) return 'text-green-600 dark:text-green-400'
  if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

/**
 * Get confidence score background color
 */
function getConfidenceBackground(score: number): string {
  if (score >= 80) return 'bg-green-100 dark:bg-green-900/30'
  if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/30'
  return 'bg-red-100 dark:bg-red-900/30'
}

/**
 * AI icon component
 */
function AIIcon() {
  return (
    <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
      <svg
        className="w-6 h-6 text-white"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
      </svg>
    </div>
  )
}

export default function AIFeedbackCard({ feedback }: AIFeedbackCardProps) {
  const { t } = useLanguage()

  return (
    <div
      className="bg-purple-50 dark:bg-purple-900/10 border-l-4 border-purple-500 rounded-lg p-4 space-y-3"
      data-testid="ai-feedback-card"
    >
      {/* Header: AI icon and confidence score */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <AIIcon />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {t('feedback.aiAnalysis')}
            </p>
            <p
              className="text-xs text-gray-500 dark:text-slate-400"
              data-testid="feedback-timestamp"
            >
              {formatTimestamp(feedback.timestamp)}
            </p>
          </div>
        </div>
        <div
          className={`px-3 py-1 rounded-full ${getConfidenceBackground(
            feedback.confidenceScore
          )}`}
          data-testid="confidence-score"
        >
          <span
            className={`text-sm font-semibold ${getConfidenceColor(
              feedback.confidenceScore
            )}`}
          >
            {feedback.confidenceScore}%
          </span>
        </div>
      </div>

      {/* Tags */}
      {feedback.tags.length > 0 && (
        <div className="flex flex-wrap gap-2" data-testid="feedback-tags">
          {feedback.tags.map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Reasoning */}
      {feedback.reasoning && (
        <div data-testid="feedback-reasoning">
          <p className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
            {t('feedback.reasoning')}:
          </p>
          <p className="text-sm text-gray-700 dark:text-slate-300">
            {feedback.reasoning}
          </p>
        </div>
      )}

      {/* Risk Factors */}
      {feedback.riskFactors.length > 0 && (
        <div data-testid="risk-factors">
          <p className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-2">
            {t('feedback.riskFactors')}:
          </p>
          <ul className="space-y-1">
            {feedback.riskFactors.map((factor, index) => (
              <li
                key={`${factor}-${index}`}
                className="text-sm text-gray-600 dark:text-slate-400 flex items-start gap-2"
              >
                <span className="text-purple-500 mt-1">•</span>
                <span>{factor}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
