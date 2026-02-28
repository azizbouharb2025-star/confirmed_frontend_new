/**
 * Cancelled Orders Widget Component
 * Requirements: 9.1, 9.2, 9.6
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { XCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { CancellationSummary } from '@/types/cancellation';

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

export default function CancelledOrdersWidget() {
  const router = useRouter();
  const [summary, setSummary] = useState<CancellationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cancellations/summary');
      
      if (!response.ok) {
        throw new Error('Failed to fetch cancellation summary');
      }

      const data = await response.json();
      setSummary(data);
    } catch (err) {
      console.error('Error fetching cancellation summary:', err);
      setError('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    router.push('/panel/client/cancellations');
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
            <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Commandes annulées
            </h3>
          </div>
        </div>
        <p className="text-sm text-red-600 dark:text-red-400">{error || 'Données non disponibles'}</p>
      </div>
    );
  }

  const getTrendIcon = () => {
    switch (summary.trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-red-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-green-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendColor = () => {
    switch (summary.trend) {
      case 'up':
        return 'text-red-600';
      case 'down':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
            <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Commandes annulées
            </h3>
          </div>
        </div>
      </div>

      {/* Total Count */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {summary.totalCancelled}
          </p>
          {summary.changeFromPrevious !== 0 && (
            <div className={`flex items-center gap-1 ${getTrendColor()}`}>
              {getTrendIcon()}
              <span className="text-sm font-medium">
                {Math.abs(summary.changeFromPrevious)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Top Reasons */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
          Principales raisons
        </p>
        {summary.topReasons.map((reason, index) => (
          <div key={reason.reason} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                {index + 1}.
              </span>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {getCancellationReasonLabel(reason.reason)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {reason.count}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ({reason.percentage}%)
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Click hint */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Cliquez pour voir l&apos;analyse détaillée
        </p>
      </div>
    </div>
  );
}
