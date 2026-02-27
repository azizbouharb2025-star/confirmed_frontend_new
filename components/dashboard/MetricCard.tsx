'use client';

/**
 * MetricCard (KPICard) Component
 * Metric display card with animated counters and trend indicators
 * Requirements: 1.1, 7.1, 8.1, 6.4
 */

import CountUp from 'react-countup';
import { ReactNode, useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, MinusIcon } from '@heroicons/react/24/solid';
import { useLanguage } from '@/hooks/useLanguage';

export interface MetricCardProps {
  /** Card title/label */
  title: string;
  /** Current metric value */
  value: number;
  /** Previous value for comparison (used to calculate change if change not provided) */
  previousValue?: number;
  /** Percentage change from previous period */
  change?: number;
  /** Icon to display */
  icon: ReactNode;
  /** Prefix for the value (e.g., '$') */
  prefix?: string;
  /** Suffix for the value (e.g., '%') */
  suffix?: string;
  /** Number of decimal places */
  decimals?: number;
  /** Trend direction override */
  trend?: 'up' | 'down' | 'neutral';
  /** Trend value to display */
  trendValue?: number;
  /** Whether the card is in loading state */
  isLoading?: boolean;
}

/**
 * Loading skeleton for MetricCard
 * Requirements: 1.3 - Display animated skeleton placeholders
 */
function LoadingSkeleton(): JSX.Element {
  return (
    <div className="card p-6 animate-pulse" data-testid="metric-card-skeleton">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 bg-slate-700 dark:bg-slate-700 light:bg-gray-200 rounded w-24" />
        <div className="h-6 w-6 bg-slate-700 dark:bg-slate-700 light:bg-gray-200 rounded" />
      </div>
      <div className="space-y-2">
        <div className="h-8 bg-slate-700 dark:bg-slate-700 light:bg-gray-200 rounded w-20" />
        <div className="h-4 bg-slate-700 dark:bg-slate-700 light:bg-gray-200 rounded w-32" />
      </div>
    </div>
  );
}

/**
 * Trend indicator component showing up/down/neutral with color coding
 */
function TrendIndicator({ 
  trend, 
  value 
}: { 
  trend: 'up' | 'down' | 'neutral'; 
  value: number;
}): JSX.Element {
  const trendConfig = {
    up: {
      icon: ArrowTrendingUpIcon,
      colorClass: 'text-green-500',
      bgClass: 'bg-green-500/10',
    },
    down: {
      icon: ArrowTrendingDownIcon,
      colorClass: 'text-red-500',
      bgClass: 'bg-red-500/10',
    },
    neutral: {
      icon: MinusIcon,
      colorClass: 'text-slate-400',
      bgClass: 'bg-slate-500/10',
    },
  };

  const config = trendConfig[trend];
  const Icon = config.icon;

  return (
    <div 
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bgClass} ${config.colorClass}`}
      data-testid="trend-indicator"
    >
      <Icon className="w-3 h-3" />
      <span>{Math.abs(value)}%</span>
    </div>
  );
}

/**
 * MetricCard - KPI display card with animated counter and trend indicator
 * 
 * Displays a key performance indicator with:
 * - Animated counter using react-countup
 * - Trend indicator (up/down arrow with color coding)
 * - Loading skeleton state
 * 
 * @example
 * <MetricCard
 *   title="Orders Received"
 *   value={1234}
 *   change={12.5}
 *   icon={<ShoppingCartIcon className="w-5 h-5" />}
 *   trend="up"
 * />
 */
export default function MetricCard({ 
  title, 
  value, 
  previousValue,
  change, 
  icon, 
  prefix = '', 
  suffix = '', 
  decimals = 0,
  trend,
  trendValue,
  isLoading = false,
}: MetricCardProps): JSX.Element {
  // Track value changes for animation - hooks must be called before any early returns
  const previousValueRef = useRef(value);
  const [hasValueChanged, setHasValueChanged] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    if (previousValueRef.current !== value) {
      setHasValueChanged(true);
      previousValueRef.current = value;
      
      // Reset animation state after animation completes
      const timer = setTimeout(() => {
        setHasValueChanged(false);
      }, 600);
      
      return () => clearTimeout(timer);
    }
  }, [value]);

  // Show loading skeleton if loading
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Calculate change percentage if not provided but previousValue is
  const calculatedChange = change ?? (
    previousValue !== undefined && previousValue !== 0
      ? ((value - previousValue) / previousValue) * 100
      : undefined
  );

  // Determine trend direction
  const determinedTrend = trend ?? (
    calculatedChange !== undefined
      ? calculatedChange > 0 ? 'up' : calculatedChange < 0 ? 'down' : 'neutral'
      : undefined
  );

  // Use provided trendValue or calculated change
  const displayTrendValue = trendValue ?? calculatedChange;

  return (
    <motion.div 
      className="card p-6" 
      data-testid="metric-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium dark:text-slate-400 light:text-gray-600">
          {title}
        </h3>
        <div className="dark:text-slate-400 light:text-gray-400 [&>svg]:w-6 [&>svg]:h-6">
          {icon}
        </div>
      </div>
      
      <div className="space-y-2">
        {/* Animated value with highlight on change - Requirements: 6.4 */}
        <motion.div 
          className="text-2xl font-semibold" 
          data-testid="metric-value"
          animate={{
            scale: hasValueChanged ? [1, 1.05, 1] : 1,
          }}
          transition={{ duration: 0.3 }}
        >
          <motion.span
            animate={{
              color: hasValueChanged 
                ? ['inherit', determinedTrend === 'up' ? '#22c55e' : determinedTrend === 'down' ? '#ef4444' : '#94a3b8', 'inherit']
                : 'inherit',
            }}
            transition={{ duration: 0.6 }}
          >
            {prefix}
            <CountUp 
              end={value} 
              duration={1} 
              decimals={decimals} 
              preserveValue 
              separator=","
            />
            {suffix}
          </motion.span>
        </motion.div>
        
        {/* Animated trend indicator - Requirements: 6.4 */}
        <AnimatePresence mode="wait">
          {determinedTrend && displayTrendValue !== undefined && (
            <motion.div 
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              <TrendIndicator trend={determinedTrend} value={displayTrendValue} />
              <span className="text-xs text-slate-500 dark:text-slate-500 light:text-gray-500">
                {t('widget.fromLastPeriod')}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export { MetricCard };
