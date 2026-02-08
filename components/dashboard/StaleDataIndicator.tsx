'use client';

/**
 * StaleDataIndicator Component
 * Shows refresh indicator when data is stale (> 5 minutes old)
 * Requirements: 6.3
 */

import { ArrowPathIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';

export interface StaleDataIndicatorProps {
  /** Whether data is currently stale */
  isStale: boolean;
  /** Timestamp of last data update */
  lastUpdated: Date | null;
  /** Whether auto-refresh is enabled */
  autoRefresh: boolean;
  /** Callback to toggle auto-refresh */
  onAutoRefreshToggle: (enabled: boolean) => void;
  /** Callback to manually refresh data */
  onRefresh: () => void;
  /** Whether a refresh is currently in progress */
  isRefreshing?: boolean;
}

/**
 * Format time ago string from a date
 */
function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 60) {
    return 'just now';
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * StaleDataIndicator - Shows when dashboard data needs refreshing
 * 
 * Features:
 * - Shows warning when data is stale (> 5 minutes old)
 * - Displays time since last update
 * - Provides auto-refresh toggle
 * - Manual refresh button
 * 
 * Requirements: 6.3 - Display refresh indicator when data > 5 minutes old
 */
export default function StaleDataIndicator({
  isStale,
  lastUpdated,
  autoRefresh,
  onAutoRefreshToggle,
  onRefresh,
  isRefreshing = false,
}: StaleDataIndicatorProps): JSX.Element | null {
  const [timeAgo, setTimeAgo] = useState<string>('');

  // Update time ago display every 30 seconds
  useEffect(() => {
    if (!lastUpdated) return;

    const updateTimeAgo = () => {
      setTimeAgo(formatTimeAgo(lastUpdated));
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 30000);

    return () => clearInterval(interval);
  }, [lastUpdated]);

  // Don't show if no last updated time
  if (!lastUpdated) {
    return null;
  }

  return (
    <div
      className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
        isStale
          ? 'bg-yellow-500/10 border border-yellow-500/20'
          : 'bg-slate-800/50 border border-slate-700/50'
      }`}
      data-testid="stale-data-indicator"
    >
      {/* Last updated info */}
      <div className="flex items-center gap-2 text-sm">
        <ClockIcon
          className={`w-4 h-4 ${isStale ? 'text-yellow-500' : 'text-slate-400'}`}
        />
        <span className={isStale ? 'text-yellow-500' : 'text-slate-400'}>
          Updated {timeAgo}
        </span>
        {isStale && (
          <span className="text-yellow-500 font-medium">(stale)</span>
        )}
      </div>

      {/* Divider */}
      <div className="h-4 w-px bg-slate-600" />

      {/* Auto-refresh toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <span className="text-sm text-slate-400">Auto-refresh</span>
        <button
          type="button"
          role="switch"
          aria-checked={autoRefresh}
          onClick={() => onAutoRefreshToggle(!autoRefresh)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            autoRefresh ? 'bg-blue-500' : 'bg-slate-600'
          }`}
          data-testid="auto-refresh-toggle"
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
              autoRefresh ? 'translate-x-4.5' : 'translate-x-1'
            }`}
            style={{ transform: autoRefresh ? 'translateX(18px)' : 'translateX(4px)' }}
          />
        </button>
      </label>

      {/* Manual refresh button */}
      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        className={`flex items-center gap-1.5 px-3 py-1 text-sm rounded-md transition-colors ${
          isStale
            ? 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30'
            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        data-testid="manual-refresh-button"
      >
        <ArrowPathIcon
          className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
        />
        {isRefreshing ? 'Refreshing...' : 'Refresh'}
      </button>
    </div>
  );
}

export { StaleDataIndicator };
