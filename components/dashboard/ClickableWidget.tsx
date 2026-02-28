'use client';

/**
 * ClickableWidget Component
 * Enhanced MetricCard that navigates to detail pages on click
 * Requirements: 6.1, 6.6, 6.7
 */

import { useRouter } from 'next/navigation';
import MetricCard, { MetricCardProps } from './MetricCard';

export interface ClickableWidgetProps extends MetricCardProps {
  /** URL to navigate to when clicked */
  detailPageUrl: string;
  /** Whether the widget is clickable (default: true) */
  isClickable?: boolean;
}

/**
 * ClickableWidget - MetricCard with click navigation
 * 
 * Extends MetricCard with clickable functionality that navigates to detail pages.
 * Provides visual feedback (hover effect, cursor change) to indicate interactivity.
 * 
 * Requirements:
 * - 6.1: Navigate to dedicated detail page on click
 * - 6.6: Visual feedback (hover effect, cursor change)
 * - 6.7: Breadcrumb navigation in detail pages
 * 
 * @example
 * <ClickableWidget
 *   title="Orders Received"
 *   value={1234}
 *   icon={<ShoppingBagIcon />}
 *   detailPageUrl="/panel/client/details/orders-received"
 * />
 */
export default function ClickableWidget({
  detailPageUrl,
  isClickable = true,
  ...metricCardProps
}: ClickableWidgetProps): JSX.Element {
  const router = useRouter();

  const handleClick = () => {
    if (isClickable) {
      router.push(detailPageUrl);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      router.push(detailPageUrl);
    }
  };

  if (!isClickable) {
    return <MetricCard {...metricCardProps} />;
  }

  return (
    <div
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      className="cursor-pointer transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 rounded-lg"
      data-testid="clickable-widget"
      aria-label={`View details for ${metricCardProps.title}`}
    >
      <MetricCard {...metricCardProps} />
    </div>
  );
}

export { ClickableWidget };
