'use client';

/**
 * Operator Dashboard Page
 * Displays performance KPIs and gamification widgets for operators
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */

import { useState, useEffect } from 'react';
import { 
  PhoneIcon, 
  ChartBarIcon, 
  ClipboardDocumentListIcon,
  QueueListIcon
} from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import MetricCard from '@/components/dashboard/MetricCard';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import MissionsWidget from '@/components/dashboard/widgets/MissionsWidget';
import LeaderboardWidget from '@/components/dashboard/widgets/LeaderboardWidget';
import RewardsWalletWidget from '@/components/dashboard/widgets/RewardsWalletWidget';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import api from '@/lib/api';
import logger from '@/lib/logger';
import type { Mission } from '@/components/dashboard/widgets/MissionsWidget';
import type { LeaderboardEntry } from '@/components/dashboard/widgets/LeaderboardWidget';
import type { RewardEntry } from '@/components/dashboard/widgets/RewardsWalletWidget';

/**
 * Operator KPI data structure
 * Property 6: Operator dashboard shows required KPIs
 */
interface OperatorKPIs {
  confirmationRate: number;
  confirmationRateChange?: number;
  callsToday: number;
  callsTodayChange?: number;
  queueLength: number;
  performanceRank: number;
}

/**
 * Default KPI values
 */
const defaultKPIs: OperatorKPIs = {
  confirmationRate: 0,
  callsToday: 0,
  queueLength: 0,
  performanceRank: 0,
};

/**
 * Get KPI metrics for display
 * Property 6: Operator dashboard shows required KPIs
 * For any operator user, the dashboard SHALL display KPI cards for confirmation rate, calls today, and queue length.
 */
function getOperatorKPIMetrics(kpis: OperatorKPIs) {
  return [
    { 
      title: 'Confirmation Rate', 
      value: kpis.confirmationRate, 
      change: kpis.confirmationRateChange,
      icon: <ChartBarIcon className="w-5 h-5" />, 
      suffix: '%', 
      decimals: 1,
      trend: kpis.confirmationRateChange !== undefined 
        ? (kpis.confirmationRateChange > 0 ? 'up' : kpis.confirmationRateChange < 0 ? 'down' : 'neutral')
        : undefined,
    },
    { 
      title: "Today's Calls", 
      value: kpis.callsToday, 
      change: kpis.callsTodayChange,
      icon: <PhoneIcon className="w-5 h-5" />,
      trend: kpis.callsTodayChange !== undefined 
        ? (kpis.callsTodayChange > 0 ? 'up' : kpis.callsTodayChange < 0 ? 'down' : 'neutral')
        : undefined,
    },
    { 
      title: 'Queue Length', 
      value: kpis.queueLength, 
      icon: <QueueListIcon className="w-5 h-5" /> 
    },
    { 
      title: 'Performance Rank', 
      value: kpis.performanceRank, 
      icon: <ChartBarIcon className="w-5 h-5" />,
      prefix: '#',
    },
  ] as const;
}

/**
 * Check if KPIs contain required fields
 * Property 6: Operator dashboard shows required KPIs
 */
function _hasRequiredKPIs(kpis: OperatorKPIs): boolean {
  return (
    typeof kpis.confirmationRate === 'number' &&
    typeof kpis.callsToday === 'number' &&
    typeof kpis.queueLength === 'number'
  );
}

export default function OperatorDashboard() {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  // State for dashboard data
  const [kpis, setKpis] = useState<OperatorKPIs>(defaultKPIs);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [wallet, setWallet] = useState({ balance: 0, pendingRewards: 0, recentRewards: [] as RewardEntry[] });
  
  // Loading states
  const [isLoadingKpis, setIsLoadingKpis] = useState(true);
  const [isLoadingMissions, setIsLoadingMissions] = useState(true);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true);
  const [isLoadingWallet, setIsLoadingWallet] = useState(true);
  
  // Error states
  const [kpisError, setKpisError] = useState<string | null>(null);
  const [missionsError, setMissionsError] = useState<string | null>(null);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);

  const currentUserId = user?.id || 'current';

  // Fetch KPIs
  const fetchKpis = async () => {
    setIsLoadingKpis(true);
    setKpisError(null);
    try {
      const response = await api.get('/api/operators/kpis');
      if (response.data) {
        setKpis(response.data);
      }
    } catch {
      setKpisError('Failed to load KPIs');
    } finally {
      setIsLoadingKpis(false);
    }
  };

  // Fetch missions
  const fetchMissions = async () => {
    setIsLoadingMissions(true);
    setMissionsError(null);
    try {
      const response = await api.get('/api/operators/missions');
      if (response.data?.missions) {
        setMissions(response.data.missions);
      }
    } catch {
      setMissionsError('Failed to load missions');
    } finally {
      setIsLoadingMissions(false);
    }
  };

  // Fetch leaderboard
  const fetchLeaderboard = async () => {
    setIsLoadingLeaderboard(true);
    setLeaderboardError(null);
    try {
      const response = await api.get('/api/operators/leaderboard');
      if (response.data?.operators) {
        setLeaderboard(response.data.operators);
      }
    } catch {
      setLeaderboardError('Failed to load leaderboard');
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  // Fetch wallet/rewards
  const fetchWallet = async () => {
    setIsLoadingWallet(true);
    setWalletError(null);
    try {
      const response = await api.get('/api/operators/rewards');
      if (response.data) {
        setWallet({
          balance: response.data.balance ?? 0,
          pendingRewards: response.data.pendingRewards ?? 0,
          recentRewards: response.data.recentRewards ?? [],
        });
      }
    } catch {
      setWalletError('Failed to load rewards');
    } finally {
      setIsLoadingWallet(false);
    }
  };

  // Handle mission completion
  const handleMissionComplete = async (missionId: string) => {
    try {
      await api.post(`/api/operators/missions/${missionId}/claim`, {});
      // Refresh missions and wallet after claiming
      fetchMissions();
      fetchWallet();
    } catch (err) {
      logger.error('Failed to claim mission reward:', err, 'Operator');
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchKpis();
    fetchMissions();
    fetchLeaderboard();
    fetchWallet();
  }, []);

  const metrics = getOperatorKPIMetrics(kpis);

  return (
    <ProtectedRoute allowedRoles={['operator']}>
      <DashboardLayout userRole="operator">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-semibold">{t('dashboard.operator')}</h1>
            <p className="text-sm dark:text-slate-400 light:text-gray-600 mt-1">
              Manage your calls and track performance
            </p>
          </div>

          {/* KPI Error */}
          {kpisError && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-between">
              <p className="text-sm text-red-400">{kpisError}</p>
              <button onClick={fetchKpis} className="text-sm text-red-400 hover:text-red-300 underline">Retry</button>
            </div>
          )}

          {/* KPI Cards - Property 6: Shows confirmation rate, calls today, queue length */}
          <div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            data-testid="operator-kpis"
          >
            {metrics.map((metric) => (
              <MetricCard 
                key={metric.title} 
                {...metric} 
                isLoading={isLoadingKpis}
              />
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/panel/op/queue" className="card p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <PhoneIcon className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold">{t('nav.emission')}</h3>
                  <p className="text-sm dark:text-slate-400 light:text-gray-600">
                    Make outgoing calls
                  </p>
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
                  <p className="text-sm dark:text-slate-400 light:text-gray-600">
                    View order history
                  </p>
                </div>
              </div>
            </Link>
          </div>

          {/* Widgets Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Missions Widget */}
            <div className="lg:col-span-2">
              <MissionsWidget
                missions={missions}
                onMissionComplete={handleMissionComplete}
                isLoading={isLoadingMissions}
                error={missionsError ?? undefined}
                onRetry={fetchMissions}
              />
            </div>

            {/* Rewards Wallet Widget */}
            <div>
              <RewardsWalletWidget
                balance={wallet.balance}
                pendingRewards={wallet.pendingRewards}
                recentRewards={wallet.recentRewards}
                isLoading={isLoadingWallet}
                error={walletError ?? undefined}
                onRetry={fetchWallet}
              />
            </div>

            {/* Leaderboard Widget */}
            <div className="lg:col-span-3">
              <LeaderboardWidget
                operators={leaderboard}
                currentUserId={currentUserId}
                isLoading={isLoadingLeaderboard}
                error={leaderboardError ?? undefined}
                onRetry={fetchLeaderboard}
              />
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
