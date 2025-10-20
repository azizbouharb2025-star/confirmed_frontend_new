'use client'

import { motion } from 'framer-motion'
import { 
  ShoppingBagIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  TruckIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import MetricCard from '@/components/dashboard/MetricCard'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

const mockMetrics = [
  {
    title: 'Total Orders',
    value: 342,
    change: 12.5,
    icon: <ShoppingBagIcon className="w-full h-full" />,
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    title: 'Confirmed Orders',
    value: 289,
    change: 8.2,
    icon: <CheckCircleIcon className="w-full h-full" />,
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    title: 'Revenue',
    value: 45750,
    change: 15.3,
    icon: <CurrencyDollarIcon className="w-full h-full" />,
    gradient: 'from-purple-500 to-pink-500',
    prefix: '$',
    decimals: 0
  },
  {
    title: 'Confirmation Rate',
    value: 84.5,
    change: 2.1,
    icon: <ChartBarIcon className="w-full h-full" />,
    gradient: 'from-orange-500 to-red-500',
    suffix: '%',
    decimals: 1
  },
  {
    title: 'Pending Orders',
    value: 23,
    change: -5.2,
    icon: <ClockIcon className="w-full h-full" />,
    gradient: 'from-yellow-500 to-orange-500'
  },
  {
    title: 'Shipped Orders',
    value: 267,
    change: 18.7,
    icon: <TruckIcon className="w-full h-full" />,
    gradient: 'from-indigo-500 to-purple-500'
  }
]

const recentOrders = [
  { id: 'ORD-001', customer: 'John Doe', amount: '$299.99', status: 'confirmed', time: '2 min ago' },
  { id: 'ORD-002', customer: 'Jane Smith', amount: '$149.50', status: 'pending', time: '5 min ago' },
  { id: 'ORD-003', customer: 'Bob Johnson', amount: '$89.99', status: 'shipped', time: '10 min ago' },
  { id: 'ORD-004', customer: 'Alice Brown', amount: '$199.99', status: 'confirmed', time: '15 min ago' },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed': return 'text-green-400 bg-green-500/20'
    case 'pending': return 'text-yellow-400 bg-yellow-500/20'
    case 'shipped': return 'text-blue-400 bg-blue-500/20'
    case 'rejected': return 'text-red-400 bg-red-500/20'
    default: return 'text-slate-400 bg-slate-500/20'
  }
}

export default function ClientDashboard() {
  return (
    <ProtectedRoute allowedRoles={['shop_owner']}>
      <DashboardLayout userRole="shop_owner">
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-3">
            <BuildingStorefrontIcon className="w-8 h-8 text-primary-500" />
            <h1 className="text-4xl font-bold gradient-text">Shop Dashboard</h1>
          </div>
          <p className="text-slate-400 text-lg">
            Monitor your store performance and orders
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
            <h3 className="text-xl font-semibold text-white mb-4">Orders This Week</h3>
            <div className="h-64 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <ChartBarIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Orders chart will be implemented here</p>
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

        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Recent Orders</h3>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Live Updates
            </div>
          </div>
          
          <div className="space-y-3">
            {recentOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.4 + index * 0.1 }}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <ShoppingBagIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{order.id}</p>
                    <p className="text-slate-400 text-sm">{order.customer}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-white font-medium">{order.amount}</p>
                    <p className="text-slate-400 text-sm">{order.time}</p>
                  </div>
                  
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}