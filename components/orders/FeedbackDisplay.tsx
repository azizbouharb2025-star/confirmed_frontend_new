'use client'

import React, { useState, useEffect } from 'react'
import type { HumanFeedback, AIFeedback } from '@/types/feedback'
import HumanFeedbackCard from './HumanFeedbackCard'
import AIFeedbackCard from './AIFeedbackCard'
import { useLanguage } from '@/hooks/useLanguage'

/**
 * FeedbackDisplay Component
 * Displays human and AI feedback with clear visual separation
 * 
 * Requirements: 7.1, 7.4, 7.5, 7.6
 */

export interface FeedbackDisplayProps {
  orderId: string
  humanFeedback?: HumanFeedback[]
  aiFeedback?: AIFeedback[]
  showSource?: 'all' | 'human' | 'ai'
}

export default function FeedbackDisplay({
  orderId,
  humanFeedback: initialHumanFeedback,
  aiFeedback: initialAIFeedback,
  showSource = 'all',
}: FeedbackDisplayProps) {
  const { t } = useLanguage()
  const [humanFeedback, setHumanFeedback] = useState<HumanFeedback[]>(initialHumanFeedback || [])
  const [aiFeedback, setAIFeedback] = useState<AIFeedback[]>(initialAIFeedback || [])
  const [loading, setLoading] = useState(!initialHumanFeedback && !initialAIFeedback)
  const [error, setError] = useState<string | null>(null)
  const [filterSource, setFilterSource] = useState<'all' | 'human' | 'ai'>(showSource)

  // Fetch feedback if not provided as props
  useEffect(() => {
    if (!initialHumanFeedback && !initialAIFeedback) {
      fetchFeedback()
    }
  }, [orderId])

  const fetchFeedback = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/feedback/${orderId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch feedback')
      }

      const data = await response.json()
      setHumanFeedback(data.humanFeedback || [])
      setAIFeedback(data.aiFeedback || [])
    } catch (err) {
      console.error('Error fetching feedback:', err)
      setError('Failed to load feedback')
    } finally {
      setLoading(false)
    }
  }

  // Filter feedback based on selected source
  const displayHumanFeedback = filterSource === 'all' || filterSource === 'human'
  const displayAIFeedback = filterSource === 'all' || filterSource === 'ai'

  if (loading) {
    return (
      <div className="py-4" data-testid="feedback-loading">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 dark:bg-slate-700 rounded-lg" />
          <div className="h-32 bg-gray-200 dark:bg-slate-700 rounded-lg" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-4" data-testid="feedback-error">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={fetchFeedback}
            className="mt-2 text-sm text-red-600 dark:text-red-400 underline hover:no-underline"
          >
            {t('common.retry')}
          </button>
        </div>
      </div>
    )
  }

  const hasHumanFeedback = humanFeedback.length > 0
  const hasAIFeedback = aiFeedback.length > 0
  const hasAnyFeedback = hasHumanFeedback || hasAIFeedback

  if (!hasAnyFeedback) {
    return (
      <div className="py-4" data-testid="feedback-empty">
        <p className="text-sm text-gray-500 dark:text-slate-400">
          {t('orderDetail.noFeedback')}
        </p>
      </div>
    )
  }

  return (
    <div className="py-4 space-y-4" data-testid="feedback-display">
      {/* Filter buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilterSource('all')}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${
            filterSource === 'all'
              ? 'bg-[#ADFF2F] text-gray-900 font-medium'
              : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
          }`}
          data-testid="filter-all"
        >
          {t('feedback.all')}
        </button>
        <button
          onClick={() => setFilterSource('human')}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${
            filterSource === 'human'
              ? 'bg-blue-500 text-white font-medium'
              : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
          }`}
          data-testid="filter-human"
        >
          {t('feedback.human')} ({humanFeedback.length})
        </button>
        <button
          onClick={() => setFilterSource('ai')}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${
            filterSource === 'ai'
              ? 'bg-purple-500 text-white font-medium'
              : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
          }`}
          data-testid="filter-ai"
        >
          {t('feedback.ai')} ({aiFeedback.length})
        </button>
      </div>

      {/* Human Feedback Section */}
      {displayHumanFeedback && hasHumanFeedback && (
        <div className="space-y-3" data-testid="human-feedback-section">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            {t('feedback.humanFeedback')}
          </h4>
          {humanFeedback.map((feedback) => (
            <HumanFeedbackCard key={feedback._id} feedback={feedback} />
          ))}
        </div>
      )}

      {/* AI Feedback Section */}
      {displayAIFeedback && hasAIFeedback && (
        <div className="space-y-3" data-testid="ai-feedback-section">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            {t('feedback.aiFeedback')}
          </h4>
          {aiFeedback.map((feedback) => (
            <AIFeedbackCard key={feedback._id} feedback={feedback} />
          ))}
        </div>
      )}
    </div>
  )
}
