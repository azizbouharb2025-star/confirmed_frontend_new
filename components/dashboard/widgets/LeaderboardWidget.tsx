'use client';

/**
 * LeaderboardWidget Component
 * Displays ranked operator list with performance metrics
 * Requirements: 7.4
 */

import { UserGroupIcon, TrophyIcon, StarIcon } from '@heroicons/react/24/outline';
import WidgetContainer from '../WidgetContainer';
import { useLanguage } from '@/hooks/useLanguage';
import type { TranslationKey } from '@/lib/i18n';

/**
 * Operator entry in the leaderboard
 */
export interface LeaderboardEntry {
  id: string;
  name: string;
  avatar?: string;
  confirmationRate: number;
  totalCalls: number;
  rank: number;
}

export interface LeaderboardWidgetProps {
  /** List of operators to display */
  operators: LeaderboardEntry[];
  /** ID of the current user to highlight */
  currentUserId: string;
  /** Whether the widget is loading */
  isLoading?: boolean;
  /** Error message */
  error?: string;
  /** Retry callback */
  onRetry?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Sort operators by rank in ascending order
 * Property 8: Leaderboard shows operators in rank order
 * For any leaderboard data, operators SHALL be displayed in ascending rank order (1st, 2nd, 3rd, etc.).
 * 
 * @param operators - Array of leaderboard entries
 * @returns Sorted array by rank in ascending order
 */
export function sortByRank(operators: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...operators].sort((a, b) => a.rank - b.rank);
}

/**
 * Check if operators are in correct rank order
 * 
 * @param operators - Array of leaderboard entries
 * @returns true if operators are sorted by rank in ascending order
 */
export function isInRankOrder(operators: LeaderboardEntry[]): boolean {
  for (let i = 1; i < operators.length; i++) {
    if (operators[i].rank < operators[i - 1].rank) {
      return false;
    }
  }
  return true;
}

/**
 * Get rank badge styling based on position
 */
function getRankBadge(rank: number): { bg: string; text: string; icon?: JSX.Element } {
  switch (rank) {
    case 1:
      return { 
        bg: 'bg-amber-500/20', 
        text: 'text-amber-500',
        icon: <TrophyIcon className="w-4 h-4" />
      };
    case 2:
      return { 
        bg: 'bg-slate-400/20', 
        text: 'text-slate-300',
        icon: <StarIcon className="w-4 h-4" />
      };
    case 3:
      return { 
        bg: 'bg-orange-600/20', 
        text: 'text-orange-500',
        icon: <StarIcon className="w-4 h-4" />
      };
    default:
      return { 
        bg: 'bg-slate-700/50', 
        text: 'text-slate-400' 
      };
  }
}

/**
 * Get initials from name for avatar fallback
 */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Single operator row component
 */
function OperatorRow({ 
  operator, 
  isCurrentUser,
  t,
}: { 
  operator: LeaderboardEntry; 
  isCurrentUser: boolean;
  t: (key: TranslationKey) => string;
}): JSX.Element {
  const rankBadge = getRankBadge(operator.rank);
  
  return (
    <div 
      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
        isCurrentUser 
          ? 'bg-blue-500/10 border border-blue-500/30' 
          : 'hover:bg-slate-800/50 dark:hover:bg-slate-800/50 light:hover:bg-gray-50'
      }`}
      data-testid="leaderboard-row"
      data-current-user={isCurrentUser}
    >
      {/* Rank badge */}
      <div 
        className={`flex items-center justify-center w-8 h-8 rounded-full ${rankBadge.bg} ${rankBadge.text}`}
        data-testid="rank-badge"
      >
        {rankBadge.icon || <span className="text-sm font-bold">{operator.rank}</span>}
      </div>
      
      {/* Avatar */}
      <div className="flex-shrink-0">
        {operator.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={operator.avatar} 
            alt={operator.name}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-slate-700 dark:bg-slate-700 light:bg-gray-200 flex items-center justify-center">
            <span className="text-sm font-medium text-slate-300 dark:text-slate-300 light:text-gray-600">
              {getInitials(operator.name)}
            </span>
          </div>
        )}
      </div>
      
      {/* Name and stats */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{operator.name}</span>
          {isCurrentUser && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
              {t('widget.leaderboard.you')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-400 light:text-gray-500">
          <span>{operator.totalCalls} {t('widget.leaderboard.calls')}</span>
        </div>
      </div>
      
      {/* Confirmation rate */}
      <div className="text-right">
        <div className="font-semibold text-green-500" data-testid="confirmation-rate">
          {operator.confirmationRate.toFixed(1)}%
        </div>
        <div className="text-xs text-slate-400 dark:text-slate-400 light:text-gray-500">
          {t('widget.leaderboard.rate')}
        </div>
      </div>
    </div>
  );
}

/**
 * Empty state when no operators available
 */
function EmptyState({ t }: { t: (key: TranslationKey) => string }): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="mb-4 p-3 rounded-full bg-slate-500/10">
        <UserGroupIcon className="w-8 h-8 text-slate-400" />
      </div>
      <p className="text-sm text-slate-400 dark:text-slate-400 light:text-gray-600">
        {t('widget.leaderboard.empty')}
      </p>
      <p className="text-xs text-slate-500 mt-1">
        {t('widget.leaderboard.emptyHint')}
      </p>
    </div>
  );
}

/**
 * LeaderboardWidget - Displays ranked operator list
 * 
 * Features:
 * - Ranked operator list sorted by rank
 * - Current user highlighting
 * - Confirmation rate and total calls display
 * - Top 3 special badges
 * 
 * Requirements: 7.4 - Display leaderboard widget showing top performers
 */
export function LeaderboardWidget({
  operators,
  currentUserId,
  isLoading = false,
  error,
  onRetry,
  className = '',
}: LeaderboardWidgetProps): JSX.Element {
  // Sort operators by rank (ascending order)
  const sortedOperators = sortByRank(operators);
  const { t } = useLanguage();

  return (
    <WidgetContainer
      title={t('widget.leaderboard')}
      icon={<TrophyIcon className="w-5 h-5" />}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      className={className}
    >
      {sortedOperators.length === 0 ? (
        <EmptyState t={t} />
      ) : (
        <div className="space-y-2" data-testid="leaderboard-list">
          {sortedOperators.map((operator) => (
            <OperatorRow
              key={operator.id}
              operator={operator}
              isCurrentUser={operator.id === currentUserId}
              t={t}
            />
          ))}
        </div>
      )}
    </WidgetContainer>
  );
}

export default LeaderboardWidget;
