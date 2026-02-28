'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import ErrorBoundary from '@/components/ErrorBoundary'
import { useLanguage } from '@/hooks/useLanguage'
import { useTheme } from '@/hooks/useTheme'
import { GlobalMetrics, OperatorFeedbackSummaryData } from '@/types/analytics'
import { ArrowDownTrayIcon, CalendarIcon } from '@heroicons/react/24/outline'
import { SkeletonMetricCard, SkeletonChart } from '@/components/ui/SkeletonLoader'
import OperatorFeedbackSummary from '@/components/analytics/OperatorFeedbackSummary'
import GlobalMetricsChart from '@/components/analytics/GlobalMetricsChart'
import toast from 'react-hot-toast'

/**
 * Analytics Page
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8
 * 
 * Features:
 * - Global metrics display
 * - Operator feedback summary
 * - Time range filtering
 * - Data export functionality
 */
export default function AnalyticsPage() {
  return (
    <ErrorBoundary>
      <ProtectedRoute allowedRoles={['shop_owner']}>
        <DashboardLayout userRole="shop_owner">
          <AnalyticsContent />
        </DashboardLayout>
      </ProtectedRoute>
    </ErrorBoundary>
  )
}

function AnalyticsContent() {
  const { t } = useLanguage()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [timeRange, setTimeRange] = useState<'today' | 'yesterday' | '7days' | '30days' | 'custom'>('30days')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [globalMetrics, setGlobalMetrics] = useState<GlobalMetrics | null>(null)
  const [operatorFeedback, setOperatorFeedback] = useState<OperatorFeedbackSummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  // Fetch analytics data
  useEffect(() => {
    fetchAnalyticsData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange, customStartDate, customEndDate])

  const fetchAnalyticsData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        preset: timeRange,
      })

      if (timeRange === 'custom' && customStartDate && customEndDate) {
        params.set('startDate', customStartDate)
        params.set('endDate', customEndDate)
      }

      // Fetch global metrics
      const metricsRes = await fetch(`/api/analytics/global?${params}`)
      const metricsData = await metricsRes.json()
      
      if (metricsData.success) {
        setGlobalMetrics(metricsData.metrics)
      }

      // Fetch operator feedback
      const feedbackRes = await fetch(`/api/analytics/operator-feedback?${params}`)
      const feedbackData = await feedbackRes.json()
      
      if (feedbackData.success) {
        setOperatorFeedback(feedbackData.data)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const body: Record<string, unknown> = {
        preset: timeRange,
        format: 'csv',
      }

      if (timeRange === 'custom' && customStartDate && customEndDate) {
        body.startDate = customStartDate
        body.endDate = customEndDate
      }

      const res = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        // Download CSV file
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `analytics-export-${Date.now()}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast.success('Analytics exported successfully')
      } else {
        throw new Error('Export failed')
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export analytics')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('analytics.title')}
          </h1>
          <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
            {t('analytics.subtitle')}
          </p>
        </div>

        <button
          onClick={handleExport}
          disabled={exporting || loading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            isDark
              ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-slate-700 disabled:text-slate-500'
              : 'bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-200 disabled:text-gray-400'
          }`}
          aria-label={t('analytics.exportData')}
        >
          <ArrowDownTrayIcon className="w-5 h-5" />
          {exporting ? 'Exporting...' : t('analytics.exportData')}
        </button>
      </div>

      {/* Time Range Filter */}
      <div className={`p-4 rounded-xl border ${
        isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-2 mb-3">
          <CalendarIcon className="w-5 h-5" />
          <h3 className="font-medium">{t('analytics.timeRange')}</h3>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {(['today', 'yesterday', '7days', '30days', 'custom'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-500 text-white'
                  : isDark
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t(`analytics.${range}` as keyof typeof t)}
            </button>
          ))}
        </div>

        {timeRange === 'custom' && (
          <div className="mt-4 flex gap-4">
            <div className="flex-1">
              <label className={`block text-sm font-medium mb-1 ${
                isDark ? 'text-slate-300' : 'text-gray-700'
              }`}>
                Start Date
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-slate-700 border-slate-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
            <div className="flex-1">
              <label className={`block text-sm font-medium mb-1 ${
                isDark ? 'text-slate-300' : 'text-gray-700'
              }`}>
                End Date
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-slate-700 border-slate-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <SkeletonMetricCard />
            <SkeletonMetricCard />
            <SkeletonMetricCard />
            <SkeletonMetricCard />
          </div>
          <SkeletonChart />
          <SkeletonChart />
        </div>
      )}

      {/* Content */}
      {!loading && (
        <div className="space-y-6">
          {/* Global Metrics */}
          {globalMetrics && (
            <GlobalMetricsChart metrics={globalMetrics} />
          )}

          {/* Operator Feedback */}
          {operatorFeedback && (
            <OperatorFeedbackSummary data={operatorFeedback} />
          )}
        </div>
      )}
    </div>
  )
}
