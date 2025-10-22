'use client'

import { PhoneIcon, ClockIcon, ChartBarIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import MetricCard from '@/components/dashboard/MetricCard'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useLanguage } from '@/hooks/useLanguage'
import Link from 'next/link'

const metrics = [
  { title: 'Queue Length', value: 15, icon: <ClockIcon className="w-5 h-5" /> },
  { title: "Today's Calls", value: 42, change: 12.5, icon: <PhoneIcon className="w-5 h-5" /> },
  { title: 'Confirmation Rate', value: 87.5, change: 2.1, icon: <ChartBarIcon className="w-5 h-5" />, suffix: '%', decimals: 1 },
  { title: 'Performance Rank', value: 3, icon: <ChartBarIcon className="w-5 h-5" /> }
]

export default function OperatorDashboard() {
  const { t } = useLanguage()

  return (
    <ProtectedRoute allowedRoles={['operator']}>
      <DashboardLayout userRole="operator">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">{t('dashboard.operator')}</h1>
            <p className="text-sm dark:text-slate-400 light:text-gray-600 mt-1">Manage your calls and track performance</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric) => <MetricCard key={metric.title} {...metric} />)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/panel/op/queue" className="card p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <PhoneIcon className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold">{t('nav.emission')}</h3>
                  <p className="text-sm dark:text-slate-400 light:text-gray-600">Make outgoing calls</p>
                </div>
              </div>
            </Link>

            <Link href="/panel/op/orders" className="card p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <ClipboardDocumentListIcon className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold">{t('nav.reception')}</h3>
                  <p className="text-sm dark:text-slate-400 light:text-gray-600">View order history</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}