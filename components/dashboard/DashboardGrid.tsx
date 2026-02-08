'use client';

/**
 * DashboardGrid Component
 * Responsive grid layout for dashboard widgets
 * Requirements: 9.1, 9.2, 9.3
 * 
 * Feature: subscription-tiered-dashboards, Property 11: Viewport size determines grid layout
 * Validates: Requirements 9.1, 9.2, 9.3
 */

import { ReactNode } from 'react';

export interface DashboardGridProps {
  /** Grid children (widgets) */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Number of columns for desktop (default: 3) */
  desktopColumns?: 3 | 4;
}

/**
 * Breakpoint constants for responsive layout
 * Mobile: < 768px (1 column)
 * Tablet: 768px - 1024px (2 columns)
 * Desktop: > 1024px (3+ columns)
 */
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
} as const;

/**
 * Get the number of columns based on viewport width
 * Property 11: Viewport size determines grid layout
 * 
 * @param viewportWidth - Current viewport width in pixels
 * @param desktopColumns - Number of columns for desktop (default: 3)
 * @returns Number of columns to display
 */
export function getGridColumns(viewportWidth: number, desktopColumns: 3 | 4 = 3): number {
  if (viewportWidth < BREAKPOINTS.mobile) {
    return 1; // Mobile: 1 column
  }
  if (viewportWidth < BREAKPOINTS.tablet) {
    return 2; // Tablet: 2 columns
  }
  return desktopColumns; // Desktop: 3+ columns
}

/**
 * DashboardGrid - Responsive grid container for dashboard widgets
 * 
 * Implements responsive layout:
 * - Mobile (<768px): 1 column, widgets stacked vertically
 * - Tablet (768-1024px): 2 columns
 * - Desktop (>1024px): 3+ columns
 * 
 * @example
 * <DashboardGrid>
 *   <MetricCard title="Orders" value={100} />
 *   <MetricCard title="Revenue" value={5000} />
 *   <RecentOrdersWidget />
 * </DashboardGrid>
 */
export function DashboardGrid({
  children,
  className = '',
  desktopColumns = 3,
}: DashboardGridProps): JSX.Element {
  // Tailwind classes for responsive grid
  // Mobile: grid-cols-1 (default)
  // Tablet (md: 768px): grid-cols-2
  // Desktop (lg: 1024px): grid-cols-3 or grid-cols-4
  const desktopColsClass = desktopColumns === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3';
  
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 ${desktopColsClass} gap-4 ${className}`}
      data-testid="dashboard-grid"
    >
      {children}
    </div>
  );
}

export default DashboardGrid;
