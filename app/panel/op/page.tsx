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
type OperatorPeriod = '7d' | '30d' | '90d';

/**
 * Indicateurs du tableau de bord opérateur.
 */
interface OperatorKPIs {
  selectedPeriod: OperatorPeriod;
  confirmedToday: number;
  confirmedTodayChange?: number | null;
  confirmedOrders: number;
  confirmedOrdersChange?: number | null;
  confirmationRate: number;
  confirmationRateChange?: number | null;
  queueLength: number;
}

/**
 * Valeurs par défaut.
 */
const defaultKPIs: OperatorKPIs = {
  selectedPeriod: '7d',
  confirmedToday: 0,
  confirmedOrders: 0,
  confirmationRate: 0,
  queueLength: 0,
};

const PERIOD_OPTIONS: ReadonlyArray<{
  value: OperatorPeriod;
  label: string;
}> = [
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
  { value: '90d', label: '90 jours' },
];

function getTrend(
  change?: number | null
): 'up' | 'down' | 'neutral' | undefined {
  if (typeof change !== 'number') {
    return undefined;
  }

  if (change > 0) return 'up';
  if (change < 0) return 'down';
  return 'neutral';
}

/**
 * Ordre demandé :
 * 1. Commandes confirmées aujourd'hui
 * 2. Commandes confirmées
 * 3. Taux de confirmation
 * 4. File d'attente
 */
function getOperatorKPIMetrics(kpis: OperatorKPIs) {
  return [
    {
      title: "Commandes confirmées aujourd'hui",
      value: kpis.confirmedToday,
      change:
        typeof kpis.confirmedTodayChange === 'number'
          ? kpis.confirmedTodayChange
          : undefined,
      icon: <PhoneIcon className="w-5 h-5" />,
      trend: getTrend(kpis.confirmedTodayChange),
    },
    {
      title: 'Commandes confirmées',
      value: kpis.confirmedOrders,
      change:
        typeof kpis.confirmedOrdersChange === 'number'
          ? kpis.confirmedOrdersChange
          : undefined,
      icon: <ClipboardDocumentListIcon className="w-5 h-5" />,
      trend: getTrend(kpis.confirmedOrdersChange),
    },
    {
      title: 'Taux de confirmation',
      value: kpis.confirmationRate,
      change:
        typeof kpis.confirmationRateChange === 'number'
          ? kpis.confirmationRateChange
          : undefined,
      icon: <ChartBarIcon className="w-5 h-5" />,
      suffix: '%',
      decimals: 1,
      trend: getTrend(kpis.confirmationRateChange),
    },
    {
      title: "File d'attente",
      value: kpis.queueLength,
      icon: <QueueListIcon className="w-5 h-5" />,
    },
  ] as const;
}

function _hasRequiredKPIs(kpis: OperatorKPIs): boolean {
  return (
    typeof kpis.confirmedToday === 'number' &&
    typeof kpis.confirmedOrders === 'number' &&
    typeof kpis.confirmationRate === 'number' &&
    typeof kpis.queueLength === 'number'
  );
}

export default function OperatorDashboard() {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  // State for dashboard data
  const [kpis, setKpis] = useState<OperatorKPIs>(defaultKPIs);
  const [selectedPeriod, setSelectedPeriod] = useState<OperatorPeriod>('7d');
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

  // Chargement des KPI pour la période sélectionnée
  const fetchKpis = async (period: OperatorPeriod = selectedPeriod) => {
    setIsLoadingKpis(true);
    setKpisError(null);

    try {
      const response = await api.get(
        `/api/operators/kpis?period=${period}`
      );

      if (response.data) {
        setKpis({
          ...defaultKPIs,
          ...response.data,
          selectedPeriod: response.data.selectedPeriod || period,
        });
      }
    } catch {
      setKpisError('Impossible de charger les indicateurs.');
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
      setMissionsError('Impossible de charger les missions.');
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
      setLeaderboardError('Impossible de charger le classement.');
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
      setWalletError('Impossible de charger les récompenses.');
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

  // Recharger les KPI lorsque la période change
  useEffect(() => {
    fetchKpis(selectedPeriod);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod]);

  // Les autres widgets sont chargés une seule fois
  useEffect(() => {
    fetchMissions();
    fetchLeaderboard();
    fetchWallet();
  }, []);

  const metrics = getOperatorKPIMetrics(kpis);

  return (
    <ProtectedRoute allowedRoles={['operator']}>
      <DashboardLayout userRole="operator">
        <div className="space-y-6">
          {/* En-tête du tableau de bord */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">
                Tableau de bord Opérateur
              </h1>
              <p className="mt-1 text-sm dark:text-slate-400 light:text-gray-600">
                {"Suivez vos confirmations et votre file d'attente."}
              </p>
            </div>

            {/* Sélection de la période */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <span className="text-sm font-medium dark:text-slate-300 light:text-gray-700">
                Période
              </span>

              <div
                className="inline-flex rounded-xl border p-1 dark:border-slate-700 dark:bg-slate-900/60 light:border-gray-200 light:bg-white"
                aria-label="Sélectionner la période des statistiques"
              >
                {PERIOD_OPTIONS.map((option) => {
                  const isActive = selectedPeriod === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSelectedPeriod(option.value)}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-[#ADFF2F] text-gray-900 shadow-sm'
                          : 'dark:text-slate-300 dark:hover:bg-slate-800 light:text-gray-600 light:hover:bg-gray-100'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Erreur KPI */}
          {kpisError && (
            <div className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/10 p-4">
              <p className="text-sm text-red-400">{kpisError}</p>

              <button
                type="button"
                onClick={() => fetchKpis(selectedPeriod)}
                className="text-sm text-red-400 underline hover:text-red-300"
              >
                Réessayer
              </button>
            </div>
          )}

          {/* KPI principaux */}
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
                    Traiter les commandes à appeler
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
                    {"Consulter l'historique des commandes"}
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
