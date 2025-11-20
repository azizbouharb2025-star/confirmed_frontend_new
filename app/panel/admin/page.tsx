'use client'

import { UsersIcon, ShoppingBagIcon, CurrencyDollarIcon, ChartBarIcon, PhoneIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import MetricCard from '@/components/dashboard/MetricCard'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

const metrics = [
  { title: 'Total Users', value: 1247, change: 12.5, icon: <UsersIcon className="w-5 h-5" /> },
  { title: 'Total Orders', value: 8934, change: 8.2, icon: <ShoppingBagIcon className="w-5 h-5" /> },
  { title: 'Revenue', value: 245750, change: 15.3, icon: <CurrencyDollarIcon className="w-5 h-5" />, prefix: '$' },
  { title: 'Active Shops', value: 156, change: 5.7, icon: <BuildingStorefrontIcon className="w-5 h-5" /> },
  { title: 'Confirmation Rate', value: 87.5, change: 2.1, icon: <PhoneIcon className="w-5 h-5" />, suffix: '%', decimals: 1 },
  { title: 'System Health', value: 99.9, change: 0.1, icon: <ChartBarIcon className="w-5 h-5" />, suffix: '%', decimals: 1 }
]

const activities = [
  { action: 'New user registered', detail: 'john@example.com', time: '2 min ago' },
  { action: 'Order confirmed', detail: '#ORD-001', time: '5 min ago' },
  { action: 'Shop connected', detail: 'TechStore', time: '10 min ago' },
  { action: 'Payment processed', detail: '$299.99', time: '15 min ago' }
]

export default function AdminDashboard() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout userRole="admin">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
            <p className="text-sm dark:text-slate-400 light:text-gray-600 mt-1">Complete system overview and management</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.map((metric) => <MetricCard key={metric.title} {...metric} />)}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Orders Overview</h3>
              <div className="h-64 flex items-center justify-center dark:text-slate-400 light:text-gray-400">
                <div className="text-center">
                  <ChartBarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Chart will be implemented</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Revenue Trends</h3>
              <div className="h-64 flex items-center justify-center dark:text-slate-400 light:text-gray-400">
                <div className="text-center">
                  <CurrencyDollarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Chart will be implemented</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {activities.map((activity, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg dark:bg-slate-800/50 light:bg-gray-50">
                  <div>
                    <p className="font-medium text-sm">{activity.action}</p>
                    <p className="text-xs dark:text-slate-400 light:text-gray-600">{activity.detail}</p>
                  </div>
                  <span className="text-xs dark:text-slate-400 light:text-gray-500">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}