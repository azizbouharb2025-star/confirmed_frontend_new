'use client';

/**
 * WidgetDetailPage Component
 * Shared layout for widget detail pages with breadcrumb navigation
 * Requirements: 6.2, 6.3, 6.7
 */

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '@/hooks/useLanguage';

export interface WidgetDetailPageProps {
  /** Page title */
  title: string;
  /** Page description */
  description?: string;
  /** Main content */
  children: ReactNode;
  /** Breadcrumb items (excluding Home and Dashboard which are automatic) */
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

/**
 * WidgetDetailPage - Layout for widget detail pages
 * 
 * Provides consistent layout with:
 * - Breadcrumb navigation back to dashboard
 * - Page title and description
 * - Content area for charts and data
 * 
 * Requirements:
 * - 6.2: Display expanded data related to widget's metric
 * - 6.3: Include analytical visualizations
 * - 6.7: Breadcrumb navigation to return to dashboard
 * 
 * @example
 * <WidgetDetailPage
 *   title="Orders Received"
 *   description="Detailed view of all received orders"
 *   breadcrumbs={[{ label: 'Orders Received' }]}
 * >
 *   <OrdersTable />
 * </WidgetDetailPage>
 */
export default function WidgetDetailPage({
  title,
  description,
  children,
  breadcrumbs = [],
}: WidgetDetailPageProps): JSX.Element {
  const router = useRouter();
  const { t } = useLanguage();

  const handleBreadcrumbClick = (href?: string) => {
    if (href) {
      router.push(href);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation - Requirements: 6.7 */}
      <nav className="flex items-center space-x-2 text-sm" aria-label="Breadcrumb">
        <button
          onClick={() => handleBreadcrumbClick('/panel/client')}
          className="flex items-center text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          aria-label={t('breadcrumb.home')}
        >
          <HomeIcon className="w-4 h-4" />
        </button>
        
        <ChevronRightIcon className="w-4 h-4 text-slate-400" />
        
        <button
          onClick={() => handleBreadcrumbClick('/panel/client')}
          className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
          {t('breadcrumb.dashboard')}
        </button>

        {breadcrumbs.map((crumb, index) => (
          <div key={index} className="flex items-center space-x-2">
            <ChevronRightIcon className="w-4 h-4 text-slate-400" />
            {crumb.href ? (
              <button
                onClick={() => handleBreadcrumbClick(crumb.href)}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              >
                {crumb.label}
              </button>
            ) : (
              <span className="text-slate-900 dark:text-slate-100 font-medium">
                {crumb.label}
              </span>
            )}
          </div>
        ))}
      </nav>

      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          {title}
        </h1>
        {description && (
          <p className="text-slate-600 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>

      {/* Content Area - Requirements: 6.2, 6.3 */}
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}

export { WidgetDetailPage };
