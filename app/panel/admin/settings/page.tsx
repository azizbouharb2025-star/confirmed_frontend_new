'use client'

import { useState, useEffect } from 'react'
import { CogIcon, ServerIcon, CreditCardIcon } from '@heroicons/react/24/outline'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import api from '@/lib/api'

export default function SystemSettings() {
  const [health, setHealth] = useState<any>(null)
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [healthRes, plansRes] = await Promise.all([
          api.get('/health/detailed'),
          api.get('/api/subscriptions/plans')
        ])
        setHealth(healthRes.data)
        setPlans(plansRes.data)
      } catch (error) {
        console.error('Failed to fetch data:', error)
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
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 rounded-lg dark:bg-slate-800 light:bg-gray-100" />
            ))}
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
            <h1 className="text-2xl font-semibold">System Settings</h1>
            <p className="text-sm dark:text-slate-400 light:text-gray-600 mt-1">System health and configuration</p>
          </div>

          {health && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ServerIcon className="h-5 w-5" />
                System Health
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg dark:bg-slate-800 light:bg-gray-50">
                  <p className="text-sm dark:text-slate-400 light:text-gray-600 mb-1">MongoDB</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      health.services?.mongodb?.status === 'connected' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="font-medium">{health.services?.mongodb?.status || 'Unknown'}</span>
                  </div>
                </div>

                <div className="p-4 rounded-lg dark:bg-slate-800 light:bg-gray-50">
                  <p className="text-sm dark:text-slate-400 light:text-gray-600 mb-1">Redis</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      health.services?.redis?.status === 'connected' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="font-medium">{health.services?.redis?.status || 'Unknown'}</span>
                  </div>
                </div>

                <div className="p-4 rounded-lg dark:bg-slate-800 light:bg-gray-50">
                  <p className="text-sm dark:text-slate-400 light:text-gray-600 mb-1">Queue</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      health.services?.queue?.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="font-medium">{health.services?.queue?.status || 'Unknown'}</span>
                  </div>
                </div>
              </div>

              {health.systemMetrics && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm dark:text-slate-400 light:text-gray-600">Memory Usage</p>
                    <p className="text-lg font-semibold">{health.systemMetrics.memory?.percentage?.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm dark:text-slate-400 light:text-gray-600">CPU Usage</p>
                    <p className="text-lg font-semibold">{health.systemMetrics.cpu?.usage?.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm dark:text-slate-400 light:text-gray-600">Disk Usage</p>
                    <p className="text-lg font-semibold">{health.systemMetrics.disk?.percentage?.toFixed(1)}%</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CreditCardIcon className="h-5 w-5" />
              Subscription Plans
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <div key={plan.id} className="p-4 rounded-lg border dark:border-slate-700 light:border-gray-200">
                  <h3 className="font-semibold text-lg mb-2">{plan.name}</h3>
                  <p className="text-2xl font-bold mb-4">
                    ${plan.price}
                    <span className="text-sm font-normal dark:text-slate-400 light:text-gray-600">/month</span>
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="dark:text-slate-400 light:text-gray-600">Operators</span>
                      <span className="font-medium">{plan.features.maxOperators === -1 ? 'Unlimited' : plan.features.maxOperators}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="dark:text-slate-400 light:text-gray-600">AI Calls</span>
                      <span className="font-medium">{plan.features.maxAICalls === -1 ? 'Unlimited' : plan.features.maxAICalls}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="dark:text-slate-400 light:text-gray-600">Shops</span>
                      <span className="font-medium">{plan.features.maxShops === -1 ? 'Unlimited' : plan.features.maxShops}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
