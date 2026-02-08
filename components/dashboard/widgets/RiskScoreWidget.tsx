'use client';

/**
 * RiskScoreWidget Component
 * Displays AI risk score distribution as a pie/donut chart
 * Requirements: 2.2
 * 
 * Feature: subscription-tiered-dashboards, Property 4: Risk score distribution has three categories
 * Validates: Requirements 2.2
 */

import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import WidgetContainer from '../WidgetContainer';

/**
 * Risk score data structure with three categories
 * - high: score > 70 (green - high confidence)
 * - medium: score 40-70 (orange - medium confidence)
 * - low: score < 40 (red - low confidence)
 */
export interface RiskScoreData {
  high: number;    // score > 70
  medium: number;  // score 40-70
  low: number;     // score < 40
}

export interface RiskScoreWidgetProps {
  /** Risk score distribution data */
  data: RiskScoreData;
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
 * Color configuration for risk categories
 * - High confidence (>70): Green
 * - Medium confidence (40-70): Orange
 * - Low confidence (<40): Red
 */
const RISK_COLORS = {
  high: '#22c55e',    // green-500
  medium: '#f97316',  // orange-500
  low: '#ef4444',     // red-500
};

/**
 * Labels for risk categories
 */
const _RISK_LABELS = {
  high: 'High Confidence (>70)',
  medium: 'Medium Confidence (40-70)',
  low: 'Low Confidence (<40)',
};


/**
 * Get chart data from risk score data
 * Property 4: Risk score distribution has three categories
 * For any risk score data, the distribution chart SHALL display exactly three categories
 */
export function getRiskChartData(data: RiskScoreData): Array<{ name: string; value: number; color: string }> {
  return [
    { name: 'High Confidence', value: data.high, color: RISK_COLORS.high },
    { name: 'Medium Confidence', value: data.medium, color: RISK_COLORS.medium },
    { name: 'Low Confidence', value: data.low, color: RISK_COLORS.low },
  ];
}

/**
 * Validate that risk score data has exactly three categories
 * Property 4: Risk score distribution has three categories
 */
export function hasThreeCategories(data: RiskScoreData): boolean {
  return (
    typeof data.high === 'number' &&
    typeof data.medium === 'number' &&
    typeof data.low === 'number'
  );
}

/**
 * Calculate total orders from risk data
 */
function getTotalOrders(data: RiskScoreData): number {
  return data.high + data.medium + data.low;
}

/**
 * Custom tooltip for the pie chart
 */
function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { color: string } }> }) {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-slate-800 dark:bg-slate-800 light:bg-white border border-slate-700 dark:border-slate-700 light:border-gray-200 rounded-lg px-3 py-2 shadow-lg">
        <p className="text-sm font-medium" style={{ color: data.payload.color }}>
          {data.name}
        </p>
        <p className="text-sm text-slate-300 dark:text-slate-300 light:text-gray-600">
          {data.value} orders
        </p>
      </div>
    );
  }
  return null;
}

/**
 * Custom legend renderer
 */
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

/**
 * Empty state when no data is available
 */
function EmptyState(): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="mb-4 p-3 rounded-full bg-slate-500/10">
        <ShieldCheckIcon className="w-8 h-8 text-slate-400" />
      </div>
      <p className="text-sm text-slate-400 dark:text-slate-400 light:text-gray-600">
        No risk score data available
      </p>
    </div>
  );
}

/**
 * RiskScoreWidget - Displays AI risk score distribution
 * 
 * Shows a donut chart with three categories:
 * - High confidence (>70): Green - orders likely to be confirmed
 * - Medium confidence (40-70): Orange - orders need review
 * - Low confidence (<40): Red - orders likely to be rejected
 * 
 * Requirements: 2.2 - Display chart showing order distribution by risk level
 */
export function RiskScoreWidget({
  data,
  isLoading = false,
  error,
  onRetry,
  className = '',
}: RiskScoreWidgetProps): JSX.Element {
  const chartData = getRiskChartData(data);
  const totalOrders = getTotalOrders(data);
  const hasData = totalOrders > 0;

  return (
    <WidgetContainer
      title="AI Risk Score Distribution"
      icon={<ShieldCheckIcon className="w-5 h-5" />}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      className={className}
    >
      {!hasData ? (
        <EmptyState />
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
                <Tooltip content={<CustomTooltip />} />
                <Legend content={renderLegend} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4 w-full mt-4 pt-4 border-t border-slate-700 dark:border-slate-700 light:border-gray-200">
            <div className="text-center">
              <p className="text-lg font-semibold text-green-500">{data.high}</p>
              <p className="text-xs text-slate-400">High</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-orange-500">{data.medium}</p>
              <p className="text-xs text-slate-400">Medium</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-red-500">{data.low}</p>
              <p className="text-xs text-slate-400">Low</p>
            </div>
          </div>
        </div>
      )}
    </WidgetContainer>
  );
}

export default RiskScoreWidget;
