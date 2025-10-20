'use client'

import { motion } from 'framer-motion'
import { 
  PhoneIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  TrophyIcon,
  FireIcon
} from '@heroicons/react/24/outline'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import MetricCard from '@/components/dashboard/MetricCard'
import Button from '@/components/ui/Button'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

const mockMetrics = [
  {
    title: 'Total Calls Today',
    value: 47,
    change: 12.5,
    icon: <PhoneIcon className="w-full h-full" />,
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    title: 'Confirmed Orders',
    value: 39,
    change: 8.2,
    icon: <CheckCircleIcon className="w-full h-full" />,
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    title: 'Confirmation Rate',
    value: 82.9,
    change: 5.3,
    icon: <TrophyIcon className="w-full h-full" />,
    gradient: 'from-purple-500 to-pink-500',
    suffix: '%',
    decimals: 1
  },
  {
    title: 'Avg Call Duration',
    value: 185,
    change: -2.1,
    icon: <ClockIcon className="w-full h-full" />,
    gradient: 'from-orange-500 to-red-500',
    suffix: 's'
  }
]

const mockQueue = [
  { id: 'ORD-001', customer: 'John Doe', phone: '+1234567890', priority: 'high', time: '2 min ago' },
  { id: 'ORD-002', customer: 'Jane Smith', phone: '+1234567891', priority: 'normal', time: '5 min ago' },
  { id: 'ORD-003', customer: 'Bob Johnson', phone: '+1234567892', priority: 'normal', time: '8 min ago' },
]

export default function OperatorDashboard() {
  return (
    <ProtectedRoute allowedRoles={['operator']}>
      <DashboardLayout userRole="operator">
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold gradient-text">Operator Dashboard</h1>
            <p className="text-slate-400 text-lg">
              Your performance and call queue
            </p>
          </div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Button className="flex items-center gap-2">
              <PhoneIcon className="w-5 h-5" />
              Get Next Call
            </Button>
          </motion.div>
        </motion.div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

        {/* Call Queue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <FireIcon className="w-6 h-6 text-orange-500" />
              Call Queue ({mockQueue.length})
            </h3>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Live Updates
            </div>
          </div>
          
          <div className="space-y-3">
            {mockQueue.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${
                    order.priority === 'high' ? 'bg-red-500 animate-pulse' : 'bg-blue-500'
                  }`} />
                  <div>
                    <p className="text-white font-medium">{order.id}</p>
                    <p className="text-slate-400 text-sm">{order.customer}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-slate-300">{order.phone}</p>
                    <p className="text-slate-400 text-sm">{order.time}</p>
                  </div>
                  
                  <Button 
                    size="sm" 
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Call Now
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Performance Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="glass-card p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-4">Today's Performance</h3>
          <div className="h-64 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <TrophyIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Performance chart will be implemented here</p>
            </div>
          </div>
        </motion.div>
      </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}