'use client';

/**
 * ComplaintsAnalyticsWidget Component
 * Displays complaint trends, categories, and resolution rates
 * Requirements: 3.2
 */

import { ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import WidgetContainer from '../WidgetContainer';

export interface ComplaintTrendData {
  date: string;
  count: number;
}

export interface ComplaintCategory {
  category: string;
  count: number;
}

export interface ComplaintsAnalyticsWidgetProps {
  /** Total number of complaints */
  totalComplaints: number;
  /** Resolution rate as a percentage (0-100) */
  resolutionRate: number;
  /** Complaint trend data over time */
  trendData: ComplaintTrendData[];
  /** Complaint categories with counts */
  categories: ComplaintCategory[];
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
 * Color palette for category pie chart
 */
const CATEGORY_COLORS = [
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#f97316', // orange-500
  '#22c55e', // green-500
  '#06b6d4', // cyan-500
];

/**
 * Get color for resolution rate
 */
function getResolutionRateColor(rate: number): string {
  if (rate >= 80) return 'text-green-500';
  if (rate >= 60) return 'text-yellow-500';
  return 'text-red-500';
}


/**
 * Custom tooltip for the line chart
 */
function TrendTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 dark:bg-slate-800 light:bg-white border border-slate-700 dark:border-slate-700 light:border-gray-200 rounded-lg px-3 py-2 shadow-lg">
        <p className="text-xs text-slate-400 mb-1">{label}</p>
        <p className="text-sm font-medium text-slate-200 dark:text-slate-200 light:text-gray-800">
          {payload[0].value} complaints
        </p>
      </div>
    );
  }
  return null;
}

/**
 * Custom tooltip for the pie chart
 */
function CategoryTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { color: string } }> }) {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-slate-800 dark:bg-slate-800 light:bg-white border border-slate-700 dark:border-slate-700 light:border-gray-200 rounded-lg px-3 py-2 shadow-lg">
        <p className="text-sm font-medium" style={{ color: data.payload.color }}>
          {data.name}
        </p>
        <p className="text-sm text-slate-300 dark:text-slate-300 light:text-gray-600">
          {data.value} complaints
        </p>
      </div>
    );
  }
  return null;
}

/**
 * Empty state when no data is available
 */
function EmptyState(): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="mb-4 p-3 rounded-full bg-slate-500/10">
        <ExclamationCircleIcon className="w-8 h-8 text-slate-400" />
      </div>
      <p className="text-sm text-slate-400 dark:text-slate-400 light:text-gray-600">
        No complaints data available
      </p>
    </div>
  );
}

/**
 * ComplaintsAnalyticsWidget - Displays complaint analytics
 * 
 * Shows:
 * - Total complaints count
 * - Resolution rate metric
 * - Complaint trend line chart
 * - Category breakdown pie chart
 * 
 * Requirements: 3.2 - Display complaint trends, categories, and resolution rates
 */
export function ComplaintsAnalyticsWidget({
  totalComplaints = 0,
  resolutionRate = 0,
  trendData = [],
  categories = [],
  isLoading = false,
  error,
  onRetry,
  className = '',
}: ComplaintsAnalyticsWidgetProps): JSX.Element {
  const hasData = totalComplaints > 0 || trendData.length > 0 || categories.length > 0;

  // Prepare pie chart data with colors
  const pieData = categories.map((cat, index) => ({
    name: cat.category,
    value: cat.count,
    color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
  }));

  return (
    <WidgetContainer
      title="Complaints Analytics"
      icon={<ExclamationCircleIcon className="w-5 h-5" />}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      className={className}
    >
      {!hasData ? (
        <EmptyState />
      ) : (
        <div className="space-y-4" data-testid="complaints-analytics-content">
          {/* Summary metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-slate-700/30 dark:bg-slate-700/30 light:bg-gray-100">
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-gray-600 mb-1">
                Total Complaints
              </p>
              <p className="text-xl font-semibold">{totalComplaints.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-700/30 dark:bg-slate-700/30 light:bg-gray-100">
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-gray-600 mb-1">
                Resolution Rate
              </p>
              <div className="flex items-center gap-2">
                <CheckCircleIcon className={`w-5 h-5 ${getResolutionRateColor(resolutionRate)}`} />
                <p className={`text-xl font-semibold ${getResolutionRateColor(resolutionRate)}`}>
                  {resolutionRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Trend line chart */}
          {trendData.length > 0 && (
            <div className="pt-4 border-t border-slate-700 dark:border-slate-700 light:border-gray-200">
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-gray-600 mb-3">
                Complaint Trend
              </p>
              <div className="h-[120px]" data-testid="complaints-trend-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
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
                      width={30}
                    />
                    <Tooltip content={<TrendTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#f97316" 
                      strokeWidth={2}
                      dot={{ fill: '#f97316', strokeWidth: 0, r: 3 }}
                      activeDot={{ r: 5, fill: '#f97316' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Category breakdown pie chart */}
          {categories.length > 0 && (
            <div className="pt-4 border-t border-slate-700 dark:border-slate-700 light:border-gray-200">
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-gray-600 mb-3">
                Categories
              </p>
              <div className="flex items-center gap-4">
                <div className="h-[100px] w-[100px]" data-testid="complaints-category-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={25}
                        outerRadius={45}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CategoryTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-1">
                  {categories.slice(0, 4).map((cat, index) => (
                    <div key={cat.category} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}
                        />
                        <span className="text-slate-400 dark:text-slate-400 light:text-gray-600 truncate max-w-[100px]">
                          {cat.category}
                        </span>
                      </div>
                      <span className="font-medium">{cat.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </WidgetContainer>
  );
}

export default ComplaintsAnalyticsWidget;
