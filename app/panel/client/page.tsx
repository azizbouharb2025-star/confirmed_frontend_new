'use client'

import { ShoppingBagIcon, CheckCircleIcon, ChartBarIcon, ClockIcon, CurrencyDollarIcon, TruckIcon } from '@heroicons/react/24/outline'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import MetricCard from '@/components/dashboard/MetricCard'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useLanguage } from '@/hooks/useLanguage'
import Link from 'next/link'

const metrics = [
  { title: 'Total Orders', value: 342, icon: <ShoppingBagIcon className="w-5 h-5" /> },
  { title: 'Confirmed Orders', value: 289, change: 8.2, icon: <CheckCircleIcon className="w-5 h-5" /> },
  { title: 'Confirmation Rate', value: 84.5, change: 2.1, icon: <ChartBarIcon className="w-5 h-5" />, suffix: '%', decimals: 1 },
  { title: 'Revenue', value: 45750, change: 15.3, icon: <CurrencyDollarIcon className="w-5 h-5" />, prefix: '$', decimals: 0 }
]

export default function ClientDashboard() {
  const { t } = useLanguage()

  return (
    <ProtectedRoute allowedRoles={['shop_owner']}>
      <DashboardLayout userRole="shop_owner">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">{t('dashboard.client')}</h1>
            <p className="text-sm dark:text-slate-400 light:text-gray-600 mt-1">Monitor your store performance and orders</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric) => <MetricCard key={metric.title} {...metric} />)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/panel/client/orders" className="card p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <ShoppingBagIcon className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold">{t('nav.orders')}</h3>
                  <p className="text-sm dark:text-slate-400 light:text-gray-600">Manage your orders</p>
                </div>
              </div>
            </Link>

            <Link href="/panel/client/products" className="card p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <TruckIcon className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold">{t('nav.products')}</h3>
                  <p className="text-sm dark:text-slate-400 light:text-gray-600">View your products</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}