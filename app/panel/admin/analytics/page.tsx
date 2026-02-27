'use client'

import { useState, useEffect } from 'react'
import { ChartBarIcon, TrophyIcon, BanknotesIcon } from '@heroicons/react/24/outline'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import MetricCard from '@/components/dashboard/MetricCard'
import { useLanguage } from '@/hooks/useLanguage'
import api from '@/lib/api'

interface DashboardData {
  overview?: {
    totalOrders?: number;
    confirmedOrders?: number;
    confirmationRate?: number;
    totalRevenue?: number;
    averageOrderValue?: number;
  };
}

interface OperatorMetric {
  operatorId?: string;
  operatorName?: string;
  name?: string;
  confirmationRate?: number;
  totalCalls?: number;
  confirmedCalls?: number;
  efficiency?: number;
  performance?: {
    totalCalls?: number;
    confirmedOrders?: number;
    confirmationRate?: number;
  };
  trends?: {
    efficiency?: string;
  };
}

interface RevenueData {
  totalRevenue?: number;
  monthlyGrowth?: number;
  overview?: {
    totalRevenue?: number;
    monthlyRevenue?: number;
  };
  subscriptionRevenue?: {
    monthlyRecurringRevenue?: number;
  };
}

export default function Analytics() {
  const { t } = useLanguage()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [operators, setOperators] = useState<OperatorMetric[]>([])
  const [revenue, setRevenue] = useState<RevenueData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, opRes, revRes] = await Promise.all([
          api.get('/api/analytics/dashboard'),
          api.get('/api/analytics/operator-performance'),
          api.get('/api/analytics/revenue')
        ])
        setDashboard(dashRes.data)
        setOperators(opRes.data.operatorMetrics || [])
        setRevenue(revRes.data)
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['admin']}>
        <DashboardLayout userRole="admin">
          <div className="space-y-6">
            <div className="animate-pulse space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 rounded-lg dark:bg-slate-800 light:bg-gray-100" />
              ))}
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout userRole="admin">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">{t('page.analytics')}</h1>
            <p className="text-sm dark:text-slate-400 light:text-gray-600 mt-1">{t('page.analyticsDesc')}</p>
          </div>

          {dashboard && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title={t('metric.totalOrders')}
                value={dashboard.overview?.totalOrders || 0}
                icon={<ChartBarIcon className="w-5 h-5" />}
              />
              <MetricCard
                title={t('metric.confirmed')}
                value={dashboard.overview?.confirmedOrders || 0}
                icon={<ChartBarIcon className="w-5 h-5" />}
              />
              <MetricCard
                title={t('metric.confirmationRate')}
                value={dashboard.overview?.confirmationRate || 0}
                suffix="%"
                decimals={1}
                icon={<ChartBarIcon className="w-5 h-5" />}
              />
              <MetricCard
                title={t('metric.avgOrderValue')}
                value={dashboard.overview?.averageOrderValue || 0}
                suffix=" TND"
                decimals={2}
                icon={<BanknotesIcon className="w-5 h-5" />}
              />
            </div>
          )}

          {revenue && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BanknotesIcon className="h-5 w-5" />
                {t('section.revenueOverview')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm dark:text-slate-400 light:text-gray-600">{t('metric.totalRevenue')}</p>
                  <p className="text-2xl font-semibold text-green-500">{revenue.overview?.totalRevenue?.toFixed(2) || 0} TND</p>
                </div>
                <div>
                  <p className="text-sm dark:text-slate-400 light:text-gray-600">{t('metric.monthlyRevenue')}</p>
                  <p className="text-2xl font-semibold">{revenue.overview?.monthlyRevenue?.toFixed(2) || 0} TND</p>
                </div>
                <div>
                  <p className="text-sm dark:text-slate-400 light:text-gray-600">{t('metric.mrr')}</p>
                  <p className="text-2xl font-semibold">{revenue.subscriptionRevenue?.monthlyRecurringRevenue?.toFixed(2) || 0} TND</p>
                </div>
              </div>
            </div>
          )}

          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrophyIcon className="h-5 w-5" />
              {t('section.operatorPerformance')}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="dark:bg-slate-800 light:bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">{t('label.rank')}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">{t('table.name')}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">{t('label.totalCalls')}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">{t('metric.confirmed')}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">{t('label.rate')}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">{t('label.efficiency')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-800 light:divide-gray-200">
                  {operators.map((op, idx) => (
                    <tr key={op.operatorId} className="dark:hover:bg-slate-800/50 light:hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold">{idx + 1}</td>
                      <td className="px-4 py-3">{op.operatorName}</td>
                      <td className="px-4 py-3">{op.performance?.totalCalls || 0}</td>
                      <td className="px-4 py-3">{op.performance?.confirmedOrders || 0}</td>
                      <td className="px-4 py-3">
                        <span className="text-green-500 font-semibold">
                          {op.performance?.confirmationRate?.toFixed(1) || 0}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          op.trends?.efficiency === 'excellent' ? 'bg-green-500/10 text-green-500' :
                          op.trends?.efficiency === 'good' ? 'bg-blue-500/10 text-blue-500' :
                          'bg-yellow-500/10 text-yellow-500'
                        }`}>
                          {op.trends?.efficiency || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
