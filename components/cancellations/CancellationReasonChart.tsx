/**
 * Cancellation Reason Chart Component
 * Requirements: 9.4, 9.5
 */

'use client';

import { CancellationReasonData } from '@/types/cancellation';

interface CancellationReasonChartProps {
  reasons: CancellationReasonData[];
  chartType: 'pie' | 'bar';
}

/**
 * Translates cancellation reason to display text
 */
function getCancellationReasonLabel(reason: string): string {
  const labels: Record<string, string> = {
    customer_refused: 'Client refusé',
    price_too_high: 'Prix trop élevé',
    quality_doubts: 'Doutes qualité',
    duplicate_order: 'Dupliquée',
    fake_number: 'Faux numéro',
    not_available: 'Non dispo',
    courier_failed: 'Échec coursier',
    customer_rejected_at_door: 'Rejeté porte',
  };
  return labels[reason] || reason;
}

/**
 * Color palette for chart
 */
const COLORS = [
  '#EF4444', // red-500
  '#F97316', // orange-500
  '#F59E0B', // amber-500
  '#EAB308', // yellow-500
  '#84CC16', // lime-500
  '#22C55E', // green-500
  '#10B981', // emerald-500
  '#14B8A6', // teal-500
];

export default function CancellationReasonChart({ reasons, chartType }: CancellationReasonChartProps) {
  // Sort reasons by count for better visualization
  const sortedReasons = [...reasons].sort((a, b) => b.count - a.count);
  const maxCount = Math.max(...sortedReasons.map(r => r.count));

  if (chartType === 'pie') {
    return (
      <div className="flex flex-col items-center justify-center">
        {/* Simple pie chart using CSS */}
        <div className="relative w-64 h-64">
          <svg viewBox="0 0 100 100" className="transform -rotate-90">
            {sortedReasons.reduce((acc, reason, index) => {
              const percentage = reason.percentage;
              const startAngle = acc.angle;
              const angle = (percentage / 100) * 360;
              const endAngle = startAngle + angle;
              
              // Calculate arc path
              const startX = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
              const startY = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
              const endX = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
              const endY = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);
              const largeArc = angle > 180 ? 1 : 0;

              acc.elements.push(
                <path
                  key={reason.reason}
                  d={`M 50 50 L ${startX} ${startY} A 40 40 0 ${largeArc} 1 ${endX} ${endY} Z`}
                  fill={COLORS[index % COLORS.length]}
                  className="hover:opacity-80 transition-opacity"
                />
              );

              acc.angle = endAngle;
              return acc;
            }, { angle: 0, elements: [] as JSX.Element[] }).elements}
          </svg>
        </div>

        {/* Legend */}
        <div className="mt-6 grid grid-cols-2 gap-3 w-full">
          {sortedReasons.map((reason, index) => (
            <div key={reason.reason} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-700 dark:text-gray-300 truncate">
                  {getCancellationReasonLabel(reason.reason)}
                </p>
                <p className="text-xs font-semibold text-gray-900 dark:text-white">
                  {reason.percentage}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Bar chart
  return (
    <div className="space-y-4">
      {sortedReasons.map((reason, index) => {
        const barWidth = (reason.count / maxCount) * 100;
        
        return (
          <div key={reason.reason} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                {getCancellationReasonLabel(reason.reason)}
              </span>
              <span className="text-gray-900 dark:text-white font-semibold">
                {reason.count} ({reason.percentage}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${barWidth}%`,
                  backgroundColor: COLORS[index % COLORS.length],
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
