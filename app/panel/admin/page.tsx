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
import {
  UsersIcon,
  ShoppingBagIcon,
  BuildingStorefrontIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
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

type SupervisionKPIs = AdminKPIs & {
  pendingOrders: number; inDeliveryOrders: number; deliveredOrders: number;
  returnedOrders: number; deliveryRate: number; returnRate: number;
  deliveredRevenue: number; cancellationRate: number;
}
const supervisionCards = [
  ['totalUsers', 'Utilisateurs totaux', UsersIcon],
  ['activeShops', 'Boutiques actives', BuildingStorefrontIcon],
  ['totalOrders', 'Commandes totales', ShoppingBagIcon],
  ['pendingOrders', 'Commandes en attente', ShoppingBagIcon],
  ['confirmedOrders', 'Commandes confirmées', CheckCircleIcon],
  ['cancelledOrders', 'Commandes annulées', XCircleIcon],
  ['inDeliveryOrders', 'Commandes en livraison', ShoppingBagIcon],
  ['deliveredOrders', 'Commandes livrées', CheckCircleIcon],
  ['returnedOrders', 'Commandes retournées', XCircleIcon],
  ['confirmationRate', 'Taux de confirmation', ChartBarIcon],
  ['deliveryRate', 'Taux de livraison', ChartBarIcon],
  ['returnRate', 'Taux de retour', ChartBarIcon],
  ['deliveredRevenue', 'Chiffre d’affaires livré', ChartBarIcon],
  ['cancellationRate', 'Taux d’annulation', ChartBarIcon],
] as const


/** Default empty KPIs */
const defaultKPIs: SupervisionKPIs = {
  pendingOrders: 0, inDeliveryOrders: 0, deliveredOrders: 0, returnedOrders: 0,
  deliveryRate: 0, returnRate: 0, deliveredRevenue: 0, cancellationRate: 0,
  totalUsers: 0,
  totalUsersChange: 0,
  totalOrders: 0,
  totalOrdersChange: 0,
  confirmedOrders: 0,
  cancelledOrders: 0,
  confirmationRate: 0,
  revenue: 0,
  revenueChange: 0,
  activeShops: 0,
  activeShopsChange: 0,
};


export default function AdminDashboard() {
  const [kpis, setKpis] = useState<SupervisionKPIs>(defaultKPIs);
  const [kpiPeriod, setKpiPeriod] = useState('30d');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [kpiLoading, setKpiLoading] = useState(true);
  const [kpiError, setKpiError] = useState<string | null>(null);
  const [kpiRefresh, setKpiRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    if (kpiPeriod === 'custom' && (!from || !to || from > to)) {
      setKpiLoading(false);
      setKpiError('Sélectionnez une période personnalisée valide.');
      return;
    }
    setKpiLoading(true); setKpiError(null);
    const params = new URLSearchParams({ period: kpiPeriod });
    if (kpiPeriod === 'custom') { params.set('from', from); params.set('to', to); }
    api.get(`/api/admin/kpis?${params}`).then(response => {
      if (active) setKpis({ ...defaultKPIs, ...response.data });
    }).catch(() => {
      if (active) setKpiError('Impossible de charger les KPI. Réessayez.');
    }).finally(() => { if (active) setKpiLoading(false); });
    return () => { active = false; };
  }, [kpiPeriod, from, to, kpiRefresh]);
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
        api.get(`/api/admin/charts/orders?period=${ordersPeriod}`),
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
      }

      if (revenueRes.status === 'fulfilled' && revenueRes.value.data) {
        const d = revenueRes.value.data;
        if (d.data) setRevenueData(d.data);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordersPeriod]);

  // Refresh recent activity without reloading the whole dashboard.
  // ActivityLog is already sorted newest-first by the backend.
  useEffect(() => {
    const refreshActivities = async () => {
      try {
        const response = await api.get('/api/admin/activity-feed');

        if (response.data?.activities) {
          setActivities(response.data.activities);
        }
      } catch (err) {
        logger.error(
          'Failed to refresh admin activity feed:',
          err,
          'Admin'
        );
      }
    };

    const intervalId = window.setInterval(
      refreshActivities,
      30000
    );

    return () => window.clearInterval(intervalId);
  }, []);

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

          <section className="space-y-4" aria-label="KPI de supervision">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div><h2 className="text-lg font-semibold">KPI de supervision</h2><p className="text-xs text-gray-500 dark:text-slate-400">Périodes à l’heure de Tunis. Utilisateurs et boutiques : totaux actuels.</p></div>
              <div className="flex flex-wrap items-end gap-3">
                <label className="text-sm">Période<select value={kpiPeriod} onChange={e => setKpiPeriod(e.target.value)} className="ml-2 rounded border p-2 dark:bg-slate-800">
                  <option value="today">Aujourd’hui</option><option value="7d">7 derniers jours</option><option value="30d">30 derniers jours</option><option value="month">Ce mois</option><option value="previous_month">Mois précédent</option><option value="custom">Personnalisé</option>
                </select></label>
                {kpiPeriod === 'custom' && <><label className="text-sm">Du<input type="date" value={from} onChange={e => setFrom(e.target.value)} className="ml-2 rounded border p-2 dark:bg-slate-800" /></label><label className="text-sm">Au<input type="date" value={to} min={from} onChange={e => setTo(e.target.value)} className="ml-2 rounded border p-2 dark:bg-slate-800" /></label></>}
                <button type="button" onClick={() => setKpiRefresh(n => n + 1)} className="rounded border px-3 py-2">Actualiser</button>
              </div>
            </div>
            {kpiError ? <p role="alert" className="rounded border border-red-500/30 p-4 text-red-500">{kpiError}</p> : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4" data-testid="admin-kpi-cards">
              {supervisionCards.map(([key, title, Icon]) => <MetricCard key={key} title={title} value={kpis[key]} icon={<Icon className="w-5 h-5" />} decimals={key.endsWith('Rate') ? 1 : key === 'deliveredRevenue' ? 3 : 0} suffix={key.endsWith('Rate') ? '%' : key === 'deliveredRevenue' ? ' TND' : undefined} isLoading={kpiLoading} />)}
            </div>}
          </section>

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
              maxItems={10}
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
