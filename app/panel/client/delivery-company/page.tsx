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
          <div className="relative isolate space-y-6">

            {/* Ambiance Confirmed - décorative uniquement */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] overflow-hidden rounded-[32px]"
              aria-hidden="true"
            >
              <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#ADFF2F]/10 blur-3xl" />
              <div className="absolute right-[8%] top-0 h-80 w-80 rounded-full bg-[#00BFFF]/10 blur-3xl" />
              <div className="absolute left-[42%] top-44 h-52 w-52 rounded-full bg-[#32CD32]/[0.07] blur-3xl" />
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white/90 px-5 py-4 shadow-[0_8px_30px_rgba(15,23,42,0.045)] backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-900/85">
              <div className="relative pl-4">
                <span
                  className="absolute bottom-0 left-0 top-0 w-1 rounded-full bg-gradient-to-b from-[#ADFF2F] via-[#32CD32] to-[#00BFFF]"
                  aria-hidden="true"
                />
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
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
