'use client'

import DashboardLayout from '@/components/dashboard/DashboardLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import ErrorBoundary from '@/components/ErrorBoundary'
import TeamManagementPage from '@/components/team/TeamManagementPage'

/**
 * Team Management Page
 * Requirements: 1.1, 1.2, 1.4, 1.5, 1.6
 * 
 * Features:
 * - Two tabs: "Mon équipe" (My Team) and "Opérateurs" (Operators)
 * - Team member cards with status badges (invited/pending/confirmed)
 * - Operator cards with performance metrics
 * - Invite team member modal
 */
export default function TeamPage() {
  return (
    <ErrorBoundary>
      <ProtectedRoute allowedRoles={['shop_owner']}>
        <DashboardLayout userRole="shop_owner">
          <TeamManagementPage />
        </DashboardLayout>
      </ProtectedRoute>
    </ErrorBoundary>
  )
}
