'use client';

/**
 * ComplaintSummaryCards Component
 * Displays summary cards showing complaint counts by status
 * Requirements: 2.1
 */

import React from 'react';
import { clsx } from 'clsx';
import { ComplaintSummary, ComplaintStatus, getStatusDisplayName } from '@/types/complaint';

export interface ComplaintSummaryCardsProps {
  /** Summary data with counts by status */
  summary: ComplaintSummary | null;
  /** Whether data is loading */
  isLoading?: boolean;
  /** Optional className for styling */
  className?: string;
}

/**
 * Status card configuration
 */
interface StatusCardConfig {
  status: ComplaintStatus | 'total';
  label: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
}

/**
 * Get icon for status
 */
function getStatusIcon(status: ComplaintStatus | 'total'): React.ReactNode {
  const iconClass = 'w-6 h-6';
  
  switch (status) {
    case 'open':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'in_progress':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'resolved':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'closed':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    case 'escalated':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    case 'total':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      );
  }
}

/**
 * Status card configurations
 */
const STATUS_CARDS: StatusCardConfig[] = [
  {
    status: 'total',
    label: 'Total Complaints',
    color: 'text-gray-600 dark:text-slate-300',
    bgColor: 'bg-gray-100 dark:bg-slate-700',
    icon: getStatusIcon('total'),
  },
  {
    status: 'open',
    label: getStatusDisplayName('open'),
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    icon: getStatusIcon('open'),
  },
  {
    status: 'in_progress',
    label: getStatusDisplayName('in_progress'),
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    icon: getStatusIcon('in_progress'),
  },
  {
    status: 'resolved',
    label: getStatusDisplayName('resolved'),
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    icon: getStatusIcon('resolved'),
  },
  {
    status: 'closed',
    label: getStatusDisplayName('closed'),
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-700/50',
    icon: getStatusIcon('closed'),
  },
  {
    status: 'escalated',
    label: getStatusDisplayName('escalated'),
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    icon: getStatusIcon('escalated'),
  },
];

/**
 * Skeleton card for loading state
 */
function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-200 dark:bg-slate-700 rounded-lg" />
        <div className="flex-1">
          <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-20 mb-2" />
          <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-12" />
        </div>
      </div>
    </div>
  );
}

/**
 * Individual status card component
 */
function StatusCard({
  config,
  count,
}: {
  config: StatusCardConfig;
  count: number;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center gap-3">
        <div className={clsx('p-2 rounded-lg', config.bgColor, config.color)}>
          {config.icon}
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {config.label}
          </p>
          <p className={clsx('text-2xl font-bold', config.color)}>
            {count.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * ComplaintSummaryCards - Displays complaint counts by status
 * 
 * Requirements:
 * - 2.1: Display summary cards showing complaint counts by status
 *        (open, in_progress, resolved, closed, escalated)
 * - Show total complaint count
 */
export function ComplaintSummaryCards({
  summary,
  isLoading = false,
  className,
}: ComplaintSummaryCardsProps): JSX.Element {
  // Show skeleton loading state
  if (isLoading || !summary) {
    return (
      <div className={clsx('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4', className)}>
        {STATUS_CARDS.map((config) => (
          <SkeletonCard key={config.status} />
        ))}
      </div>
    );
  }

  return (
    <div className={clsx('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4', className)}>
      {STATUS_CARDS.map((config) => {
        const count = config.status === 'total' 
          ? (summary.total ?? 0)
          : (summary[config.status] ?? 0);
        
        return (
          <StatusCard
            key={config.status}
            config={config}
            count={count}
          />
        );
      })}
    </div>
  );
}

export default ComplaintSummaryCards;
