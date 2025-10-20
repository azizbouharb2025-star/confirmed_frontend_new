'use client'

import { motion } from 'framer-motion'
import { 
  UsersIcon, 
  ShoppingBagIcon, 
  CurrencyDollarIcon, 
  ChartBarIcon,
  PhoneIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import MetricCard from '@/components/dashboard/MetricCard'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

const mockMetrics = [
  {
    title: 'Total Users',
    value: 1247,
    change: 12.5,
    icon: <UsersIcon className="w-full h-full" />,
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    title: 'Total Orders',
    value: 8934,
    change: 8.2,
    icon: <ShoppingBagIcon className="w-full h-full" />,
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    title: 'Revenue',
    value: 245750,
    change: 15.3,
    icon: <CurrencyDollarIcon className="w-full h-full" />,
    gradient: 'from-green-500 to-emerald-500',
    prefix: '$',
    decimals: 0
  },
  {
    title: 'Active Shops',
    value: 156,
    change: 5.7,
    icon: <BuildingStorefrontIcon className="w-full h-full" />,
    gradient: 'from-orange-500 to-red-500'
  },
  {
    title: 'Confirmation Rate',
    value: 87.5,
    change: 2.1,
    icon: <PhoneIcon className="w-full h-full" />,
    gradient: 'from-indigo-500 to-purple-500',
    suffix: '%',
    decimals: 1
  },
  {
    title: 'System Health',
    value: 99.9,
    change: 0.1,
    icon: <ChartBarIcon className="w-full h-full" />,
    gradient: 'from-teal-500 to-green-500',
    suffix: '%',
    decimals: 1
  }
]

export default function AdminDashboard() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout userRole="admin">
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h1 className="text-4xl font-bold gradient-text">Admin Dashboard</h1>
          <p className="text-slate-400 text-lg">
            Complete system overview and management
          </p>
        </motion.div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockMetrics.map((metric, index) => (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <MetricCard {...metric} />
            </motion.div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Orders Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className="glass-card p-6"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Orders Overview</h3>
            <div className="h-64 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <ChartBarIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Chart component will be implemented here</p>
              </div>
            </div>
          </motion.div>

          {/* Revenue Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.0 }}
            className="glass-card p-6"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Revenue Trends</h3>
            <div className="h-64 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <CurrencyDollarIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Revenue chart will be implemented here</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="glass-card p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-6">Recent System Activity</h3>
          <div className="space-y-4">
            {[
              { action: 'New user registered', user: 'john@example.com', time: '2 minutes ago' },
              { action: 'Order confirmed', order: '#ORD-001', time: '5 minutes ago' },
              { action: 'Shop connected', shop: 'TechStore', time: '10 minutes ago' },
              { action: 'Payment processed', amount: '$299.99', time: '15 minutes ago' },
            ].map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.4 + index * 0.1 }}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div>
                  <p className="text-white font-medium">{activity.action}</p>
                  <p className="text-slate-400 text-sm">
                    {activity.user || activity.order || activity.shop || activity.amount}
                  </p>
                </div>
                <span className="text-slate-400 text-sm">{activity.time}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}