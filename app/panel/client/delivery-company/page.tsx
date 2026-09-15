'use client'

import DashboardLayout from '@/components/dashboard/DashboardLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import ErrorBoundary from '@/components/ErrorBoundary'
import ColissimoConnectionCard from '@/components/delivery/ColissimoConnectionCard'
import IntigoConnectionCard from '@/components/delivery/IntigoConnectionCard'
import { useLanguage } from '@/hooks/useLanguage'
import { useTheme } from '@/hooks/useTheme'

export default function DeliveryCompanyPage() {
  const { t } = useLanguage()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <ErrorBoundary>
      <ProtectedRoute allowedRoles={['shop_owner']}>
        <DashboardLayout userRole="shop_owner">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold">
                {t('delivery.title')}
              </h1>

              <p
                className={[
                  'mt-1 text-sm',
                  isDark
                    ? 'text-slate-400'
                    : 'text-gray-600',
                ].join(' ')}
              >
                Connectez vos sociétés de livraison à Confirmed.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ColissimoConnectionCard />
              <IntigoConnectionCard />
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    </ErrorBoundary>
  )
}
