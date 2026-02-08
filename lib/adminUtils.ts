/**
 * Admin Dashboard Utility Functions
 * Shared utilities for admin dashboard functionality
 */

/**
 * Admin KPI data structure
 * Property 9: Admin dashboard shows system-wide KPIs
 */
export interface AdminKPIs {
  totalUsers: number;
  totalUsersChange: number;
  totalOrders: number;
  totalOrdersChange: number;
  revenue: number;
  revenueChange: number;
  activeShops: number;
  activeShopsChange: number;
}

/**
 * Check if admin KPIs contain all required metrics
 * Property 9: Admin dashboard shows system-wide KPIs
 */
export function hasRequiredAdminKPIs(kpis: AdminKPIs): boolean {
  return (
    typeof kpis.totalUsers === 'number' &&
    typeof kpis.totalOrders === 'number' &&
    typeof kpis.revenue === 'number' &&
    typeof kpis.activeShops === 'number'
  );
}
