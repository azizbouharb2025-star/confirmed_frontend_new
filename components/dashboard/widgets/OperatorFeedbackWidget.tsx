'use client';

/**
 * OperatorFeedbackWidget Component
 * Displays aggregated operator feedback metrics
 * Requirements: 2.3
 */

import { ChatBubbleLeftRightIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import WidgetContainer from '../WidgetContainer';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKey } from '@/lib/i18n';

export interface FeedbackTag {
  tag: string;
  count: number;
}

export interface OperatorFeedbackWidgetProps {
  /** Average rating (0-5 scale) */
  averageRating: number;
  /** Total number of feedback submissions */
  totalFeedback: number;
  /** Top feedback tags with counts */
  topTags: FeedbackTag[];
  /** Whether the widget is loading */
  isLoading?: boolean;
  /** Error message if data fetch failed */
  error?: string;
  /** Callback when retry is clicked */
  onRetry?: () => void;
  /** Optional class name for styling */
  className?: string;
}

/**
 * Render star rating display
 * Shows filled stars for rating and empty stars for remainder
 */
function StarRating({ rating, maxStars = 5 }: { rating: number; maxStars?: number }): JSX.Element {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = maxStars - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5" data-testid="star-rating">
      {/* Full stars */}
      {Array.from({ length: fullStars }).map((_, i) => (
        <StarIconSolid key={`full-${i}`} className="w-5 h-5 text-yellow-400" />
      ))}
      
      {/* Half star */}
      {hasHalfStar && (
        <div className="relative">
          <StarIcon className="w-5 h-5 text-slate-600" />
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <StarIconSolid className="w-5 h-5 text-yellow-400" />
          </div>
        </div>
      )}
      
      {/* Empty stars */}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <StarIcon key={`empty-${i}`} className="w-5 h-5 text-slate-600 dark:text-slate-600 light:text-gray-300" />
      ))}
    </div>
  );
}


/**
 * Get color class for feedback tag based on count
 */
function getTagColorClass(count: number, maxCount: number): string {
  const ratio = maxCount > 0 ? count / maxCount : 0;
  
  if (ratio >= 0.7) {
    return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  } else if (ratio >= 0.4) {
    return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
  }
  return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
}

/**
 * Empty state when no feedback data is available
 */
function EmptyState({ t }: { t: (key: TranslationKey) => string }): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="mb-4 p-3 rounded-full bg-slate-500/10">
        <ChatBubbleLeftRightIcon className="w-8 h-8 text-slate-400" />
      </div>
      <p className="text-sm text-slate-400 dark:text-slate-400 light:text-gray-600">
        {t('widget.operatorFeedback.empty')}
      </p>
    </div>
  );
}

/**
 * OperatorFeedbackWidget - Displays aggregated operator feedback metrics
 * 
 * Shows:
 * - Average rating with star display
 * - Total feedback count
 * - Top feedback tags as badges
 * 
 * Requirements: 2.3 - Display Operator Feedback Metrics widget showing 
 * average ratings and common feedback tags
 */
export function OperatorFeedbackWidget({
  averageRating = 0,
  totalFeedback = 0,
  topTags = [],
  isLoading = false,
  error,
  onRetry,
  className = '',
}: OperatorFeedbackWidgetProps): JSX.Element {
  const { t } = useLanguage();
  const hasData = totalFeedback > 0;
  const maxTagCount = topTags.length > 0 ? Math.max(...topTags.map(t => t.count)) : 0;

  return (
    <WidgetContainer
      title={t('widget.operatorFeedback')}
      icon={<ChatBubbleLeftRightIcon className="w-5 h-5" />}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      className={className}
    >
      {!hasData ? (
        <EmptyState t={t} />
      ) : (
        <div className="space-y-4" data-testid="operator-feedback-content">
          {/* Rating section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StarRating rating={averageRating} />
              <span className="text-2xl font-semibold">
                {averageRating.toFixed(1)}
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-400 dark:text-slate-400 light:text-gray-600">
                {t('widget.operatorFeedback.totalFeedback')}
              </p>
              <p className="text-lg font-semibold">{totalFeedback.toLocaleString()}</p>
            </div>
          </div>

          {/* Tags section */}
          {topTags.length > 0 && (
            <div className="pt-4 border-t border-slate-700 dark:border-slate-700 light:border-gray-200">
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-gray-600 mb-3">
                {t('widget.operatorFeedback.topTags')}
              </p>
              <div className="flex flex-wrap gap-2" data-testid="feedback-tags">
                {topTags.map((tagData, index) => (
                  <span
                    key={`${tagData.tag}-${index}`}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getTagColorClass(tagData.count, maxTagCount)}`}
                  >
                    {tagData.tag}
                    <span className="opacity-70">({tagData.count})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Rating breakdown hint */}
          <div className="pt-3 border-t border-slate-700 dark:border-slate-700 light:border-gray-200">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{t('widget.operatorFeedback.basedOn')}</span>
              <span className="flex items-center gap-1">
                <StarIconSolid className="w-3 h-3 text-yellow-400" />
                5.0 {t('widget.operatorFeedback.max')}
              </span>
            </div>
          </div>
        </div>
      )}
    </WidgetContainer>
  );
}

export default OperatorFeedbackWidget;
