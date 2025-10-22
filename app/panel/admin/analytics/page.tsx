'use client'

import { useState, useEffect } from 'react'
import { ChartBarIcon, TrophyIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import MetricCard from '@/components/dashboard/MetricCard'
import api from '@/lib/api'

export default function Analytics() {
  const [dashboard, setDashboard] = useState<any>(null)
  const [operators, setOperators] = useState<any[]>([])
  const [revenue, setRevenue] = useState<any>(null)
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
            <h1 className="text-2xl font-semibold">Analytics Dashboard</h1>
            <p className="text-sm dark:text-slate-400 light:text-gray-600 mt-1">Performance metrics and insights</p>
          </div>

          {dashboard && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total Orders"
                value={dashboard.overview?.totalOrders || 0}
                icon={<ChartBarIcon className="w-5 h-5" />}
              />
              <MetricCard
                title="Confirmed"
                value={dashboard.overview?.confirmedOrders || 0}
                icon={<ChartBarIcon className="w-5 h-5" />}
              />
              <MetricCard
                title="Confirmation Rate"
                value={dashboard.overview?.confirmationRate || 0}
                suffix="%"
                decimals={1}
                icon={<ChartBarIcon className="w-5 h-5" />}
              />
              <MetricCard
                title="Avg Order Value"
                value={dashboard.overview?.averageOrderValue || 0}
                prefix="$"
                decimals={2}
                icon={<CurrencyDollarIcon className="w-5 h-5" />}
              />
            </div>
          )}

          {revenue && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CurrencyDollarIcon className="h-5 w-5" />
                Revenue Overview
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm dark:text-slate-400 light:text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-semibold text-green-500">${revenue.overview?.totalRevenue?.toFixed(2) || 0}</p>
                </div>
                <div>
                  <p className="text-sm dark:text-slate-400 light:text-gray-600">Monthly Revenue</p>
                  <p className="text-2xl font-semibold">${revenue.overview?.monthlyRevenue?.toFixed(2) || 0}</p>
                </div>
                <div>
                  <p className="text-sm dark:text-slate-400 light:text-gray-600">MRR</p>
                  <p className="text-2xl font-semibold">${revenue.subscriptionRevenue?.monthlyRecurringRevenue?.toFixed(2) || 0}</p>
                </div>
              </div>
            </div>
          )}

          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrophyIcon className="h-5 w-5" />
              Operator Performance
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="dark:bg-slate-800 light:bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Rank</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Total Calls</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Confirmed</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Rate</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Efficiency</th>
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
