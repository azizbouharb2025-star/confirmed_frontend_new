'use client';

import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import WidgetContainer from '../WidgetContainer';
import { useLanguage } from '@/hooks/useLanguage';
import type { TranslationKey } from '@/lib/i18n';

export interface RiskScoreData {
  high: number;
  medium: number;
  low: number;
}

export interface RiskScoreWidgetProps {
  data: RiskScoreData;
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
  className?: string;
  onShowRiskyOrders?: () => void;
}

const RISK_COLORS = {
  high: '#22c55e',
  medium: '#f97316',
  low: '#ef4444',
};

export function getRiskChartData(data: RiskScoreData, t: (key: TranslationKey) => string): Array<{ name: string; value: number; color: string }> {
  return [
    { name: t('widget.riskScore.highLabel'), value: data.high, color: RISK_COLORS.high },
    { name: t('widget.riskScore.mediumLabel'), value: data.medium, color: RISK_COLORS.medium },
    { name: t('widget.riskScore.lowLabel'), value: data.low, color: RISK_COLORS.low },
  ];
}

export function hasThreeCategories(data: RiskScoreData): boolean {
  return (
    typeof data.high === 'number' &&
    typeof data.medium === 'number' &&
    typeof data.low === 'number'
  );
}

function getTotalOrders(data: RiskScoreData): number {
  return data.high + data.medium + data.low;
}

function CustomTooltip({ active, payload, t }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { color: string } }>; t: (key: TranslationKey) => string }) {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-slate-800 dark:bg-slate-800 light:bg-white border border-slate-700 dark:border-slate-700 light:border-gray-200 rounded-lg px-3 py-2 shadow-lg">
        <p className="text-sm font-medium" style={{ color: data.payload.color }}>
          {data.name}
        </p>
        <p className="text-sm text-slate-300 dark:text-slate-300 light:text-gray-600">
          {data.value} {t('widget.riskScore.orders')}
        </p>
      </div>
    );
  }
  return null;
}

function renderLegend(props: { payload?: Array<{ value: string; color?: string }> }) {
  const { payload } = props;
  if (!payload) return null;

  return (
    <ul className="flex flex-wrap justify-center gap-4 mt-4">
      {payload.map((entry, index) => (
        <li key={`legend-${index}`} className="flex items-center gap-2 text-xs">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color || '#888' }}
          />
          <span className="text-slate-400 dark:text-slate-400 light:text-gray-600">
            {entry.value}
          </span>
        </li>
      ))}
    </ul>
  );
}

function EmptyState({ t }: { t: (key: TranslationKey) => string }): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="mb-4 p-3 rounded-full bg-slate-500/10">
        <ShieldCheckIcon className="w-8 h-8 text-slate-400" />
      </div>
      <p className="text-sm text-slate-400 dark:text-slate-400 light:text-gray-600">
        {t('widget.riskScore.empty')}
      </p>
    </div>
  );
}

export function RiskScoreWidget(props: RiskScoreWidgetProps): JSX.Element {
  const {
    data,
    isLoading = false,
    error,
    onRetry,
    className = '',
    onShowRiskyOrders,
  } = props;
  
  const { t } = useLanguage();
  const chartData = getRiskChartData(data, t);
  const totalOrders = getTotalOrders(data);
  const hasData = totalOrders > 0;

  return (
    <WidgetContainer
      title={t('widget.riskScore.title')}
      icon={<ShieldCheckIcon className="w-6 h-6" />}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      className={className}
    >
      {!hasData ? (
        <EmptyState t={t} />
      ) : (
        <div className="flex flex-col items-center" data-testid="risk-score-chart">
          <div className="w-full h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip t={t} />} />
                <Legend content={renderLegend} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-3 gap-4 w-full mt-4 pt-4 border-t border-slate-700 dark:border-slate-700 light:border-gray-200">
            <div className="text-center">
              <p className="text-lg font-semibold text-green-500">{data.high}</p>
              <p className="text-xs text-slate-400">{t('widget.riskScore.highLabel')}</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-orange-500">{data.medium}</p>
              <p className="text-xs text-slate-400">{t('widget.riskScore.mediumLabel')}</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-red-500">{data.low}</p>
              <p className="text-xs text-slate-400">{t('widget.riskScore.lowLabel')}</p>
            </div>
          </div>
          
          {onShowRiskyOrders && (
            <button
              onClick={onShowRiskyOrders}
              className="mt-4 w-full px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
            >
              {t('widget.riskScore.showRiskyOrders')}
            </button>
          )}
        </div>
      )}
    </WidgetContainer>
  );
}

export default RiskScoreWidget;
