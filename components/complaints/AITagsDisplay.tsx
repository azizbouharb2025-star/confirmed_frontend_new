'use client';

/**
 * AITagsDisplay Component
 * Displays AI-generated tags with confidence indicators
 *
 * Requirements: 3.3
 * - Display AI tags with confidence indicators
 * - Show primary category
 * - Highlight manual review flag
 */

import React from 'react';
import { clsx } from 'clsx';
import { AITag } from '@/types/complaint';

export interface AITagsDisplayProps {
  /** List of AI-generated tags */
  tags: AITag[];
  /** Primary category determined by AI */
  primaryCategory: string;
  /** Whether manual review is required */
  requiresManualReview: boolean;
  /** Optional className for styling */
  className?: string;
}

/**
 * Get confidence level label and color
 */
function getConfidenceDisplay(confidence: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (confidence >= 0.8) {
    return {
      label: 'High',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    };
  }
  if (confidence >= 0.5) {
    return {
      label: 'Medium',
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    };
  }
  return {
    label: 'Low',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  };
}

/**
 * Format confidence as percentage
 */
function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

/**
 * Warning icon for manual review
 */
function WarningIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

/**
 * AI icon
 */
function AIIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

/**
 * Confidence bar component
 */
function ConfidenceBar({ confidence }: { confidence: number }) {
  const { color } = getConfidenceDisplay(confidence);
  const percentage = Math.round(confidence * 100);

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-300',
            confidence >= 0.8
              ? 'bg-green-500'
              : confidence >= 0.5
              ? 'bg-yellow-500'
              : 'bg-red-500'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={clsx('text-xs font-medium', color)}>{percentage}%</span>
    </div>
  );
}

/**
 * Single tag component
 */
function TagItem({ tag }: { tag: AITag }) {
  const { bgColor, color } = getConfidenceDisplay(tag.confidence);

  return (
    <div
      className={clsx(
        'px-3 py-2 rounded-lg',
        'border border-gray-200 dark:border-slate-700',
        'bg-white dark:bg-slate-800'
      )}
      data-testid={`ai-tag-${tag.tag}`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {tag.tag}
        </span>
        <span
          className={clsx('text-xs px-1.5 py-0.5 rounded', bgColor, color)}
          title={`Confidence: ${formatConfidence(tag.confidence)}`}
        >
          {getConfidenceDisplay(tag.confidence).label}
        </span>
      </div>
      <ConfidenceBar confidence={tag.confidence} />
    </div>
  );
}

/**
 * AITagsDisplay - Displays AI analysis results
 *
 * Requirements:
 * - 3.3: Display AI-generated tags with confidence indicators
 */
export function AITagsDisplay({
  tags,
  primaryCategory,
  requiresManualReview,
  className,
}: AITagsDisplayProps): JSX.Element {
  return (
    <div className={clsx('space-y-4', className)} data-testid="ai-tags-display">
      {/* Manual Review Warning */}
      {requiresManualReview && (
        <div
          className={clsx(
            'flex items-center gap-2 px-3 py-2 rounded-lg',
            'bg-amber-50 dark:bg-amber-900/20',
            'border border-amber-200 dark:border-amber-800',
            'text-amber-700 dark:text-amber-400'
          )}
          data-testid="manual-review-warning"
        >
          <WarningIcon />
          <span className="text-sm font-medium">Manual review required</span>
        </div>
      )}

      {/* Primary Category */}
      <div
        className={clsx(
          'flex items-center gap-2 px-3 py-2 rounded-lg',
          'bg-[#ADFF2F]/10 dark:bg-[#ADFF2F]/5',
          'border border-[#ADFF2F]/30'
        )}
        data-testid="primary-category"
      >
        <AIIcon />
        <div>
          <span className="text-xs text-gray-500 dark:text-slate-400 block">
            Primary Category
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {primaryCategory}
          </span>
        </div>
      </div>

      {/* Tags List */}
      {tags.length > 0 ? (
        <div className="space-y-2" data-testid="ai-tags-list">
          <p className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wider">
            Detected Tags
          </p>
          <div className="grid gap-2">
            {tags.map((tag, index) => (
              <TagItem key={`${tag.tag}-${index}`} tag={tag} />
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-slate-400">
          No AI tags detected
        </p>
      )}
    </div>
  );
}

export default AITagsDisplay;
