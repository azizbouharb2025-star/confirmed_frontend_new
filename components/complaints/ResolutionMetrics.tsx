'use client';

/**
 * ResolutionMetrics Component
 * Displays resolution rate and average resolution time metrics
 * Requirements: 5.2
 */

import React from 'react';
import {
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

interface ResolutionMetricsProps {
  resolutionRate: number;
  averageResolutionTime: number;
  totalComplaints: number;
  isLoading?: boolean;
}

/**
 * Format resolution time from hours to human-readable string
 */
function formatResolutionTime(hours: number): string {
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes}m`;
  }
  if (hours < 24) {
    return `${hours.toFixed(1)}h`;
  }
  const days = hours / 24;
  if (days < 7) {
    return `${days.toFixed(1)}d`;
  }
  const weeks = days / 7;
  return `${weeks.toFixed(1)}w`;
}

/**
 * Get color class based on resolution rate
 */
function getResolutionRateColor(rate: number): string {
  if (rate >= 90) return 'text-green-500';
  if (rate >= 70) return 'text-yellow-500';
  return 'text-red-500';
}

/**
 * Get color class based on resolution time (lower is better)
 */
function getResolutionTimeColor(hours: number): string {
  if (hours <= 24) return 'text-green-500';
  if (hours <= 72) return 'text-yellow-500';
  return 'text-red-500';
}

/**
 * Metric Card Component
 */
function MetricCard({
  title,
  value,
  subtitle,
  icon,
  valueColor,
  isLoading,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  valueColor?: string;
  isLoading?: boolean;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gray-100 dark:bg-slate-700 rounded-lg">
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-500 dark:text-slate-400">{title}</p>
          {isLoading ? (
            <div className="h-8 w-20 bg-gray-200 dark:bg-slate-700 rounded animate-pulse mt-1" />
          ) : (
            <>
              <p className={`text-2xl font-bold ${valueColor || 'text-gray-900 dark:text-white'}`}>
                {value}
              </p>
              {subtitle && (
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                  {subtitle}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * ResolutionMetrics - Displays key resolution performance metrics
 * 
 * Features:
 * - Resolution rate percentage (Requirements: 5.2)
 * - Average resolution time (Requirements: 5.2)
 * - Total complaints count
 */
export default function ResolutionMetrics({
  resolutionRate,
  averageResolutionTime,
  totalComplaints,
  isLoading = false,
}: ResolutionMetricsProps) {
  const formattedRate = `${resolutionRate.toFixed(1)}%`;
  const formattedTime = formatResolutionTime(averageResolutionTime);
  const rateColor = getResolutionRateColor(resolutionRate);
  const timeColor = getResolutionTimeColor(averageResolutionTime);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Resolution Rate - Requirements: 5.2 */}
      <MetricCard
        title="Resolution Rate"
        value={formattedRate}
        subtitle="Complaints resolved successfully"
        icon={<CheckCircleIcon className="w-6 h-6 text-green-500" />}
        valueColor={rateColor}
        isLoading={isLoading}
      />

      {/* Average Resolution Time - Requirements: 5.2 */}
      <MetricCard
        title="Avg. Resolution Time"
        value={formattedTime}
        subtitle="Time to resolve complaints"
        icon={<ClockIcon className="w-6 h-6 text-blue-500" />}
        valueColor={timeColor}
        isLoading={isLoading}
      />

      {/* Total Complaints */}
      <MetricCard
        title="Total Complaints"
        value={totalComplaints.toLocaleString()}
        subtitle="In selected period"
        icon={<DocumentTextIcon className="w-6 h-6 text-purple-500" />}
        isLoading={isLoading}
      />
    </div>
  );
}

export { ResolutionMetrics, formatResolutionTime, getResolutionRateColor, getResolutionTimeColor };
