'use client'

import { GlobalMetrics } from '@/types/analytics'
import { useLanguage } from '@/hooks/useLanguage'
import { useTheme } from '@/hooks/useTheme'
import {
  ShoppingBagIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  TruckIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'

interface GlobalMetricsChartProps {
  metrics: GlobalMetrics
}

export default function GlobalMetricsChart({ metrics }: GlobalMetricsChartProps) {
  const { t } = useLanguage()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const metricCards = [
    {
      label: t('analytics.orderVolumes'),
      value: metrics.orderVolume.toLocaleString(),
      icon: ShoppingBagIcon,
      color: 'blue',
      bgColor: isDark ? 'bg-blue-500/20' : 'bg-blue-100',
      textColor: 'text-blue-500',
    },
    {
      label: t('analytics.confirmationRates'),
      value: `${metrics.confirmationRate.toFixed(1)}%`,
      icon: CheckCircleIcon,
      color: 'green',
      bgColor: isDark ? 'bg-green-500/20' : 'bg-green-100',
      textColor: 'text-green-500',
    },
    {
      label: 'Total Revenue',
      value: `${metrics.totalRevenue.toLocaleString()} TND`,
      icon: CurrencyDollarIcon,
      color: 'purple',
      bgColor: isDark ? 'bg-purple-500/20' : 'bg-purple-100',
      textColor: 'text-purple-500',
    },
    {
      label: 'Avg Order Value',
      value: `${metrics.averageOrderValue.toFixed(2)} TND`,
      icon: CurrencyDollarIcon,
      color: 'indigo',
      bgColor: isDark ? 'bg-indigo-500/20' : 'bg-indigo-100',
      textColor: 'text-indigo-500',
    },
    {
      label: 'Cancelled Orders',
      value: `${metrics.cancelledOrders} (${metrics.cancellationRate.toFixed(1)}%)`,
      icon: XCircleIcon,
      color: 'red',
      bgColor: isDark ? 'bg-red-500/20' : 'bg-red-100',
      textColor: 'text-red-500',
    },
    {
      label: 'Delivery Success Rate',
      value: `${metrics.deliverySuccessRate.toFixed(1)}%`,
      icon: TruckIcon,
      color: 'emerald',
      bgColor: isDark ? 'bg-emerald-500/20' : 'bg-emerald-100',
      textColor: 'text-emerald-500',
    },
    {
      label: 'Avg Delivery Time',
      value: `${metrics.averageDeliveryTime.toFixed(1)} days`,
      icon: ClockIcon,
      color: 'amber',
      bgColor: isDark ? 'bg-amber-500/20' : 'bg-amber-100',
      textColor: 'text-amber-500',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-lg ${
          isDark ? 'bg-blue-500/20' : 'bg-blue-100'
        }`}>
          <ShoppingBagIcon className="w-6 h-6 text-blue-500" />
        </div>
        <div>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('analytics.globalMetrics')}
          </h2>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
            Overview of your shop performance
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {metricCards.map((card, index) => (
          <div
            key={index}
            className={`p-4 rounded-xl border transition-all hover:shadow-lg ${
              isDark
                ? 'bg-slate-800 border-slate-700 hover:border-slate-600'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`w-5 h-5 ${card.textColor}`} />
              </div>
            </div>
            
            <div className={`text-2xl font-bold mb-1 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {card.value}
            </div>
            
            <div className={`text-sm ${
              isDark ? 'text-slate-400' : 'text-gray-600'
            }`}>
              {card.label}
            </div>
          </div>
        ))}
      </div>

      {/* Performance Summary */}
      <div className={`p-6 rounded-xl border ${
        isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          {t('analytics.performanceTrends')}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Confirmation Performance */}
          <div>
            <div className={`text-sm font-medium mb-2 ${
              isDark ? 'text-slate-300' : 'text-gray-700'
            }`}>
              Confirmation Performance
            </div>
            <div className="relative pt-1">
              <div className={`flex mb-2 items-center justify-between text-xs ${
                isDark ? 'text-slate-400' : 'text-gray-600'
              }`}>
                <span>Confirmed</span>
                <span>{metrics.confirmationRate.toFixed(1)}%</span>
              </div>
              <div className={`overflow-hidden h-2 text-xs flex rounded-full ${
                isDark ? 'bg-slate-700' : 'bg-gray-200'
              }`}>
                <div
                  style={{ width: `${metrics.confirmationRate}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500 transition-all duration-500"
                />
              </div>
            </div>
          </div>

          {/* Delivery Performance */}
          <div>
            <div className={`text-sm font-medium mb-2 ${
              isDark ? 'text-slate-300' : 'text-gray-700'
            }`}>
              Delivery Performance
            </div>
            <div className="relative pt-1">
              <div className={`flex mb-2 items-center justify-between text-xs ${
                isDark ? 'text-slate-400' : 'text-gray-600'
              }`}>
                <span>Success Rate</span>
                <span>{metrics.deliverySuccessRate.toFixed(1)}%</span>
              </div>
              <div className={`overflow-hidden h-2 text-xs flex rounded-full ${
                isDark ? 'bg-slate-700' : 'bg-gray-200'
              }`}>
                <div
                  style={{ width: `${metrics.deliverySuccessRate}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500 transition-all duration-500"
                />
              </div>
            </div>
          </div>

          {/* Cancellation Rate */}
          <div>
            <div className={`text-sm font-medium mb-2 ${
              isDark ? 'text-slate-300' : 'text-gray-700'
            }`}>
              Cancellation Rate
            </div>
            <div className="relative pt-1">
              <div className={`flex mb-2 items-center justify-between text-xs ${
                isDark ? 'text-slate-400' : 'text-gray-600'
              }`}>
                <span>Cancelled</span>
                <span>{metrics.cancellationRate.toFixed(1)}%</span>
              </div>
              <div className={`overflow-hidden h-2 text-xs flex rounded-full ${
                isDark ? 'bg-slate-700' : 'bg-gray-200'
              }`}>
                <div
                  style={{ width: `${metrics.cancellationRate}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-red-500 transition-all duration-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
