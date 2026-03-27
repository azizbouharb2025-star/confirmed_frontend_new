'use client';

/**
 * RewardsWalletWidget Component
 * Displays accumulated rewards for operators
 * Requirements: 7.3
 */

import { WalletIcon, ClockIcon, CheckCircleIcon, GiftIcon } from '@heroicons/react/24/outline';
import WidgetContainer from '../WidgetContainer';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKey } from '@/lib/i18n';

/**
 * Recent reward entry
 */
export interface RewardEntry {
  id: string;
  amount: number;
  reason: string;
  date: string;
}

export interface RewardsWalletWidgetProps {
  /** Current balance */
  balance: number;
  /** Pending rewards amount */
  pendingRewards: number;
  /** List of recent rewards */
  recentRewards: RewardEntry[];
  /** Currency symbol */
  currency?: string;
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
 * Format currency value
 */
function formatCurrency(amount: number, currency: string = 'TND '): string {
  return `${currency}${amount.toFixed(2)}`;
}

/**
 * Format date to relative or short format
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins}m`;
  } else if (diffHours < 24) {
    return `${diffHours}h`;
  } else if (diffDays < 7) {
    return `${diffDays}d`;
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Balance display component
 */
function BalanceDisplay({ 
  balance, 
  pendingRewards, 
  currency,
  t 
}: { 
  balance: number; 
  pendingRewards: number; 
  currency: string;
  t: (key: TranslationKey) => string;
}): JSX.Element {
  return (
    <div className="mb-4">
      {/* Main balance */}
      <div className="text-center p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
        <p className="text-xs text-slate-400 dark:text-slate-400 light:text-gray-500 mb-1">
          {t('widget.rewardsWallet.availableBalance')}
        </p>
        <p className="text-3xl font-bold text-green-500" data-testid="wallet-balance">
          {formatCurrency(balance, currency)}
        </p>
      </div>
      
      {/* Pending rewards */}
      {pendingRewards > 0 && (
        <div className="flex items-center justify-center gap-2 mt-3 text-sm">
          <ClockIcon className="w-4 h-4 text-amber-500" />
          <span className="text-slate-400 dark:text-slate-400 light:text-gray-500">
            {t('widget.rewardsWallet.pending')}:
          </span>
          <span className="font-medium text-amber-500" data-testid="pending-rewards">
            {formatCurrency(pendingRewards, currency)}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Single reward entry row
 */
function RewardRow({ reward, currency }: { reward: RewardEntry; currency: string }): JSX.Element {
  return (
    <div 
      className="flex items-center gap-3 py-2 border-b border-slate-700/50 dark:border-slate-700/50 light:border-gray-100 last:border-0"
      data-testid="reward-row"
    >
      <div className="flex-shrink-0 p-2 rounded-full bg-green-500/10">
        <CheckCircleIcon className="w-4 h-4 text-green-500" />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{reward.reason}</p>
        <p className="text-xs text-slate-400 dark:text-slate-400 light:text-gray-500">
          {formatDate(reward.date)}
        </p>
      </div>
      
      <div className="text-right">
        <span className="font-medium text-green-500">
          +{formatCurrency(reward.amount, currency)}
        </span>
      </div>
    </div>
  );
}

/**
 * Empty state when no rewards
 */
function EmptyState({ t }: { t: (key: TranslationKey) => string }): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <div className="mb-3 p-3 rounded-full bg-slate-500/10">
        <GiftIcon className="w-6 h-6 text-slate-400" />
      </div>
      <p className="text-sm text-slate-400 dark:text-slate-400 light:text-gray-600">
        {t('widget.rewardsWallet.noRewards')}
      </p>
      <p className="text-xs text-slate-500 mt-1">
        {t('widget.rewardsWallet.noRewardsHint')}
      </p>
    </div>
  );
}

/**
 * RewardsWalletWidget - Displays operator rewards wallet
 * 
 * Features:
 * - Current balance display
 * - Pending rewards indicator
 * - Recent reward history
 * 
 * Requirements: 7.3 - Display rewards wallet with balance and history
 */
export function RewardsWalletWidget({
  balance,
  pendingRewards,
  recentRewards,
  currency = 'TND ',
  isLoading = false,
  error,
  onRetry,
  className = '',
}: RewardsWalletWidgetProps): JSX.Element {
  const { t } = useLanguage();
  return (
    <WidgetContainer
      title={t('widget.rewardsWallet')}
      icon={<WalletIcon className="w-5 h-5" />}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      className={className}
    >
      <BalanceDisplay 
        balance={balance} 
        pendingRewards={pendingRewards} 
        currency={currency}
        t={t} 
      />
      
      {/* Recent rewards section */}
      <div>
        <h4 className="text-xs font-medium text-slate-400 dark:text-slate-400 light:text-gray-500 mb-2">
          {t('widget.rewardsWallet.recentRewards')}
        </h4>
        
        {!recentRewards || recentRewards.length === 0 ? (
          <EmptyState t={t} />
        ) : (
          <div className="space-y-1" data-testid="rewards-list">
            {recentRewards.slice(0, 5).map((reward) => (
              <RewardRow key={reward.id} reward={reward} currency={currency} />
            ))}
          </div>
        )}
      </div>
    </WidgetContainer>
  );
}

export default RewardsWalletWidget;
