/**
 * Product Performance Chart Component
 * Displays product performance metrics in visual charts
 * Requirements: 10.3, 10.8
 */

'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useLanguage } from '@/hooks/useLanguage'
import type { ProductPerformance } from '@/types/productPerformance'

interface ProductPerformanceChartProps {
  products: ProductPerformance[]
  metric: 'sales' | 'revenue' | 'returns'
}

export default function ProductPerformanceChart({
  products,
  metric,
}: ProductPerformanceChartProps) {
  const { t } = useLanguage()

  // Prepare chart data - show top 10 products by selected metric
  const sortedProducts = [...products]
    .sort((a, b) => {
      switch (metric) {
        case 'sales':
          return b.salesVolume - a.salesVolume
        case 'revenue':
          return b.revenue - a.revenue
        case 'returns':
          return b.returnRate - a.returnRate
        default:
          return 0
      }
    })
    .slice(0, 10)

  const chartData = sortedProducts.map((product) => ({
    name: product.productName.length > 20 
      ? product.productName.substring(0, 20) + '...' 
      : product.productName,
    value:
      metric === 'sales'
        ? product.salesVolume
        : metric === 'revenue'
        ? product.revenue
        : product.returnRate,
  }))

  const getChartTitle = () => {
    switch (metric) {
      case 'sales':
        return t('products.topBySales')
      case 'revenue':
        return t('products.topByRevenue')
      case 'returns':
        return t('products.highestReturns')
      default:
        return ''
    }
  }

  const getValueLabel = () => {
    switch (metric) {
      case 'sales':
        return t('products.salesVolume')
      case 'revenue':
        return t('products.revenue')
      case 'returns':
        return t('products.returnRate')
      default:
        return ''
    }
  }

  const getBarColor = () => {
    switch (metric) {
      case 'sales':
        return '#3b82f6' // blue
      case 'revenue':
        return '#10b981' // green
      case 'returns':
        return '#ef4444' // red
      default:
        return '#3b82f6'
    }
  }

  if (products.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="dark:text-slate-400 light:text-gray-600">
          {t('products.noChartData')}
        </p>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold mb-4">{getChartTitle()}</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={100}
            tick={{ fill: '#9ca3af', fontSize: 12 }}
          />
          <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#fff',
            }}
            formatter={(value: number) => {
              if (metric === 'revenue') {
                return `$${value.toFixed(2)}`
              }
              if (metric === 'returns') {
                return `${value.toFixed(1)}%`
              }
              return value.toLocaleString()
            }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Bar
            dataKey="value"
            fill={getBarColor()}
            name={getValueLabel()}
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
