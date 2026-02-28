/**
 * Product Performance Tab Component
 * Main container for product performance metrics
 * Requirements: 10.1, 10.2, 10.8, 10.10
 */

'use client'

import { useState, useEffect } from 'react'
import {
  ArrowDownTrayIcon,
  CalendarIcon,
  ChartBarIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline'
import { useLanguage } from '@/hooks/useLanguage'
import { SkeletonMetricCard, SkeletonTable, SkeletonChart } from '@/components/ui/SkeletonLoader'
import api from '@/lib/api'
import logger from '@/lib/logger'
import ProductPerformanceTable from './ProductPerformanceTable'
import ProductPerformanceChart from './ProductPerformanceChart'
import type { ProductPerformance, TimeRange } from '@/types/productPerformance'

interface ProductPerformanceTabProps {
  shopId: string
}

type ViewMode = 'table' | 'chart'
type ChartMetric = 'sales' | 'revenue' | 'returns'

export default function ProductPerformanceTab({ shopId }: ProductPerformanceTabProps) {
  const { t } = useLanguage()
  const [products, setProducts] = useState<ProductPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [chartMetric, setChartMetric] = useState<ChartMetric>('revenue')
  const [timeRangePreset, setTimeRangePreset] = useState<TimeRange['preset']>('30days')

  useEffect(() => {
    if (shopId) {
      fetchPerformanceData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId, timeRangePreset])

  const fetchPerformanceData = async () => {
    try {
      setLoading(true)

      // Calculate date range based on preset
      const end = new Date()
      const start = new Date()

      switch (timeRangePreset) {
        case 'today':
          start.setHours(0, 0, 0, 0)
          break
        case 'yesterday':
          start.setDate(start.getDate() - 1)
          start.setHours(0, 0, 0, 0)
          end.setDate(end.getDate() - 1)
          end.setHours(23, 59, 59, 999)
          break
        case '7days':
          start.setDate(start.getDate() - 7)
          break
        case '30days':
        default:
          start.setDate(start.getDate() - 30)
          break
      }

      const params = new URLSearchParams()
      params.set('shopId', shopId)
      params.set('startDate', start.toISOString())
      params.set('endDate', end.toISOString())
      if (timeRangePreset) {
        params.set('preset', timeRangePreset)
      }

      const response = await api.get(`/api/products/performance?${params.toString()}`)

      if (response.data.products) {
        setProducts(response.data.products)
      }
    } catch (error) {
      logger.error('Failed to fetch product performance:', error, 'ProductPerformance')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      setExporting(true)

      // Calculate time range
      const end = new Date()
      const start = new Date()
      switch (timeRangePreset) {
        case 'today':
          start.setHours(0, 0, 0, 0)
          break
        case 'yesterday':
          start.setDate(start.getDate() - 1)
          start.setHours(0, 0, 0, 0)
          end.setDate(end.getDate() - 1)
          end.setHours(23, 59, 59, 999)
          break
        case '7days':
          start.setDate(start.getDate() - 7)
          break
        case '30days':
        default:
          start.setDate(start.getDate() - 30)
          break
      }

      const timeRange: TimeRange = {
        start,
        end,
        preset: timeRangePreset,
      }

      // Use fetch directly for blob response
      const response = await fetch('/api/products/performance/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          products,
          timeRange,
        }),
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      // Create download link
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `product-performance-${Date.now()}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      logger.info('Exported product performance data', 'ProductPerformance')
    } catch (error) {
      logger.error('Failed to export product performance:', error, 'ProductPerformance')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 dark:text-slate-400 light:text-gray-500 pointer-events-none" />
            <select
              value={timeRangePreset}
              onChange={(e) => setTimeRangePreset(e.target.value as TimeRange['preset'])}
              className="appearance-none pl-10 pr-10 py-2.5 rounded-lg dark:bg-slate-800 light:bg-white border-2 dark:border-slate-700 light:border-gray-300 dark:text-white light:text-gray-900 font-medium outline-none focus:border-blue-500 transition-colors cursor-pointer"
            >
              <option value="today">{t('analytics.today')}</option>
              <option value="yesterday">{t('analytics.yesterday')}</option>
              <option value="7days">{t('analytics.7days')}</option>
              <option value="30days">{t('analytics.30days')}</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 p-1 dark:bg-slate-800 light:bg-gray-100 rounded-lg">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                viewMode === 'table'
                  ? 'bg-blue-500 text-white'
                  : 'dark:text-slate-400 light:text-gray-600 hover:dark:text-white hover:light:text-gray-900'
              }`}
            >
              <TableCellsIcon className="w-4 h-4" />
              <span className="text-sm font-medium">{t('products.tableView')}</span>
            </button>
            <button
              onClick={() => setViewMode('chart')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                viewMode === 'chart'
                  ? 'bg-blue-500 text-white'
                  : 'dark:text-slate-400 light:text-gray-600 hover:dark:text-white hover:light:text-gray-900'
              }`}
            >
              <ChartBarIcon className="w-4 h-4" />
              <span className="text-sm font-medium">{t('products.chartView')}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Chart Metric Selector (only visible in chart mode) */}
          {viewMode === 'chart' && (
            <select
              value={chartMetric}
              onChange={(e) => setChartMetric(e.target.value as ChartMetric)}
              className="appearance-none px-4 pr-10 py-2.5 rounded-lg dark:bg-slate-800 light:bg-white border-2 dark:border-slate-700 light:border-gray-300 dark:text-white light:text-gray-900 font-medium outline-none focus:border-blue-500 transition-colors cursor-pointer"
            >
              <option value="sales">{t('products.salesVolume')}</option>
              <option value="revenue">{t('products.revenue')}</option>
              <option value="returns">{t('products.returnRate')}</option>
            </select>
          )}

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={exporting || products.length === 0}
            className="flex items-center gap-2 px-4 py-2 dark:bg-slate-800 light:bg-white border dark:border-slate-700 light:border-gray-300 rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label={t('products.exportPerformance')}
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            {exporting ? t('products.exporting') : t('products.exportPerformance')}
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SkeletonMetricCard />
          <SkeletonMetricCard />
          <SkeletonMetricCard />
          <SkeletonMetricCard />
        </div>
      ) : products.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card p-4">
            <p className="text-sm dark:text-slate-400 light:text-gray-600 mb-1">
              {t('products.totalProducts')}
            </p>
            <p className="text-2xl font-bold">{products.length}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm dark:text-slate-400 light:text-gray-600 mb-1">
              {t('products.totalRevenue')}
            </p>
            <p className="text-2xl font-bold text-blue-500">
              ${products.reduce((sum, p) => sum + p.revenue, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-sm dark:text-slate-400 light:text-gray-600 mb-1">
              {t('products.avgReturnRate')}
            </p>
            <p className="text-2xl font-bold text-orange-500">
              {(products.reduce((sum, p) => sum + p.returnRate, 0) / products.length).toFixed(1)}%
            </p>
          </div>
          <div className="card p-4">
            <p className="text-sm dark:text-slate-400 light:text-gray-600 mb-1">
              {t('products.topPerformers')}
            </p>
            <p className="text-2xl font-bold text-yellow-500">
              {products.filter((p) => p.isTopPerformer).length}
            </p>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        viewMode === 'table' ? <SkeletonTable rows={8} /> : <SkeletonChart />
      ) : viewMode === 'table' ? (
        <ProductPerformanceTable products={products} loading={loading} />
      ) : (
        <ProductPerformanceChart products={products} metric={chartMetric} />
      )}
    </div>
  )
}
