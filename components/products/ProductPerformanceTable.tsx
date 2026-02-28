/**
 * Product Performance Table Component
 * Displays product performance metrics in a sortable table
 * Requirements: 10.3, 10.5, 10.6, 10.7
 */

'use client'

import { useState } from 'react'
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowsUpDownIcon,
  TrophyIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { useLanguage } from '@/hooks/useLanguage'
import ProductImageDisplay from './ProductImageDisplay'
import type { ProductPerformance } from '@/types/productPerformance'

interface ProductPerformanceTableProps {
  products: ProductPerformance[]
  loading?: boolean
}

type SortColumn = 'name' | 'salesVolume' | 'revenue' | 'returnRate' | 'avgAIScore'
type SortOrder = 'asc' | 'desc'

export default function ProductPerformanceTable({
  products,
  loading = false,
}: ProductPerformanceTableProps) {
  const { t } = useLanguage()
  const [sortColumn, setSortColumn] = useState<SortColumn>('revenue')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle sort order
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      // New column, default to descending
      setSortColumn(column)
      setSortOrder('desc')
    }
  }

  const sortedProducts = [...products].sort((a, b) => {
    let aValue: number | string
    let bValue: number | string

    switch (sortColumn) {
      case 'name':
        aValue = a.productName.toLowerCase()
        bValue = b.productName.toLowerCase()
        break
      case 'salesVolume':
        aValue = a.salesVolume
        bValue = b.salesVolume
        break
      case 'revenue':
        aValue = a.revenue
        bValue = b.revenue
        break
      case 'returnRate':
        aValue = a.returnRate
        bValue = b.returnRate
        break
      case 'avgAIScore':
        aValue = a.avgAIScore || 0
        bValue = b.avgAIScore || 0
        break
      default:
        return 0
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }

    return sortOrder === 'asc'
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number)
  })

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return <ArrowsUpDownIcon className="w-4 h-4 opacity-30" />
    }
    return sortOrder === 'asc' ? (
      <ArrowUpIcon className="w-4 h-4" />
    ) : (
      <ArrowDownIcon className="w-4 h-4" />
    )
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') {
      return <ArrowUpIcon className="w-4 h-4 text-green-500" />
    }
    if (trend === 'down') {
      return <ArrowDownIcon className="w-4 h-4 text-red-500" />
    }
    return <span className="text-slate-400">—</span>
  }

  const getAIScoreColor = (score?: number) => {
    if (!score) return 'text-slate-400'
    if (score < 40) return 'text-red-500'
    if (score < 70) return 'text-orange-500'
    return 'text-green-500'
  }

  if (loading) {
    return (
      <div className="card p-12 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="dark:text-slate-400 light:text-gray-600">
          {t('common.loading')}
        </p>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="dark:text-slate-400 light:text-gray-600">
          {t('products.noPerformanceData')}
        </p>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="dark:bg-slate-800/50 light:bg-gray-50 border-b dark:border-slate-700 light:border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold dark:text-slate-300 light:text-gray-700 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-2 hover:text-blue-500 transition-colors"
                >
                  {t('products.product')}
                  <SortIcon column="name" />
                </button>
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold dark:text-slate-300 light:text-gray-700 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('salesVolume')}
                  className="flex items-center gap-2 ml-auto hover:text-blue-500 transition-colors"
                >
                  {t('products.salesVolume')}
                  <SortIcon column="salesVolume" />
                </button>
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold dark:text-slate-300 light:text-gray-700 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('revenue')}
                  className="flex items-center gap-2 ml-auto hover:text-blue-500 transition-colors"
                >
                  {t('products.revenue')}
                  <SortIcon column="revenue" />
                </button>
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold dark:text-slate-300 light:text-gray-700 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('returnRate')}
                  className="flex items-center gap-2 ml-auto hover:text-blue-500 transition-colors"
                >
                  {t('products.returnRate')}
                  <SortIcon column="returnRate" />
                </button>
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold dark:text-slate-300 light:text-gray-700 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('avgAIScore')}
                  className="flex items-center gap-2 ml-auto hover:text-blue-500 transition-colors"
                >
                  {t('products.avgAIScore')}
                  <SortIcon column="avgAIScore" />
                </button>
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold dark:text-slate-300 light:text-gray-700 uppercase tracking-wider">
                {t('products.trend')}
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold dark:text-slate-300 light:text-gray-700 uppercase tracking-wider">
                {t('products.status')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-slate-700 light:divide-gray-200">
            {sortedProducts.map((product) => (
              <tr
                key={product.productId}
                className="hover:dark:bg-slate-800/30 hover:light:bg-gray-50 transition-colors"
              >
                {/* Product Name with Image */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                      <ProductImageDisplay
                        imageUrl={product.imageUrl}
                        productName={product.productName}
                        size="small"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{product.productName}</p>
                    </div>
                  </div>
                </td>

                {/* Sales Volume */}
                <td className="px-4 py-3 text-right font-medium">
                  {product.salesVolume.toLocaleString()}
                </td>

                {/* Revenue */}
                <td className="px-4 py-3 text-right font-medium text-blue-500">
                  ${product.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>

                {/* Return Rate */}
                <td className="px-4 py-3 text-right">
                  <span
                    className={`font-medium ${
                      product.returnRate > 15
                        ? 'text-red-500'
                        : product.returnRate > 10
                        ? 'text-orange-500'
                        : 'text-green-500'
                    }`}
                  >
                    {product.returnRate.toFixed(1)}%
                  </span>
                </td>

                {/* AI Score */}
                <td className="px-4 py-3 text-right">
                  <span className={`font-medium ${getAIScoreColor(product.avgAIScore)}`}>
                    {product.avgAIScore ? product.avgAIScore.toFixed(0) : 'N/A'}
                  </span>
                </td>

                {/* Trend */}
                <td className="px-4 py-3">
                  <div className="flex justify-center">
                    {getTrendIcon(product.trend)}
                  </div>
                </td>

                {/* Status Badges */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    {product.isTopPerformer && (
                      <div
                        className="flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-medium"
                        title={t('products.topPerforming')}
                      >
                        <TrophyIcon className="w-3 h-3" />
                        <span className="hidden sm:inline">Top</span>
                      </div>
                    )}
                    {product.isUnderperforming && (
                      <div
                        className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-medium"
                        title={t('products.underperforming')}
                      >
                        <ExclamationTriangleIcon className="w-3 h-3" />
                        <span className="hidden sm:inline">Risk</span>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
