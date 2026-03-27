'use client';

/**
 * ActivityFeedWidget Component
 * Displays recent system events with type icons and timestamps
 * Requirements: 8.3
 */

import { 
  UserIcon, 
  ShoppingCartIcon, 
  CogIcon, 
  CreditCardIcon,
  ClockIcon 
} from '@heroicons/react/24/outline';
import WidgetContainer from '../WidgetContainer';
import { useLanguage } from '@/hooks/useLanguage';
import type { TranslationKey } from '@/lib/i18n';

export type ActivityType = 'user' | 'order' | 'system' | 'payment';

export interface Activity {
  id: string;
  type: ActivityType;
  action: string;
  detail: string;
  timestamp: string;
}

export interface ActivityFeedWidgetProps {
  /** Array of activity data */
  activities: Activity[];
  /** Maximum number of items to display */
  maxItems?: number;
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
 * Get icon based on activity type
 */
function getActivityIcon(type: ActivityType): JSX.Element {
  switch (type) {
    case 'user':
      return <UserIcon className="w-4 h-4" />;
    case 'order':
      return <ShoppingCartIcon className="w-4 h-4" />;
    case 'system':
      return <CogIcon className="w-4 h-4" />;
    case 'payment':
      return <CreditCardIcon className="w-4 h-4" />;
  }
}


/**
 * Get background color class based on activity type
 */
function getActivityBgColor(type: ActivityType): string {
  switch (type) {
    case 'user':
      return 'bg-blue-500/10 text-blue-500';
    case 'order':
      return 'bg-green-500/10 text-green-500';
    case 'system':
      return 'bg-purple-500/10 text-purple-500';
    case 'payment':
      return 'bg-yellow-500/10 text-yellow-500';
  }
}

/**
 * Format timestamp to relative time or formatted date
 */
function formatTimestamp(timestamp: string, t: (key: TranslationKey) => string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) return t('widget.activityFeed.justNow');
  if (diffMins < 60) return `${diffMins}${t('widget.time.mAgo')}`;
  if (diffHours < 24) return `${diffHours}${t('widget.time.hAgo')}`;
  if (diffDays < 7) return `${diffDays}${t('widget.time.dAgo')}`;
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Empty state when no data is available
 */
function EmptyState({ t }: { t: (key: TranslationKey) => string }): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="mb-4 p-3 rounded-full bg-slate-500/10">
        <ClockIcon className="w-8 h-8 text-slate-400" />
      </div>
      <p className="text-sm text-slate-400 dark:text-slate-400 light:text-gray-600">
        {t('widget.activityFeed.empty')}
      </p>
    </div>
  );
}

/**
 * ActivityFeedWidget - Displays recent system events
 * 
 * Shows:
 * - Event type icons (user, order, system, payment)
 * - Action and detail text
 * - Formatted timestamps
 * 
 * Requirements: 8.3 - Display recent activity feed showing system events
 */
export function ActivityFeedWidget({
  activities,
  maxItems = 10,
  isLoading = false,
  error,
  onRetry,
  className = '',
}: ActivityFeedWidgetProps): JSX.Element {
  const hasData = activities.length > 0;
  const displayedActivities = activities.slice(0, maxItems);
  const { t } = useLanguage();

  return (
    <WidgetContainer
      title={t('widget.activityFeed')}
      icon={<ClockIcon className="w-5 h-5" />}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      className={className}
    >
      {!hasData ? (
        <EmptyState t={t} />
      ) : (
        <div className="space-y-3" data-testid="activity-feed-content">
          {displayedActivities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-700/20 dark:hover:bg-slate-700/20 light:hover:bg-gray-50 transition-colors"
              data-testid={`activity-${activity.id}`}
            >
              {/* Activity type icon */}
              <div className={`p-2 rounded-lg ${getActivityBgColor(activity.type)}`}>
                {getActivityIcon(activity.type)}
              </div>
              
              {/* Activity content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{activity.action}</p>
                <p className="text-xs text-slate-400 truncate">{activity.detail}</p>
              </div>
              
              {/* Timestamp */}
              <div className="text-xs text-slate-500 whitespace-nowrap">
                {formatTimestamp(activity.timestamp, t)}
              </div>
            </div>
          ))}
          
          {/* Show more indicator if there are more activities */}
          {activities.length > maxItems && (
            <div className="text-center pt-2 border-t border-slate-700 dark:border-slate-700 light:border-gray-200">
              <p className="text-xs text-slate-400">
                +{activities.length - maxItems} {t('widget.activityFeed.moreEvents')}
              </p>
            </div>
          )}
        </div>
      )}
    </WidgetContainer>
  );
}

export default ActivityFeedWidget;
