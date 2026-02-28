'use client'

import DashboardLayout from '@/components/dashboard/DashboardLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import ErrorBoundary from '@/components/ErrorBoundary'
import DeliveryCompanyPanel from '@/components/delivery/DeliveryCompanyPanel'
import { useLanguage } from '@/hooks/useLanguage'
import { useTheme } from '@/hooks/useTheme'

export default function DeliveryCompanyPage() {
  const { t } = useLanguage()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // TODO: Get actual shop ID from auth context
  const shopId = 'shop_123'

  return (
    <ErrorBoundary>
      <ProtectedRoute allowedRoles={['shop_owner']}>
        <DashboardLayout userRole="shop_owner">
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-semibold">{t('delivery.title')}</h1>
              <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                {t('delivery.subtitle')}
              </p>
            </div>

            {/* Delivery Company Panel */}
            <DeliveryCompanyPanel shopId={shopId} />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    </ErrorBoundary>
  )
}
