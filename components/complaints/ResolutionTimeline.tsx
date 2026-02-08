'use client';

/**
 * ResolutionTimeline Component
 * Displays resolution history as a timeline showing all status changes and notes
 * Requirements: 3.4
 */

import React from 'react';
import { clsx } from 'clsx';
import {
  ResolutionHistoryEntry,
  ComplaintStatus,
  getStatusDisplayName,
} from '@/types/complaint';

export interface ResolutionTimelineProps {
  /** Resolution history entries */
  history: ResolutionHistoryEntry[];
  /** Optional className for styling */
  className?: string;
}

/**
 * Format timestamp for display
 */
function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return formatTimestamp(timestamp);
}

/**
 * Get status icon and color based on status type
 */
function getStatusStyle(status: ComplaintStatus): {
  bgColor: string;
  iconColor: string;
  icon: React.ReactNode;
} {
  switch (status) {
    case 'open':
      return {
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        iconColor: 'text-blue-600 dark:text-blue-400',
        icon: <CircleIcon />,
      };
    case 'in_progress':
      return {
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
        iconColor: 'text-yellow-600 dark:text-yellow-400',
        icon: <ClockIcon />,
      };
    case 'resolved':
      return {
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        iconColor: 'text-green-600 dark:text-green-400',
        icon: <CheckIcon />,
      };
    case 'closed':
      return {
        bgColor: 'bg-gray-100 dark:bg-gray-700/50',
        iconColor: 'text-gray-600 dark:text-gray-400',
        icon: <ArchiveIcon />,
      };
    case 'escalated':
      return {
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        iconColor: 'text-red-600 dark:text-red-400',
        icon: <AlertIcon />,
      };
    default:
      return {
        bgColor: 'bg-gray-100 dark:bg-gray-700/50',
        iconColor: 'text-gray-600 dark:text-gray-400',
        icon: <CircleIcon />,
      };
  }
}

// Icon Components
function CircleIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="6" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ArchiveIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

/**
 * Single timeline entry component
 */
function TimelineEntry({
  entry,
  isLast,
}: {
  entry: ResolutionHistoryEntry;
  isLast: boolean;
}) {
  const statusStyle = getStatusStyle(entry.status);

  return (
    <div className="relative flex gap-4" data-testid="timeline-entry">
      {/* Timeline line */}
      {!isLast && (
        <div
          className="absolute left-[15px] top-8 w-0.5 h-[calc(100%-8px)] bg-gray-200 dark:bg-slate-600"
          aria-hidden="true"
        />
      )}

      {/* Status icon */}
      <div
        className={clsx(
          'relative flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          statusStyle.bgColor,
          statusStyle.iconColor
        )}
        data-testid="timeline-icon"
      >
        {statusStyle.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-6">
        <div className="flex items-center justify-between gap-2">
          <span
            className={clsx(
              'text-sm font-medium',
              'text-gray-900 dark:text-white'
            )}
            data-testid="timeline-status"
          >
            {getStatusDisplayName(entry.status)}
          </span>
          <time
            className="text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap"
            dateTime={entry.timestamp}
            title={formatTimestamp(entry.timestamp)}
            data-testid="timeline-timestamp"
          >
            {formatRelativeTime(entry.timestamp)}
          </time>
        </div>

        {/* User attribution */}
        <p
          className="text-xs text-gray-500 dark:text-slate-400 mt-0.5"
          data-testid="timeline-user"
        >
          by {entry.userId}
        </p>

        {/* Note if present */}
        {entry.note && (
          <div
            className={clsx(
              'mt-2 p-3 rounded-lg',
              'bg-gray-50 dark:bg-slate-700/50',
              'border border-gray-100 dark:border-slate-600'
            )}
            data-testid="timeline-note"
          >
            <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap">
              {entry.note}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Empty state when no history exists
 */
function EmptyState() {
  return (
    <div
      className="text-center py-6 text-gray-500 dark:text-slate-400"
      data-testid="timeline-empty"
    >
      <svg
        className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-slate-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <p className="text-sm">No resolution history yet</p>
    </div>
  );
}

/**
 * ResolutionTimeline Component
 * Displays the complete resolution history as a vertical timeline
 *
 * Requirements:
 * - 3.4: Display resolution history as timeline showing all status changes and notes
 */
export function ResolutionTimeline({
  history,
  className,
}: ResolutionTimelineProps): JSX.Element {
  // Sort history by timestamp (newest first)
  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  if (sortedHistory.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className={clsx('relative', className)} data-testid="resolution-timeline">
      {sortedHistory.map((entry, index) => (
        <TimelineEntry
          key={`${entry.timestamp}-${entry.status}-${index}`}
          entry={entry}
          isLast={index === sortedHistory.length - 1}
        />
      ))}
    </div>
  );
}

export default ResolutionTimeline;
