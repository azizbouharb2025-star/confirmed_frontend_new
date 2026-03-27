'use client';

/**
 * AutomationRecommendationsWidget Component
 * Displays workflow optimization suggestions with impact levels
 * Requirements: 4.3
 */

import { CpuChipIcon, ArrowRightIcon, BoltIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import WidgetContainer from '../WidgetContainer';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKey } from '@/lib/i18n';

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: string;
}

export interface AutomationRecommendationsWidgetProps {
  /** Array of automation recommendations */
  recommendations: Recommendation[];
  /** Whether the widget is loading */
  isLoading?: boolean;
  /** Error message if data fetch failed */
  error?: string;
  /** Callback when retry is clicked */
  onRetry?: () => void;
  /** Callback when action button is clicked */
  onActionClick?: (recommendation: Recommendation) => void;
  /** Optional class name for styling */
  className?: string;
}

/**
 * Get impact badge styling
 */
function getImpactBadgeStyles(impact: 'high' | 'medium' | 'low'): {
  bgColor: string;
  textColor: string;
  icon: JSX.Element;
} {
  switch (impact) {
    case 'high':
      return {
        bgColor: 'bg-red-500/10',
        textColor: 'text-red-500',
        icon: <BoltIcon className="w-3 h-3" />,
      };
    case 'medium':
      return {
        bgColor: 'bg-yellow-500/10',
        textColor: 'text-yellow-500',
        icon: <ExclamationTriangleIcon className="w-3 h-3" />,
      };
    case 'low':
      return {
        bgColor: 'bg-blue-500/10',
        textColor: 'text-blue-500',
        icon: <InformationCircleIcon className="w-3 h-3" />,
      };
  }
}

/**
 * Impact badge component
 */
function ImpactBadge({ impact, t }: { impact: 'high' | 'medium' | 'low'; t: (key: TranslationKey) => string }): JSX.Element {
  const styles = getImpactBadgeStyles(impact);
  const labelKey = `widget.automationRecommendations.${impact}` as TranslationKey;
  return (
    <span 
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles.bgColor} ${styles.textColor}`}
      data-testid={`impact-badge-${impact}`}
    >
      {styles.icon}
      {t(labelKey)}
    </span>
  );
}


/**
 * Category badge component
 */
function CategoryBadge({ category }: { category: string }): JSX.Element {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700/50 text-slate-300 dark:bg-slate-700/50 dark:text-slate-300 light:bg-gray-200 light:text-gray-600">
      {category}
    </span>
  );
}

/**
 * Recommendation card component
 */
function RecommendationCard({ 
  recommendation, 
  onActionClick,
  t 
}: { 
  recommendation: Recommendation; 
  onActionClick?: (recommendation: Recommendation) => void;
  t: (key: TranslationKey) => string;
}): JSX.Element {
  return (
    <div 
      className="p-4 rounded-lg bg-slate-700/20 dark:bg-slate-700/20 light:bg-gray-50 border border-slate-700/30 dark:border-slate-700/30 light:border-gray-200 hover:border-purple-500/30 transition-colors"
      data-testid={`recommendation-card-${recommendation.id}`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h4 className="text-sm font-medium flex-1">{recommendation.title}</h4>
        <ImpactBadge impact={recommendation.impact} t={t} />
      </div>
      
      <p className="text-xs text-slate-400 dark:text-slate-400 light:text-gray-600 mb-3 line-clamp-2">
        {recommendation.description}
      </p>
      
      <div className="flex items-center justify-between">
        <CategoryBadge category={recommendation.category} />
        
        <button
          onClick={() => onActionClick?.(recommendation)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors"
          data-testid={`action-button-${recommendation.id}`}
        >
          {t('widget.automationRecommendations.apply')}
          <ArrowRightIcon className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

/**
 * Empty state when no recommendations are available
 */
function EmptyState({ t }: { t: (key: TranslationKey) => string }): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="mb-4 p-3 rounded-full bg-slate-500/10">
        <CpuChipIcon className="w-8 h-8 text-slate-400" />
      </div>
      <p className="text-sm text-slate-400 dark:text-slate-400 light:text-gray-600">
        {t('widget.automationRecommendations.empty')}
      </p>
      <p className="text-xs text-slate-500 mt-1">
        {t('widget.automationRecommendations.emptyHint')}
      </p>
    </div>
  );
}

/**
 * AutomationRecommendationsWidget - Displays workflow optimization suggestions
 * 
 * Shows:
 * - Recommendation cards with title and description
 * - Impact level badges (high/medium/low)
 * - Category badges
 * - Action buttons for each recommendation
 * 
 * Requirements: 4.3 - Display Automation Recommendations panel suggesting workflow optimizations
 */
export function AutomationRecommendationsWidget({
  recommendations = [],
  isLoading = false,
  error,
  onRetry,
  onActionClick,
  className = '',
}: AutomationRecommendationsWidgetProps): JSX.Element {
  const { t } = useLanguage();
  // Ensure recommendations is always an array
  const recommendationsList = Array.isArray(recommendations) ? recommendations : [];
  const hasData = recommendationsList.length > 0;

  // Sort recommendations by impact (high first)
  const sortedRecommendations = [...recommendationsList].sort((a, b) => {
    const impactOrder = { high: 0, medium: 1, low: 2 };
    return impactOrder[a.impact] - impactOrder[b.impact];
  });

  // Count by impact level
  const impactCounts = recommendationsList.reduce(
    (acc, rec) => {
      acc[rec.impact]++;
      return acc;
    },
    { high: 0, medium: 0, low: 0 }
  );

  return (
    <WidgetContainer
      title={t('widget.automationRecommendations')}
      icon={<CpuChipIcon className="w-5 h-5" />}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      className={className}
    >
      {!hasData ? (
        <EmptyState t={t} />
      ) : (
        <div className="space-y-4" data-testid="automation-recommendations-content">
          {/* Impact summary */}
          <div className="flex items-center gap-4 pb-3 border-b border-slate-700 dark:border-slate-700 light:border-gray-200">
            <span className="text-xs text-slate-400">
              {recommendations.length} {recommendations.length !== 1 ? t('widget.automationRecommendations.recommendations') : t('widget.automationRecommendations.recommendation')}
            </span>
            <div className="flex items-center gap-2">
              {impactCounts.high > 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-red-500">
                  <BoltIcon className="w-3 h-3" />
                  {impactCounts.high} {t('widget.automationRecommendations.high')}
                </span>
              )}
              {impactCounts.medium > 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-yellow-500">
                  <ExclamationTriangleIcon className="w-3 h-3" />
                  {impactCounts.medium} {t('widget.automationRecommendations.medium')}
                </span>
              )}
              {impactCounts.low > 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-blue-500">
                  <InformationCircleIcon className="w-3 h-3" />
                  {impactCounts.low} {t('widget.automationRecommendations.low')}
                </span>
              )}
            </div>
          </div>

          {/* Recommendation cards */}
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1" data-testid="recommendations-list">
            {sortedRecommendations.map((recommendation) => (
              <RecommendationCard
                key={recommendation.id}
                recommendation={recommendation}
                onActionClick={onActionClick}
                t={t}
              />
            ))}
          </div>
        </div>
      )}
    </WidgetContainer>
  );
}

export default AutomationRecommendationsWidget;
