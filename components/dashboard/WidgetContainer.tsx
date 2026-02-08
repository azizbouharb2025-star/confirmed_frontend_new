'use client';

/**
 * WidgetContainer Component
 * Responsive container for dashboard widgets with loading and error states
 * Requirements: 1.3, 1.4, 6.4
 */

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export interface WidgetContainerProps {
  /** Widget title displayed in the header */
  title: string;
  /** Optional icon displayed next to the title */
  icon?: ReactNode;
  /** Widget content */
  children: ReactNode;
  /** Whether the widget is in a loading state */
  isLoading?: boolean;
  /** Error message to display */
  error?: string;
  /** Callback when retry button is clicked */
  onRetry?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Loading skeleton placeholder for widget content
 * Requirements: 1.3 - Display animated skeleton placeholders
 */
function LoadingSkeleton(): JSX.Element {
  return (
    <div className="animate-pulse space-y-4" data-testid="widget-loading-skeleton">
      <div className="h-4 bg-slate-700 dark:bg-slate-700 light:bg-gray-200 rounded w-3/4" />
      <div className="h-20 bg-slate-700 dark:bg-slate-700 light:bg-gray-200 rounded" />
      <div className="h-4 bg-slate-700 dark:bg-slate-700 light:bg-gray-200 rounded w-1/2" />
      <div className="h-4 bg-slate-700 dark:bg-slate-700 light:bg-gray-200 rounded w-2/3" />
    </div>
  );
}

/**
 * Error state display with retry button
 * Requirements: 1.4 - Display error state with retry button
 */
function ErrorState({ 
  error, 
  onRetry 
}: { 
  error: string; 
  onRetry?: () => void; 
}): JSX.Element {
  return (
    <div 
      className="flex flex-col items-center justify-center py-8 text-center"
      data-testid="widget-error-state"
    >
      <div className="mb-4 p-3 rounded-full bg-red-500/10">
        <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
      </div>
      <p className="text-sm text-slate-400 dark:text-slate-400 light:text-gray-600 mb-4 max-w-xs">
        {error}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600 light:bg-gray-200 light:hover:bg-gray-300 text-sm font-medium transition-colors duration-200"
          data-testid="widget-retry-button"
        >
          <ArrowPathIcon className="w-4 h-4" />
          Retry
        </button>
      )}
    </div>
  );
}

/**
 * WidgetContainer - Responsive container for dashboard widgets
 * 
 * Provides consistent styling, loading states, and error handling
 * for all dashboard widgets.
 * 
 * @example
 * <WidgetContainer
 *   title="Recent Orders"
 *   icon={<ShoppingCartIcon className="w-5 h-5" />}
 *   isLoading={isLoading}
 *   error={error}
 *   onRetry={refetch}
 * >
 *   <OrdersTable orders={orders} />
 * </WidgetContainer>
 */
export function WidgetContainer({
  title,
  icon,
  children,
  isLoading = false,
  error,
  onRetry,
  className = '',
}: WidgetContainerProps): JSX.Element {
  return (
    <motion.div 
      className={`card p-4 sm:p-6 ${className}`}
      data-testid="widget-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header with title and icon */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon && (
            <div className="text-slate-400 dark:text-slate-400 light:text-gray-500">
              {icon}
            </div>
          )}
          <h3 className="text-sm font-medium dark:text-slate-300 light:text-gray-700">
            {title}
          </h3>
        </div>
      </div>

      {/* Content area with animated transitions - Requirements: 6.4 */}
      <div className="min-h-[120px]">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <LoadingSkeleton />
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ErrorState error={error} onRetry={onRetry} />
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default WidgetContainer;
