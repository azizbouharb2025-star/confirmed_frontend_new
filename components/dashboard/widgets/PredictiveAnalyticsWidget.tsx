'use client';

/**
 * PredictiveAnalyticsWidget Component
 * Displays AI-powered forecasts with confidence bands
 * Requirements: 4.2
 */

import { ChartBarIcon, ArrowTrendingUpIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, ComposedChart, Legend } from 'recharts';
import WidgetContainer from '../WidgetContainer';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKey } from '@/lib/i18n';

export interface ForecastDataPoint {
  date: string;
  predicted: number;
  actual?: number;
  confidenceLow?: number;
  confidenceHigh?: number;
}

export interface PredictiveAnalyticsWidgetProps {
  /** Forecast data with predicted and actual values */
  forecastedOrders: ForecastDataPoint[];
  /** Forecasted confirmation rate percentage */
  forecastedConfirmationRate: number;
  /** AI confidence percentage (0-100) */
  confidence: number;
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
 * Get color based on confidence level
 */
function getConfidenceColor(confidence: number): string {
  if (confidence >= 80) return 'text-green-500';
  if (confidence >= 60) return 'text-yellow-500';
  return 'text-orange-500';
}

/**
 * Get background color based on confidence level
 */
function getConfidenceBgColor(confidence: number): string {
  if (confidence >= 80) return 'bg-green-500/10';
  if (confidence >= 60) return 'bg-yellow-500/10';
  return 'bg-orange-500/10';
}


/**
 * Custom tooltip for the forecast chart
 */
function ForecastTooltip({ 
  active, 
  payload, 
  label,
  t,
}: { 
  active?: boolean; 
  payload?: Array<{ 
    dataKey: string; 
    value: number; 
    color: string;
    name: string;
  }>; 
  label?: string;
  t: (key: TranslationKey) => string;
}) {
  if (active && payload && payload.length) {
    const predicted = payload.find(p => p.dataKey === 'predicted');
    const actual = payload.find(p => p.dataKey === 'actual');
    
    return (
      <div className="bg-slate-800 dark:bg-slate-800 light:bg-white border border-slate-700 dark:border-slate-700 light:border-gray-200 rounded-lg px-3 py-2 shadow-lg">
        <p className="text-xs text-slate-400 mb-2">{label}</p>
        {predicted && (
          <p className="text-sm text-purple-400">
            {t('widget.chart.predicted')}: {predicted.value.toLocaleString()} {t('widget.predictiveAnalytics.predictedOrders')}
          </p>
        )}
        {actual && actual.value !== undefined && (
          <p className="text-sm text-blue-400">
            {t('widget.chart.actual')}: {actual.value.toLocaleString()} {t('widget.predictiveAnalytics.predictedOrders')}
          </p>
        )}
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
        <ChartBarIcon className="w-8 h-8 text-slate-400" />
      </div>
      <p className="text-sm text-slate-400 dark:text-slate-400 light:text-gray-600">
        {t('widget.predictiveAnalytics.empty')}
      </p>
    </div>
  );
}

/**
 * PredictiveAnalyticsWidget - Displays AI-powered forecasts
 * 
 * Shows:
 * - Forecast line chart with confidence bands
 * - Predicted vs actual comparison
 * - Confidence percentage indicator
 * - Forecasted confirmation rate
 * 
 * Requirements: 4.2 - Display forecasted order volumes and confirmation rates
 */
export function PredictiveAnalyticsWidget({
  forecastedOrders = [],
  forecastedConfirmationRate = 0,
  confidence = 0,
  isLoading = false,
  error,
  onRetry,
  className = '',
}: PredictiveAnalyticsWidgetProps): JSX.Element {
  const { t } = useLanguage();
  const hasData = forecastedOrders.length > 0;

  // Prepare chart data with confidence bands
  const chartData = forecastedOrders.map(point => ({
    ...point,
    confidenceLow: point.confidenceLow ?? point.predicted * 0.85,
    confidenceHigh: point.confidenceHigh ?? point.predicted * 1.15,
  }));

  return (
    <WidgetContainer
      title={t('widget.predictiveAnalytics')}
      icon={<SparklesIcon className="w-5 h-5" />}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      className={className}
    >
      {!hasData ? (
        <EmptyState t={t} />
      ) : (
        <div className="space-y-4" data-testid="predictive-analytics-content">
          {/* Summary metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-3 rounded-lg ${getConfidenceBgColor(confidence)}`}>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-gray-600 mb-1">
                {t('widget.predictiveAnalytics.aiConfidence')}
              </p>
              <div className="flex items-center gap-2">
                <SparklesIcon className={`w-5 h-5 ${getConfidenceColor(confidence)}`} />
                <p className={`text-xl font-semibold ${getConfidenceColor(confidence)}`}>
                  {confidence.toFixed(0)}%
                </p>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-700/30 dark:bg-slate-700/30 light:bg-gray-100">
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-gray-600 mb-1">
                {t('widget.predictiveAnalytics.forecastedConfirmation')}
              </p>
              <div className="flex items-center gap-2">
                <ArrowTrendingUpIcon className="w-5 h-5 text-blue-500" />
                <p className="text-xl font-semibold text-blue-500">
                  {forecastedConfirmationRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Forecast chart with confidence bands */}
          <div className="pt-4 border-t border-slate-700 dark:border-slate-700 light:border-gray-200">
            <p className="text-xs text-slate-400 dark:text-slate-400 light:text-gray-600 mb-3">
              {t('widget.predictiveAnalytics.orderVolumeForecast')}
            </p>
            <div className="h-[160px]" data-testid="predictive-forecast-chart">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <defs>
                    <linearGradient id="confidenceBand" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
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
                    width={40}
                  />
                  <Tooltip content={<ForecastTooltip t={t} />} />
                  <Legend 
                    wrapperStyle={{ fontSize: '10px' }}
                    iconSize={8}
                  />
                  {/* Confidence band area */}
                  <Area
                    type="monotone"
                    dataKey="confidenceHigh"
                    stroke="none"
                    fill="url(#confidenceBand)"
                    name={t('widget.chart.confidenceBand')}
                  />
                  <Area
                    type="monotone"
                    dataKey="confidenceLow"
                    stroke="none"
                    fill="#1e293b"
                    name=""
                  />
                  {/* Predicted line */}
                  <Line 
                    type="monotone" 
                    dataKey="predicted" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: '#8b5cf6', strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, fill: '#8b5cf6' }}
                    name={t('widget.chart.predicted')}
                  />
                  {/* Actual line */}
                  <Line 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, fill: '#3b82f6' }}
                    name={t('widget.chart.actual')}
                    connectNulls={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Legend explanation */}
          <div className="flex items-center justify-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-purple-500" style={{ borderStyle: 'dashed' }} />
              <span>{t('widget.predictiveAnalytics.predicted')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-blue-500" />
              <span>{t('widget.predictiveAnalytics.actual')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-2 bg-purple-500/20 rounded" />
              <span>{t('widget.predictiveAnalytics.confidence')}</span>
            </div>
          </div>
        </div>
      )}
    </WidgetContainer>
  );
}

export default PredictiveAnalyticsWidget;
