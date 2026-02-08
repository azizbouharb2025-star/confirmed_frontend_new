'use client'

/**
 * Admin Dashboard Page
 * Displays system-wide KPIs, charts, activity feed, and system health
 * Requirements: 8.1, 8.2, 8.3, 8.4
 * 
 * Feature: subscription-tiered-dashboards, Property 9: Admin dashboard shows system-wide KPIs
 * Validates: Requirements 8.1
 */

import { useState, useEffect } from 'react'
import { UsersIcon, ShoppingBagIcon, CurrencyDollarIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline'
import api from '@/lib/api'
import logger from '@/lib/logger'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import MetricCard from '@/components/dashboard/MetricCard'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import OrdersChartWidget from '@/components/dashboard/widgets/OrdersChartWidget'
import RevenueChartWidget from '@/components/dashboard/widgets/RevenueChartWidget'
import ActivityFeedWidget from '@/components/dashboard/widgets/ActivityFeedWidget'
import SystemHealthWidget from '@/components/dashboard/widgets/SystemHealthWidget'
import type { OrdersTrendData, TimePeriod } from '@/components/dashboard/widgets/OrdersChartWidget'
import type { RevenueTrendData, ViewMode } from '@/components/dashboard/widgets/RevenueChartWidget'
import type { Activity } from '@/components/dashboard/widgets/ActivityFeedWidget'
import type { ServiceHealth } from '@/components/dashboard/widgets/SystemHealthWidget'
import type { AdminKPIs } from '@/lib/adminUtils'

// Mock data - in production, this would come from the analytics API
const mockKPIs: AdminKPIs = {
  totalUsers: 1247,
  totalUsersChange: 12.5,
  totalOrders: 8934,
  totalOrdersChange: 8.2,
  revenue: 245750,
  revenueChange: 15.3,
  activeShops: 156,
  activeShopsChange: 5.7,
};

const mockOrdersData: OrdersTrendData[] = [
  { date: 'Mon', orders: 120, previousPeriod: 100 },
  { date: 'Tue', orders: 145, previousPeriod: 115 },
  { date: 'Wed', orders: 132, previousPeriod: 125 },
  { date: 'Thu', orders: 168, previousPeriod: 140 },
  { date: 'Fri', orders: 195, previousPeriod: 160 },
  { date: 'Sat', orders: 210, previousPeriod: 180 },
  { date: 'Sun', orders: 185, previousPeriod: 165 },
];

const mockRevenueData: RevenueTrendData[] = [
  { date: 'Mon', revenue: 12500, cumulative: 12500 },
  { date: 'Tue', revenue: 18200, cumulative: 30700 },
  { date: 'Wed', revenue: 15800, cumulative: 46500 },
  { date: 'Thu', revenue: 22100, cumulative: 68600 },
  { date: 'Fri', revenue: 28500, cumulative: 97100 },
  { date: 'Sat', revenue: 35200, cumulative: 132300 },
  { date: 'Sun', revenue: 29800, cumulative: 162100 },
];

const mockActivities: Activity[] = [
  { id: '1', type: 'user', action: 'New user registered', detail: 'john@example.com', timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString() },
  { id: '2', type: 'order', action: 'Order confirmed', detail: '#ORD-001', timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString() },
  { id: '3', type: 'system', action: 'Shop connected', detail: 'TechStore', timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
  { id: '4', type: 'payment', action: 'Payment processed', detail: '299.99 TND', timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
  { id: '5', type: 'order', action: 'Order shipped', detail: '#ORD-002', timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString() },
  { id: '6', type: 'user', action: 'User upgraded plan', detail: 'sarah@example.com', timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
];

const mockSystemHealth: ServiceHealth[] = [
  { name: 'API', status: 'healthy', latency: 45, lastCheck: new Date(Date.now() - 30 * 1000).toISOString() },
  { name: 'Database', status: 'healthy', latency: 12, lastCheck: new Date(Date.now() - 30 * 1000).toISOString() },
  { name: 'Queue', status: 'healthy', latency: 8, lastCheck: new Date(Date.now() - 30 * 1000).toISOString() },
  { name: 'Cache', status: 'degraded', latency: 250, lastCheck: new Date(Date.now() - 30 * 1000).toISOString() },
];


export default function AdminDashboard() {
  const [kpis, setKpis] = useState<AdminKPIs>(mockKPIs);
  const [ordersData, setOrdersData] = useState<OrdersTrendData[]>(mockOrdersData);
  const [revenueData, setRevenueData] = useState<RevenueTrendData[]>(mockRevenueData);
  const [activities, setActivities] = useState<Activity[]>(mockActivities);
  const [systemHealth, setSystemHealth] = useState<ServiceHealth[]>(mockSystemHealth);
  const [isLoading, setIsLoading] = useState(true);
  const [ordersPeriod, setOrdersPeriod] = useState<TimePeriod>('daily');
  const [revenueViewMode, setRevenueViewMode] = useState<ViewMode>('daily');

  // Fetch data from analytics API
  useEffect(() => {
    const fetchAdminData = async () => {
      setIsLoading(true);
      try {
        // Fetch system health
        const healthResponse = await api.get('/api/admin/system-health');
        if (healthResponse.data?.services) {
          setSystemHealth(healthResponse.data.services);
        }

        // Fetch activity feed
        const activityResponse = await api.get('/api/admin/activity-feed');
        if (activityResponse.data?.activities) {
          setActivities(activityResponse.data.activities);
        }

        // Fetch orders chart data
        const ordersResponse = await api.get('/api/admin/charts/orders');
        if (ordersResponse.data) {
          if (ordersResponse.data.data) setOrdersData(ordersResponse.data.data);
          if (ordersResponse.data.totalOrders) setKpis(prev => ({ ...prev, totalOrders: ordersResponse.data.totalOrders }));
        }

        // Fetch revenue chart data
        const revenueResponse = await api.get('/api/admin/charts/revenue');
        if (revenueResponse.data) {
          if (revenueResponse.data.data) setRevenueData(revenueResponse.data.data);
          if (revenueResponse.data.totalRevenue) setKpis(prev => ({ ...prev, revenue: revenueResponse.data.totalRevenue }));
        }
      } catch (err) {
        logger.error('Failed to fetch admin dashboard data:', err, 'Admin');
        // Keep mock data on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const handleOrdersPeriodChange = (period: TimePeriod) => {
    setOrdersPeriod(period);
    // In production, refetch data for the new period
  };

  const handleRevenueViewModeChange = (mode: ViewMode) => {
    setRevenueViewMode(mode);
  };

  // Calculate totals for charts
  const totalOrders = ordersData.reduce((sum, d) => sum + d.orders, 0);
  const ordersChangePercent = 8.2; // In production, calculate from data
  const totalRevenue = revenueData[revenueData.length - 1]?.cumulative || 0;
  const revenueGrowthPercent = 15.3; // In production, calculate from data

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout userRole="admin">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
            <p className="text-sm dark:text-slate-400 light:text-gray-600 mt-1">
              Complete system overview and management
            </p>
          </div>

          {/* KPI Cards - Property 9: Admin dashboard shows system-wide KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="admin-kpi-cards">
            <MetricCard
              title="Total Users"
              value={kpis.totalUsers}
              change={kpis.totalUsersChange}
              icon={<UsersIcon className="w-5 h-5" />}
              isLoading={isLoading}
            />
            <MetricCard
              title="Total Orders"
              value={kpis.totalOrders}
              change={kpis.totalOrdersChange}
              icon={<ShoppingBagIcon className="w-5 h-5" />}
              isLoading={isLoading}
            />
            <MetricCard
              title="Revenue"
              value={kpis.revenue}
              change={kpis.revenueChange}
              icon={<CurrencyDollarIcon className="w-5 h-5" />}
              suffix=" TND"
              isLoading={isLoading}
            />
            <MetricCard
              title="Active Shops"
              value={kpis.activeShops}
              change={kpis.activeShopsChange}
              icon={<BuildingStorefrontIcon className="w-5 h-5" />}
              isLoading={isLoading}
            />
          </div>

          {/* Charts - Requirements 8.2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <OrdersChartWidget
              data={ordersData}
              period={ordersPeriod}
              onPeriodChange={handleOrdersPeriodChange}
              totalOrders={totalOrders}
              changePercent={ordersChangePercent}
              isLoading={isLoading}
            />
            <RevenueChartWidget
              data={revenueData}
              viewMode={revenueViewMode}
              onViewModeChange={handleRevenueViewModeChange}
              totalRevenue={totalRevenue}
              growthPercent={revenueGrowthPercent}
              isLoading={isLoading}
            />
          </div>

          {/* Activity Feed and System Health - Requirements 8.3, 8.4 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ActivityFeedWidget
              activities={activities}
              maxItems={6}
              isLoading={isLoading}
            />
            <SystemHealthWidget
              services={systemHealth}
              isLoading={isLoading}
            />
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
