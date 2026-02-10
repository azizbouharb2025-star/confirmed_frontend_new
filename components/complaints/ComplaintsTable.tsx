'use client';

/**
 * ComplaintsTable Component
 * Displays paginated complaints with required columns
 * Requirements: 2.2
 */

import React, { useCallback } from 'react';
import { clsx } from 'clsx';
import {
  Complaint,
  ComplaintStatus,
  getStatusDisplayName,
  getCategoryDisplayName,
} from '@/types/complaint';
import { useLanguage } from '@/hooks/useLanguage';
import type { TranslationKey } from '@/lib/i18n';

export interface ComplaintsTableProps {
  /** List of complaints to display */
  complaints: Complaint[];
  /** Whether data is loading */
  isLoading?: boolean;
  /** Error message if fetch failed */
  error?: string | null;
  /** Current page number */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of complaints */
  totalComplaints: number;
  /** Callback when a row is clicked */
  onRowClick?: (complaint: Complaint) => void;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Callback to retry after error */
  onRetry?: () => void;
  /** Optional className for styling */
  className?: string;
}

/**
 * Get status badge color classes
 */
function getStatusBadgeClasses(status: ComplaintStatus): string {
  const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
  
  switch (status) {
    case 'open':
      return clsx(baseClasses, 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400');
    case 'in_progress':
      return clsx(baseClasses, 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400');
    case 'resolved':
      return clsx(baseClasses, 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400');
    case 'closed':
      return clsx(baseClasses, 'bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-400');
    case 'escalated':
      return clsx(baseClasses, 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400');
    default:
      return clsx(baseClasses, 'bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-400');
  }
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Skeleton loading row component
 */
function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-3">
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-24" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-20" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-16" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-28" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-20" />
      </td>
    </tr>
  );
}

/**
 * Error state component
 */
function ErrorState({
  error,
  onRetry,
  t,
}: {
  error: string;
  onRetry?: () => void;
  t: (key: TranslationKey) => string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <svg
        className="w-12 h-12 text-red-500 mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <p className="text-gray-600 dark:text-slate-400 text-center mb-4">{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className={clsx(
            'px-4 py-2 rounded-lg font-medium text-sm',
            'bg-[#ADFF2F] text-gray-900 hover:bg-[#9AE62A]',
            'transition-colors duration-200'
          )}
          data-testid="retry-button"
        >
          {t('complaint.table.retry')}
        </button>
      )}
    </div>
  );
}

/**
 * Empty state component
 */
function EmptyState({ t }: { t: (key: TranslationKey) => string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <svg
        className="w-12 h-12 text-gray-400 dark:text-slate-500 mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
      <p className="text-gray-600 dark:text-slate-400 text-center">
        {t('complaint.table.noComplaints')}
      </p>
    </div>
  );
}

/**
 * Pagination component
 */
function Pagination({
  currentPage,
  totalPages,
  totalComplaints,
  pageSize,
  onPageChange,
  t,
}: {
  currentPage: number;
  totalPages: number;
  totalComplaints: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  t: (key: TranslationKey) => string;
}) {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalComplaints);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-slate-700">
      <div className="text-sm text-gray-600 dark:text-slate-400">
        {t('complaint.table.showing')} {startItem} {t('complaint.table.of')} {endItem} / {totalComplaints}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={clsx(
            'px-3 py-1 rounded-lg text-sm font-medium',
            'border border-gray-300 dark:border-slate-600',
            currentPage <= 1
              ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-slate-800'
              : 'bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700',
            'text-gray-700 dark:text-slate-300',
            'transition-colors duration-200'
          )}
          data-testid="prev-page-button"
        >
          {t('complaint.table.previous')}
        </button>
        <span className="text-sm text-gray-600 dark:text-slate-400">
          {t('complaint.table.page')} {currentPage} {t('complaint.table.of')} {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={clsx(
            'px-3 py-1 rounded-lg text-sm font-medium',
            'border border-gray-300 dark:border-slate-600',
            currentPage >= totalPages
              ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-slate-800'
              : 'bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700',
            'text-gray-700 dark:text-slate-300',
            'transition-colors duration-200'
          )}
          data-testid="next-page-button"
        >
          {t('complaint.table.next')}
        </button>
      </div>
    </div>
  );
}

/**
 * ComplaintsTable - Displays paginated complaints with required columns
 * 
 * Requirements:
 * - 2.2: Display complaints in a paginated table with columns for
 *        reference number, category, status, customer info, and creation date
 * - Implement row click to open detail panel
 * - Show status badges
 */
export function ComplaintsTable({
  complaints,
  isLoading = false,
  error = null,
  currentPage,
  totalPages,
  pageSize,
  totalComplaints,
  onRowClick,
  onPageChange,
  onRetry,
  className,
}: ComplaintsTableProps): JSX.Element {
  const { t } = useLanguage();

  /**
   * Handle row click
   */
  const handleRowClick = useCallback(
    (complaint: Complaint) => {
      if (onRowClick) {
        onRowClick(complaint);
      }
    },
    [onRowClick]
  );

  // Render error state
  if (error && !isLoading) {
    return (
      <div className={clsx('bg-white dark:bg-slate-800 rounded-lg shadow', className)}>
        <ErrorState error={error} onRetry={onRetry} t={t} />
      </div>
    );
  }

  // Render empty state
  if (!isLoading && complaints.length === 0) {
    return (
      <div className={clsx('bg-white dark:bg-slate-800 rounded-lg shadow', className)}>
        <EmptyState t={t} />
      </div>
    );
  }

  return (
    <div className={clsx('bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
          <thead className="bg-gray-50 dark:bg-slate-900/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                {t('complaint.table.reference')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                {t('complaint.table.category')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                {t('complaint.table.status')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                {t('complaint.table.customer')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                {t('complaint.table.date')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
            {isLoading ? (
              // Skeleton loading rows
              Array.from({ length: pageSize }).map((_, i) => (
                <SkeletonRow key={i} />
              ))
            ) : (
              // Data rows
              complaints.map((complaint) => (
                <tr
                  key={complaint._id}
                  onClick={() => handleRowClick(complaint)}
                  className={clsx(
                    'cursor-pointer transition-colors duration-150',
                    'hover:bg-gray-50 dark:hover:bg-slate-700/50'
                  )}
                  data-testid={`complaint-row-${complaint._id}`}
                >
                  <td className="px-4 py-3 text-sm">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {complaint.referenceNumber}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-300">
                    {getCategoryDisplayName(complaint.category)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={getStatusBadgeClasses(complaint.status)}>
                      {getStatusDisplayName(complaint.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div>
                      <p className="text-gray-900 dark:text-white">
                        {complaint.customerInfo.name}
                      </p>
                      <p className="text-gray-500 dark:text-slate-400 text-xs">
                        {complaint.customerInfo.phone}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-400">
                    {formatDate(complaint.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalComplaints={totalComplaints}
          pageSize={pageSize}
          onPageChange={onPageChange}
          t={t}
        />
      )}
    </div>
  );
}

export default ComplaintsTable;
