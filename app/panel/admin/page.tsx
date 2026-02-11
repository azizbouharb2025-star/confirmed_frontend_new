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

/** Default empty KPIs */
const defaultKPIs: AdminKPIs = {
  totalUsers: 0,
  totalUsersChange: 0,
  totalOrders: 0,
  totalOrdersChange: 0,
  revenue: 0,
  revenueChange: 0,
  activeShops: 0,
  activeShopsChange: 0,
};


export default function AdminDashboard() {
  const [kpis, setKpis] = useState<AdminKPIs>(defaultKPIs);
  const [ordersData, setOrdersData] = useState<OrdersTrendData[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueTrendData[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [systemHealth, setSystemHealth] = useState<ServiceHealth[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ordersPeriod, setOrdersPeriod] = useState<TimePeriod>('daily');
  const [revenueViewMode, setRevenueViewMode] = useState<ViewMode>('daily');

  // Fetch all admin dashboard data from API
  const fetchAdminData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [healthRes, activityRes, ordersRes, revenueRes] = await Promise.allSettled([
        api.get('/api/admin/system-health'),
        api.get('/api/admin/activity-feed'),
        api.get('/api/admin/charts/orders', { params: { period: ordersPeriod } }),
        api.get('/api/admin/charts/revenue'),
      ]);

      if (healthRes.status === 'fulfilled' && healthRes.value.data?.services) {
        setSystemHealth(healthRes.value.data.services);
      }

      if (activityRes.status === 'fulfilled' && activityRes.value.data?.activities) {
        setActivities(activityRes.value.data.activities);
      }

      if (ordersRes.status === 'fulfilled' && ordersRes.value.data) {
        const d = ordersRes.value.data;
        if (d.data) setOrdersData(d.data);
        if (d.totalOrders != null) setKpis(prev => ({ ...prev, totalOrders: d.totalOrders, totalOrdersChange: d.changePercent ?? prev.totalOrdersChange }));
      }

      if (revenueRes.status === 'fulfilled' && revenueRes.value.data) {
        const d = revenueRes.value.data;
        if (d.data) setRevenueData(d.data);
        if (d.totalRevenue != null) setKpis(prev => ({ ...prev, revenue: d.totalRevenue, revenueChange: d.growthPercent ?? prev.revenueChange }));
      }

      // Fetch KPIs separately (users + shops counts)
      try {
        const kpiRes = await api.get('/api/admin/kpis');
        if (kpiRes.data) {
          setKpis(prev => ({ ...prev, ...kpiRes.data }));
        }
      } catch {
        // KPIs endpoint optional — totals from charts are enough
      }

      const allFailed = [healthRes, activityRes, ordersRes, revenueRes].every(r => r.status === 'rejected');
      if (allFailed) {
        setError('Failed to load dashboard data. Please try again.');
      }
    } catch (err) {
      logger.error('Failed to fetch admin dashboard data:', err, 'Admin');
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [ordersPeriod]);

  const handleOrdersPeriodChange = (period: TimePeriod) => {
    setOrdersPeriod(period);
  };

  const handleRevenueViewModeChange = (mode: ViewMode) => {
    setRevenueViewMode(mode);
  };

  // Calculate totals from real data
  const totalOrders = ordersData.reduce((sum, d) => sum + d.orders, 0);
  const ordersChangePercent = kpis.totalOrdersChange;
  const totalRevenue = revenueData.length > 0 ? (revenueData[revenueData.length - 1]?.cumulative || revenueData.reduce((sum, d) => sum + d.revenue, 0)) : 0;
  const revenueGrowthPercent = kpis.revenueChange;

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

          {/* Error Banner */}
          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-between">
              <p className="text-sm text-red-400">{error}</p>
              <button
                onClick={fetchAdminData}
                className="text-sm text-red-400 hover:text-red-300 underline"
              >
                Retry
              </button>
            </div>
          )}

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
