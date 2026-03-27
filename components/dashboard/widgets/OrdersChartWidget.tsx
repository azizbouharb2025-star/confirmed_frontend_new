'use client';

/**
 * OrdersChartWidget Component
 * Displays orders trend line chart with period toggle
 * Requirements: 8.2
 */

import { useState } from 'react';
import { ShoppingCartIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import WidgetContainer from '../WidgetContainer';
import { useLanguage } from '@/hooks/useLanguage';
import type { TranslationKey } from '@/lib/i18n';

export type TimePeriod = 'daily' | 'weekly' | 'monthly';

export interface OrdersTrendData {
  date: string;
  orders: number;
  previousPeriod?: number;
}

export interface OrdersChartWidgetProps {
  /** Array of orders trend data */
  data: OrdersTrendData[];
  /** Currently selected time period */
  period?: TimePeriod;
  /** Callback when period changes */
  onPeriodChange?: (period: TimePeriod) => void;
  /** Total orders in current period */
  totalOrders?: number;
  /** Percentage change from previous period */
  changePercent?: number;
  /** Whether the widget is loading */
  isLoading?: boolean;
  /** Error message if data fetch failed */
  error?: string;
  /** Callback when retry is clicked */
  onRetry?: () => void;
  /** Optional class name for styling */
  className?: string;
}

const PERIOD_OPTIONS: { value: TimePeriod; labelKey: TranslationKey }[] = [
  { value: 'daily', labelKey: 'widget.ordersTrend.daily' },
  { value: 'weekly', labelKey: 'widget.ordersTrend.weekly' },
  { value: 'monthly', labelKey: 'widget.ordersTrend.monthly' },
];


/**
 * Custom tooltip for the line chart
 */
function ChartTooltip({ 
  active, 
  payload, 
  label,
  t,
}: { 
  active?: boolean; 
  payload?: Array<{ value: number; dataKey: string; color: string }>; 
  label?: string;
  t: (key: TranslationKey) => string;
}) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 dark:bg-slate-800 light:bg-white border border-slate-700 dark:border-slate-700 light:border-gray-200 rounded-lg px-3 py-2 shadow-lg">
        <p className="text-xs text-slate-400 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.dataKey === 'orders' ? t('widget.chart.current') : t('widget.chart.previous')}: {entry.value.toLocaleString()}
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
        <ShoppingCartIcon className="w-8 h-8 text-slate-400" />
      </div>
      <p className="text-sm text-slate-400 dark:text-slate-400 light:text-gray-600">
        {t('widget.ordersTrend.empty')}
      </p>
    </div>
  );
}

/**
 * OrdersChartWidget - Displays orders trend line chart
 * 
 * Shows:
 * - Line chart with orders trend
 * - Daily/weekly/monthly toggle
 * - Comparison to previous period
 * - Total orders and change percentage
 * 
 * Requirements: 8.2 - Display real-time charts for orders trends
 */
export function OrdersChartWidget({
  data,
  period = 'daily',
  onPeriodChange,
  totalOrders = 0,
  changePercent = 0,
  isLoading = false,
  error,
  onRetry,
  className = '',
}: OrdersChartWidgetProps): JSX.Element {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>(period);
  const hasData = data.length > 0;
  const isPositiveChange = changePercent >= 0;
  const { t } = useLanguage();

  const handlePeriodChange = (newPeriod: TimePeriod) => {
    setSelectedPeriod(newPeriod);
    onPeriodChange?.(newPeriod);
  };

  return (
    <WidgetContainer
      title={t('widget.ordersTrend')}
      icon={<ShoppingCartIcon className="w-5 h-5" />}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      className={className}
    >
      {!hasData ? (
        <EmptyState t={t} />
      ) : (
        <div className="space-y-4" data-testid="orders-chart-content">
          {/* Header with total and period toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{totalOrders.toLocaleString()}</p>
              <div className="flex items-center gap-1 text-sm">
                {isPositiveChange ? (
                  <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
                ) : (
                  <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />
                )}
                <span className={isPositiveChange ? 'text-green-500' : 'text-red-500'}>
                  {isPositiveChange ? '+' : ''}{changePercent.toFixed(1)}%
                </span>
                <span className="text-slate-400">{t('widget.ordersTrend.vsPrevious')}</span>
              </div>
            </div>
            
            {/* Period toggle */}
            <div className="flex gap-1 p-1 rounded-lg bg-slate-700/30 dark:bg-slate-700/30 light:bg-gray-100">
              {PERIOD_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handlePeriodChange(option.value)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    selectedPeriod === option.value
                      ? 'bg-blue-500 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t(option.labelKey)}
                </button>
              ))}
            </div>
          </div>
          
          {/* Line chart */}
          <div className="h-[200px]" data-testid="orders-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
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
                />
                <Tooltip content={<ChartTooltip t={t} />} />
                <Line 
                  type="monotone" 
                  dataKey="orders" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#3b82f6' }}
                />
                {data.some(d => d.previousPeriod !== undefined) && (
                  <Line 
                    type="monotone" 
                    dataKey="previousPeriod" 
                    stroke="#6b7280" 
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </WidgetContainer>
  );
}

export default OrdersChartWidget;
