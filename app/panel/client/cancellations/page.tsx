/**
 * Cancellation Analysis Page
 * Requirements: 9.3, 9.4, 9.5, 9.8
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import ErrorBoundary from '@/components/ErrorBoundary';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { CancellationAnalysisData, TimeRange } from '@/types/cancellation';
import CancellationReasonChart from '@/components/cancellations/CancellationReasonChart';

/**
 * Translates cancellation reason to display text
 */
function getCancellationReasonLabel(reason: string): string {
  const labels: Record<string, string> = {
    customer_refused: 'Client refusé',
    price_too_high: 'Prix trop élevé',
    quality_doubts: 'Doutes sur qualité',
    duplicate_order: 'Commande dupliquée',
    fake_number: 'Faux numéro',
    not_available: 'Non disponible',
    courier_failed: 'Échec coursier',
    customer_rejected_at_door: 'Rejeté à la porte',
  };
  return labels[reason] || reason;
}

function CancellationsContent() {
  const router = useRouter();
  const [analysisData, setAnalysisData] = useState<CancellationAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timePreset, setTimePreset] = useState<TimeRange['preset']>('30days');

  useEffect(() => {
    fetchAnalysisData();
  }, [timePreset]);

  const fetchAnalysisData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ preset: timePreset || '30days' });
      const response = await fetch(`/api/cancellations/analysis?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch cancellation analysis');
      }

      const data = await response.json();
      setAnalysisData(data);
    } catch (err) {
      console.error('Error fetching cancellation analysis:', err);
      setError('Erreur de chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-red-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-green-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'down':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !analysisData) {
    return (
      <div className="p-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour
        </button>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <p className="text-red-600 dark:text-red-400">{error || 'Données non disponibles'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with breadcrumb */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour au tableau de bord
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Analyse des annulations
          </h1>
        </div>

        {/* Time range selector */}
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-500" />
          <select
            value={timePreset}
            onChange={(e) => setTimePreset(e.target.value as TimeRange['preset'])}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">Aujourd'hui</option>
            <option value="yesterday">Hier</option>
            <option value="7days">7 derniers jours</option>
            <option value="30days">30 derniers jours</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Cancelled */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Total annulé
          </h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {analysisData.totalCancelled}
          </p>
        </div>

        {/* Cancellation Rate */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Taux d'annulation
          </h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {analysisData.cancellationRate}%
          </p>
        </div>

        {/* Top Reason */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Raison principale
          </h3>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {getCancellationReasonLabel(analysisData.topReasons[0]?.reason || '')}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {analysisData.topReasons[0]?.percentage}% des annulations
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Répartition par raison
          </h2>
          <CancellationReasonChart
            reasons={analysisData.reasonBreakdown}
            chartType="pie"
          />
        </div>

        {/* Bar Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Comparaison des raisons
          </h2>
          <CancellationReasonChart
            reasons={analysisData.reasonBreakdown}
            chartType="bar"
          />
        </div>
      </div>

      {/* Detailed Breakdown Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Détails par raison
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Raison
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Pourcentage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tendance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {analysisData.reasonBreakdown
                .sort((a, b) => b.count - a.count)
                .map((reason) => (
                  <tr key={reason.reason} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {getCancellationReasonLabel(reason.reason)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {reason.count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {reason.percentage}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTrendColor(reason.trend)}`}>
                        {getTrendIcon(reason.trend)}
                        {reason.trend === 'up' ? 'Hausse' : reason.trend === 'down' ? 'Baisse' : 'Stable'}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


export default function CancellationsPage() {
  return (
    <ErrorBoundary>
      <ProtectedRoute allowedRoles={['shop_owner']}>
        <DashboardLayout userRole="shop_owner">
          <CancellationsContent />
        </DashboardLayout>
      </ProtectedRoute>
    </ErrorBoundary>
  )
}
