'use client';

/**
 * RevenueChartWidget Component
 * Displays revenue trend line chart with cumulative and daily views
 * Requirements: 8.2
 */

import { useState } from 'react';
import { BanknotesIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import WidgetContainer from '../WidgetContainer';
import { useLanguage } from '@/hooks/useLanguage';
import type { TranslationKey } from '@/lib/i18n';

export type ViewMode = 'cumulative' | 'daily';

export interface RevenueTrendData {
  date: string;
  revenue: number;
  cumulative?: number;
}

export interface RevenueChartWidgetProps {
  /** Array of revenue trend data */
  data: RevenueTrendData[];
  /** Currently selected view mode */
  viewMode?: ViewMode;
  /** Callback when view mode changes */
  onViewModeChange?: (mode: ViewMode) => void;
  /** Total revenue in current period */
  totalRevenue?: number;
  /** Growth percentage from previous period */
  growthPercent?: number;
  /** Currency code (default: TND) */
  currency?: string;
  /** Whether the widget is loading */
  isLoading?: boolean;
  /** Error message if data fetch failed */
  error?: string;
  /** Callback when retry is clicked */
  onRetry?: () => void;
  /** Optional class name for styling */
  className?: string;
}

const VIEW_OPTIONS: { value: ViewMode; labelKey: TranslationKey }[] = [
  { value: 'daily', labelKey: 'widget.revenueTrend.daily' },
  { value: 'cumulative', labelKey: 'widget.revenueTrend.cumulative' },
];


/**
 * Format currency value
 */
function formatCurrency(value: number, _currency: string): string {
  return new Intl.NumberFormat('fr-TN', {
    style: 'currency',
    currency: 'TND',
  }).format(value);
}

/**
 * Custom tooltip for the area chart
 */
function ChartTooltip({ 
  active, 
  payload, 
  label,
  currency = 'TND',
  t,
}: { 
  active?: boolean; 
  payload?: Array<{ value: number; dataKey: string }>; 
  label?: string;
  currency?: string;
  t: (key: TranslationKey) => string;
}) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 dark:bg-slate-800 light:bg-white border border-slate-700 dark:border-slate-700 light:border-gray-200 rounded-lg px-3 py-2 shadow-lg">
        <p className="text-xs text-slate-400 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm text-green-400">
            {entry.dataKey === 'cumulative' ? t('widget.chart.total') : t('widget.chart.revenue')}: {formatCurrency(entry.value, currency)}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

/**
 * Empty state when no data is available
 */
function EmptyState({ t }: { t: (key: TranslationKey) => string }): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="mb-4 p-3 rounded-full bg-slate-500/10">
        <BanknotesIcon className="w-8 h-8 text-slate-400" />
      </div>
      <p className="text-sm text-slate-400 dark:text-slate-400 light:text-gray-600">
        {t('widget.revenueTrend.empty')}
      </p>
    </div>
  );
}

/**
 * RevenueChartWidget - Displays revenue trend line chart
 * 
 * Shows:
 * - Area chart with revenue trend
 * - Cumulative and daily view toggle
 * - Total revenue and growth percentage
 * 
 * Requirements: 8.2 - Display real-time charts for revenue trends
 */
export function RevenueChartWidget({
  data,
  viewMode = 'daily',
  onViewModeChange,
  totalRevenue = 0,
  growthPercent = 0,
  currency = 'TND',
  isLoading = false,
  error,
  onRetry,
  className = '',
}: RevenueChartWidgetProps): JSX.Element {
  const [selectedView, setSelectedView] = useState<ViewMode>(viewMode);
  const hasData = data.length > 0;
  const isPositiveGrowth = growthPercent >= 0;
  const dataKey = selectedView === 'cumulative' ? 'cumulative' : 'revenue';
  const { t } = useLanguage();

  const handleViewChange = (newView: ViewMode) => {
    setSelectedView(newView);
    onViewModeChange?.(newView);
  };

  return (
    <WidgetContainer
      title={t('widget.revenueTrend')}
      icon={<BanknotesIcon className="w-5 h-5" />}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      className={className}
    >
      {!hasData ? (
        <EmptyState t={t} />
      ) : (
        <div className="space-y-4" data-testid="revenue-chart-content">
          {/* Header with total and view toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-green-400">
                {formatCurrency(totalRevenue, currency)}
              </p>
              <div className="flex items-center gap-1 text-sm">
                {isPositiveGrowth ? (
                  <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
                ) : (
                  <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />
                )}
                <span className={isPositiveGrowth ? 'text-green-500' : 'text-red-500'}>
                  {isPositiveGrowth ? '+' : ''}{growthPercent.toFixed(1)}%
                </span>
                <span className="text-slate-400">{t('widget.revenueTrend.growth')}</span>
              </div>
            </div>
            
            {/* View mode toggle */}
            <div className="flex gap-1 p-1 rounded-lg bg-slate-700/30 dark:bg-slate-700/30 light:bg-gray-100">
              {VIEW_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleViewChange(option.value)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    selectedView === option.value
                      ? 'bg-green-500 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t(option.labelKey)}
                </button>
              ))}
            </div>
          </div>
          
          {/* Area chart */}
          <div className="h-[200px]" data-testid="revenue-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={{ stroke: '#475569' }}
                  tickLine={{ stroke: '#475569' }}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={{ stroke: '#475569' }}
                  tickLine={{ stroke: '#475569' }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k TND`}
                />
                <Tooltip content={<ChartTooltip currency={currency} t={t} />} />
                <Area 
                  type="monotone" 
                  dataKey={dataKey}
                  stroke="#22c55e" 
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </WidgetContainer>
  );
}

export default RevenueChartWidget;
