/**
 * CallFeedbackForm Component
 * 
 * Form for collecting operator feedback during order confirmation calls.
 * Requirements: 5.5
 * 
 * Includes:
 * - Customer tone (positive, neutral, negative)
 * - Price sensitivity (low, medium, high)
 * - Quality concerns (boolean)
 * - Delivery issues (boolean)
 * - Confirmation strength (strong, moderate, weak)
 * - Risk tags (array of strings)
 * - Notes (free text)
 */

'use client'

import { ClockIcon, TagIcon, XMarkIcon } from '@heroicons/react/24/outline'
import type { CallFeedback } from '@/types/order'

interface CallFeedbackFormProps {
  feedback: CallFeedback
  onChange: (feedback: CallFeedback) => void
  disabled?: boolean
}

// Common risk tags that operators can select
const COMMON_RISK_TAGS = [
  'Price Negotiation',
  'Delivery Concerns',
  'Product Questions',
  'Hesitant Customer',
  'Wrong Address',
  'Payment Issues',
  'Repeat Caller',
  'Language Barrier',
]

export default function CallFeedbackForm({ feedback, onChange, disabled = false }: CallFeedbackFormProps) {
  const handleChange = <K extends keyof CallFeedback>(key: K, value: CallFeedback[K]) => {
    onChange({ ...feedback, [key]: value })
  }

  const toggleRiskTag = (tag: string) => {
    const currentTags = feedback.riskTags || []
    if (currentTags.includes(tag)) {
      handleChange('riskTags', currentTags.filter(t => t !== tag))
    } else {
      handleChange('riskTags', [...currentTags, tag])
    }
  }

  const removeRiskTag = (tag: string) => {
    handleChange('riskTags', (feedback.riskTags || []).filter(t => t !== tag))
  }

  return (
    <div className="card p-4">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <ClockIcon className="h-5 w-5" />
        Call Feedback
      </h3>
      
      {/* Main feedback fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Customer Tone */}
        <div>
          <label className="block text-sm font-medium mb-1">Customer Tone</label>
          <select
            value={feedback.customerTone}
            onChange={(e) => handleChange('customerTone', e.target.value as CallFeedback['customerTone'])}
            disabled={disabled}
            className="w-full p-2 rounded-lg border dark:bg-slate-900 dark:border-slate-700 light:bg-white light:border-gray-300 disabled:opacity-50"
          >
            <option value="positive">Positive</option>
            <option value="neutral">Neutral</option>
            <option value="negative">Negative</option>
          </select>
        </div>

        {/* Price Sensitivity */}
        <div>
          <label className="block text-sm font-medium mb-1">Price Sensitivity</label>
          <select
            value={feedback.priceSensitivity}
            onChange={(e) => handleChange('priceSensitivity', e.target.value as CallFeedback['priceSensitivity'])}
            disabled={disabled}
            className="w-full p-2 rounded-lg border dark:bg-slate-900 dark:border-slate-700 light:bg-white light:border-gray-300 disabled:opacity-50"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        {/* Confirmation Strength */}
        <div>
          <label className="block text-sm font-medium mb-1">Confirmation Strength</label>
          <select
            value={feedback.confirmationStrength}
            onChange={(e) => handleChange('confirmationStrength', e.target.value as CallFeedback['confirmationStrength'])}
            disabled={disabled}
            className="w-full p-2 rounded-lg border dark:bg-slate-900 dark:border-slate-700 light:bg-white light:border-gray-300 disabled:opacity-50"
          >
            <option value="strong">Strong</option>
            <option value="moderate">Moderate</option>
            <option value="weak">Weak</option>
          </select>
        </div>
      </div>

      {/* Checkboxes */}
      <div className="flex flex-wrap gap-4 mt-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={feedback.qualityConcerns}
            onChange={(e) => handleChange('qualityConcerns', e.target.checked)}
            disabled={disabled}
            className="rounded"
          />
          <span className="text-sm">Quality Concerns</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={feedback.deliveryIssues}
            onChange={(e) => handleChange('deliveryIssues', e.target.checked)}
            disabled={disabled}
            className="rounded"
          />
          <span className="text-sm">Delivery Issues</span>
        </label>
      </div>

      {/* Risk Tags */}
      <div className="mt-4">
        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
          <TagIcon className="h-4 w-4" />
          Risk Tags
        </label>
        
        {/* Selected tags */}
        {feedback.riskTags && feedback.riskTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {feedback.riskTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs"
              >
                {tag}
                {!disabled && (
                  <button
                    onClick={() => removeRiskTag(tag)}
                    className="hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
        )}
        
        {/* Available tags */}
        <div className="flex flex-wrap gap-2">
          {COMMON_RISK_TAGS.filter(tag => !feedback.riskTags?.includes(tag)).map((tag) => (
            <button
              key={tag}
              onClick={() => toggleRiskTag(tag)}
              disabled={disabled}
              className="px-2 py-1 text-xs border dark:border-slate-700 light:border-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              + {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="mt-4">
        <label className="block text-sm font-medium mb-2">Call Notes</label>
        <textarea
          value={feedback.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Add any additional notes about the call..."
          disabled={disabled}
          className="w-full p-3 rounded-lg border dark:bg-slate-900 dark:border-slate-700 light:bg-white light:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          rows={2}
        />
      </div>
    </div>
  )
}

/**
 * Create default call feedback object
 */
export function createDefaultFeedback(): CallFeedback {
  return {
    customerTone: 'neutral',
    priceSensitivity: 'medium',
    qualityConcerns: false,
    deliveryIssues: false,
    confirmationStrength: 'moderate',
    riskTags: [],
    notes: '',
  }
}

export { COMMON_RISK_TAGS }
