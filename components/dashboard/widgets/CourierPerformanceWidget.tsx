'use client';

/**
 * CourierPerformanceWidget Component
 * Displays courier delivery performance comparison
 * Requirements: 3.3
 */

import { TruckIcon, StarIcon, ClockIcon } from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import WidgetContainer from '../WidgetContainer';
import { useLanguage } from '@/hooks/useLanguage';
import type { TranslationKey } from '@/lib/i18n';

export interface CourierData {
  name: string;
  successRate: number;
  avgDeliveryTime: number;
  totalDeliveries: number;
  returnRate?: number;
}

export interface CourierPerformanceWidgetProps {
  /** Array of courier performance data */
  couriers: CourierData[];
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
 * Get color based on success rate
 */
function getSuccessRateColor(rate: number): string {
  if (rate >= 90) return '#22c55e'; // green-500
  if (rate >= 75) return '#f97316'; // orange-500
  return '#ef4444'; // red-500
}

/**
 * Get text color class based on success rate
 */
function getSuccessRateTextColor(rate: number): string {
  if (rate >= 90) return 'text-green-500';
  if (rate >= 75) return 'text-orange-500';
  return 'text-red-500';
}

/**
 * Find the best performing courier based on success rate
 */
export function findBestCourier(couriers: CourierData[]): CourierData | null {
  if (!Array.isArray(couriers) || couriers.length === 0) return null;
  return couriers.reduce((best, current) => 
    current.successRate > best.successRate ? current : best
  );
}


/**
 * Custom tooltip for the bar chart
 */
function ChartTooltip({ active, payload, label, t }: { active?: boolean; payload?: Array<{ value: number }>; label?: string; t: (key: TranslationKey) => string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 dark:bg-slate-800 light:bg-white border border-slate-700 dark:border-slate-700 light:border-gray-200 rounded-lg px-3 py-2 shadow-lg">
        <p className="text-sm font-medium text-slate-200 dark:text-slate-200 light:text-gray-800 mb-1">
          {label}
        </p>
        <p className="text-sm text-slate-300 dark:text-slate-300 light:text-gray-600">
          {t('widget.chart.successRate')}: {payload[0].value.toFixed(1)}%
        </p>
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
        <TruckIcon className="w-8 h-8 text-slate-400" />
      </div>
      <p className="text-sm text-slate-400 dark:text-slate-400 light:text-gray-600">
        {t('widget.courierPerformance.empty')}
      </p>
    </div>
  );
}

/**
 * CourierPerformanceWidget - Displays courier delivery performance
 * 
 * Shows:
 * - Courier comparison bar chart by success rate
 * - Success rate and average delivery time for each courier
 * - Highlights the best performing courier
 * 
 * Requirements: 3.3 - Display Courier Performance widget comparing delivery success rates
 */
export function CourierPerformanceWidget({
  couriers = [],
  isLoading = false,
  error,
  onRetry,
  className = '',
}: CourierPerformanceWidgetProps): JSX.Element {
  // Ensure couriers is always an array
  const courierList = Array.isArray(couriers) ? couriers : [];
  const hasData = courierList.length > 0;
  const bestCourier = findBestCourier(courierList);
  const { t } = useLanguage();

  // Prepare chart data
  const chartData = courierList.map(courier => ({
    name: courier.name,
    successRate: courier.successRate,
    color: getSuccessRateColor(courier.successRate),
  }));

  return (
    <WidgetContainer
      title={t('widget.courierPerformance')}
      icon={<TruckIcon className="w-5 h-5" />}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      className={className}
    >
      {!hasData ? (
        <EmptyState t={t} />
      ) : (
        <div className="space-y-4" data-testid="courier-performance-content">
          {/* Best performer highlight */}
          {bestCourier && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="p-2 rounded-full bg-green-500/20">
                <StarIcon className="w-4 h-4 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-green-400 mb-0.5">{t('widget.courierPerformance.bestPerformer')}</p>
                <p className="text-sm font-medium text-green-500">{bestCourier.name}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-green-500">{bestCourier.successRate.toFixed(1)}%</p>
                <p className="text-xs text-slate-400">{t('widget.courierPerformance.successRate')}</p>
              </div>
            </div>
          )}

          {/* Bar chart */}
          <div className="h-[120px]" data-testid="courier-performance-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <XAxis 
                  type="number" 
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={{ stroke: '#475569' }}
                  tickLine={{ stroke: '#475569' }}
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={{ stroke: '#475569' }}
                  tickLine={{ stroke: '#475569' }}
                  width={60}
                />
                <Tooltip content={<ChartTooltip t={t} />} />
                <Bar dataKey="successRate" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Courier details table */}
          <div className="pt-4 border-t border-slate-700 dark:border-slate-700 light:border-gray-200">
            <div className="space-y-2" data-testid="courier-details-list">
              {courierList.map((courier) => (
                <div 
                  key={courier.name}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-700/20 dark:bg-slate-700/20 light:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <TruckIcon className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium">{courier.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <span className={`font-semibold ${getSuccessRateTextColor(courier.successRate)}`}>
                        {courier.successRate.toFixed(1)}%
                      </span>
                      <span className="text-slate-500">{t('widget.courierPerformance.success')}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                      <ClockIcon className="w-3 h-3" />
                      <span>{courier.avgDeliveryTime}min</span>
                    </div>
                    <div className="text-slate-500">
                      {courier.totalDeliveries.toLocaleString()} {t('widget.courierPerformance.deliveries')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </WidgetContainer>
  );
}

export default CourierPerformanceWidget;
