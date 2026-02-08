'use client';

/**
 * Complaints Analytics Dashboard Page
 * Displays complaint analytics for Business+ subscribers
 * Requirements: 5.1, 5.5
 */

import React, { useState, useCallback, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { WidgetGate } from '@/components/dashboard/WidgetGate';
import { useSubscription } from '@/hooks/useSubscription';
import { complaintService, downloadComplaintCSV } from '@/services/complaintService';
import { ComplaintAnalytics, ComplaintFilters } from '@/types/complaint';
import AnalyticsCharts from '@/components/complaints/AnalyticsCharts';
import ResolutionMetrics from '@/components/complaints/ResolutionMetrics';
import { ArrowDownTrayIcon, CalendarIcon } from '@heroicons/react/24/outline';

/**
 * ComplaintsAnalyticsPage - Analytics dashboard for Business+ sellers
 * 
 * Features:
 * - Tier gating for Business+ access (Requirements: 5.5)
 * - Charts showing complaints by product, region, category (Requirements: 5.1)
 * - Resolution rate and average resolution time metrics (Requirements: 5.2)
 * - Date range picker (Requirements: 5.3)
 * - CSV export functionality (Requirements: 5.4)
 */
export default function ComplaintsAnalyticsPage() {
  const { plan } = useSubscription();
  
  // Analytics data state
  const [analytics, setAnalytics] = useState<ComplaintAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Date range state
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Export state
  const [isExporting, setIsExporting] = useState(false);

  /**
   * Fetch analytics data from API
   * Requirements: 5.1
   */
  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params: { startDate?: string; endDate?: string } = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const data = await complaintService.getAnalytics(params);
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  // Fetch analytics on mount and when date range changes
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  /**
   * Handle date range change
   * Requirements: 5.3
   */
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
  };

  /**
   * Handle CSV export
   * Requirements: 5.4
   */
  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const filters: ComplaintFilters = {};
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      
      const blob = await complaintService.exportComplaints(filters);
      const filename = `complaints-export-${new Date().toISOString().split('T')[0]}.csv`;
      downloadComplaintCSV(blob, filename);
    } catch (err) {
      console.error('Failed to export complaints:', err);
      setError('Failed to export complaints. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Handle retry after error
   */
  const handleRetry = () => {
    fetchAnalytics();
  };

  return (
    <DashboardLayout userRole="shop_owner">
      <WidgetGate
        requiredPlan="business"
        currentPlan={plan}
        featureName="Complaints Analytics"
        featureDescription="View detailed analytics on complaints by product, region, and category with resolution metrics"
      >
        <div className="p-6 space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Complaints Analytics
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                Analyze complaint trends and resolution performance
              </p>
            </div>
            
            {/* Date Range and Export Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Date Range Picker - Requirements: 5.3 */}
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={handleStartDateChange}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Start date"
                />
                <span className="text-gray-500 dark:text-slate-400">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={handleEndDateChange}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="End date"
                />
              </div>
              
              {/* Export Button - Requirements: 5.4 */}
              <button
                onClick={handleExport}
                disabled={isExporting || isLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                {isExporting ? 'Exporting...' : 'Export CSV'}
              </button>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-700 dark:text-red-400">{error}</p>
              <button
                onClick={handleRetry}
                className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Resolution Metrics - Requirements: 5.2 */}
          <ResolutionMetrics
            resolutionRate={analytics?.resolutionRate ?? 0}
            averageResolutionTime={analytics?.averageResolutionTime ?? 0}
            totalComplaints={analytics?.totalComplaints ?? 0}
            isLoading={isLoading}
          />

          {/* Analytics Charts - Requirements: 5.1 */}
          <AnalyticsCharts
            byProduct={analytics?.byProduct ?? []}
            byRegion={analytics?.byRegion ?? []}
            byCategory={analytics?.byCategory ?? []}
            isLoading={isLoading}
          />
        </div>
      </WidgetGate>
    </DashboardLayout>
  );
}
