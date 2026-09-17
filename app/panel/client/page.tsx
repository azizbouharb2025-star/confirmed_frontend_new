'use client'

/**
 * Seller Dashboard Page
 * Displays KPI cards and widgets based on subscription tier
 * Requirements: 1.1, 1.2, 2.1, 2.4
 */

import { useState, useEffect, useCallback } from 'react'
import {
  ShoppingBagIcon,
  CheckCircleIcon,
  TruckIcon,
  XMarkIcon,
  ChartBarIcon,
  SparklesIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import MetricCard from '@/components/dashboard/MetricCard'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import RecentOrdersWidget from '@/components/dashboard/widgets/RecentOrdersWidget'
import RiskScoreWidget, { RiskScoreData } from '@/components/dashboard/widgets/RiskScoreWidget'
import OperatorFeedbackWidget from '@/components/dashboard/widgets/OperatorFeedbackWidget'
import ComplaintsAnalyticsWidget from '@/components/dashboard/widgets/ComplaintsAnalyticsWidget'
import CourierPerformanceWidget from '@/components/dashboard/widgets/CourierPerformanceWidget'
import PredictiveAnalyticsWidget from '@/components/dashboard/widgets/PredictiveAnalyticsWidget'
import AutomationRecommendationsWidget, { Recommendation } from '@/components/dashboard/widgets/AutomationRecommendationsWidget'
import CancelledOrdersWidget from '@/components/dashboard/CancelledOrdersWidget'

const SHOW_CANCELLED_ORDERS_WIDGET = false
const SHOW_DASHBOARD_QUICK_LINKS = false
import WidgetGate from '@/components/dashboard/WidgetGate'
import { useLanguage } from '@/hooks/useLanguage'
import { useDashboardData, type DashboardPeriod } from '@/hooks/useDashboardData'
import { useSubscription } from '@/hooks/useSubscription'
import { mockAIService } from '@/services/mockAIService'
import Link from 'next/link'
import { formatCurrency } from '@/lib/formatCurrency'

export default function ClientDashboard() {
  const { t } = useLanguage()
  const [selectedPeriod, setSelectedPeriod] = useState<DashboardPeriod>('7d')

    const {
    metrics,
    isLoading,
    error,
    refetch
  } = useDashboardData(true, selectedPeriod)

  const { plan, onPlanChange } = useSubscription()

  const dashboardKpis = metrics?.dashboardKpis
  const aiScore = dashboardKpis?.averageAiScore.value ?? null

  const aiQualityLabel =
    aiScore === null
      ? t('dashboard.insufficientData')
      : aiScore >= 95
        ? t('dashboard.aiQualityExcellent')
        : aiScore >= 90
          ? t('dashboard.aiQualityVeryGood')
          : aiScore >= 80
            ? t('dashboard.aiQualityGood')
            : aiScore >= 70
              ? t('dashboard.aiQualityAverage')
              : aiScore >= 60
                ? t('dashboard.aiQualityWeak')
                : t('dashboard.aiQualityCritical')

  const periodOptions: Array<{
    value: DashboardPeriod
    label: string
  }> = [
    { value: '7d', label: t('dashboard.period7d') },
    { value: '30d', label: t('dashboard.period30d') },
    { value: '90d', label: t('dashboard.period90d') }
  ]
  
  // Track refresh key to force re-render on plan change
  const [_refreshKey, setRefreshKey] = useState(0)
  
  // Modal state for risky orders
  const [showRiskyOrdersModal, setShowRiskyOrdersModal] = useState(false)
  
  // Pro widget data states - using mock data directly
  const [riskScoreData] = useState<RiskScoreData>(mockAIService.getRiskScoreData())
  const [riskScoreLoading] = useState(false)
  const [feedbackData] = useState(mockAIService.getOperatorFeedback())
  const [feedbackLoading] = useState(false)

  // Business widget data states - using mock data directly
  const [complaintsData] = useState(mockAIService.getComplaintsAnalytics())
  const [complaintsLoading] = useState(false)
  const [courierData] = useState(mockAIService.getCourierPerformance())
  const [courierLoading] = useState(false)

  // Enterprise widget data states - using mock data directly
  const [predictiveData] = useState(mockAIService.getPredictiveAnalytics())
  const [predictiveLoading] = useState(false)
  const [recommendationsData] = useState(mockAIService.getAutomationRecommendations())
  const [recommendationsLoading] = useState(false)

  /**
   * Listen for subscription plan changes and trigger dashboard refresh
   * Requirements: 6.2 - Refresh dashboard on plan change
   */
  const handlePlanChange = useCallback(() => {
    // Increment refresh key to trigger re-render
    setRefreshKey((prev) => prev + 1)
    // Refetch dashboard metrics
    refetch()
  }, [refetch])

  useEffect(() => {
    const unsubscribe = onPlanChange(handlePlanChange)
    return () => unsubscribe()
  }, [onPlanChange, handlePlanChange])

  // Handle recommendation action click
  const handleRecommendationAction = useCallback(async (recommendation: Recommendation) => {
    // Show toast notification
    alert(`Applying recommendation: ${recommendation.title}`)
  }, [])

  // Handle "Show me risky orders" click
  const handleShowRiskyOrders = useCallback(() => {
    setShowRiskyOrdersModal(true)
  }, [])

  return (
    <ProtectedRoute allowedRoles={['shop_owner']}>
      <DashboardLayout userRole="shop_owner">
        <div className="space-y-5">
          {/* Header */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">
                {t('dashboard.client')}
              </h1>

              <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
                {t('dashboard.monitorPerformance')}
              </p>
            </div>

            <div
              className="inline-flex w-fit flex-wrap gap-1 rounded-xl border border-gray-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800"
              role="group"
              aria-label={t('dashboard.period')}
            >
              {periodOptions.map(option => {
                const active =
                  selectedPeriod === option.value

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setSelectedPeriod(option.value)
                    }
                    aria-pressed={active}
                    className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                      active
                        ? 'bg-[#ADFF2F] text-slate-950'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Error state */}
          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
              <p className="text-sm">{error}</p>
              <button
                onClick={refetch}
                className="mt-2 text-sm underline hover:no-underline"
              >
                {t('dashboard.tryAgain')}
              </button>
            </div>
          )}

          {/* Dashboard KPI */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <MetricCard
                title={t('dashboard.ordersReceived')}
                value={
                  dashboardKpis?.ordersReceived.value ??
                  metrics?.ordersReceived ??
                  0
                }
                change={dashboardKpis?.ordersReceived.change ?? undefined}
                icon={<ShoppingBagIcon className="h-6 w-6" />}
                isLoading={isLoading}
              />

              <MetricCard
                title={t('dashboard.ordersConfirmed')}
                value={
                  dashboardKpis?.ordersConfirmed.value ??
                  metrics?.ordersConfirmed ??
                  0
                }
                change={dashboardKpis?.ordersConfirmed.change ?? undefined}
                icon={<CheckCircleIcon className="h-6 w-6" />}
                isLoading={isLoading}
              />

              <MetricCard
                title={t('dashboard.confirmationRate')}
                value={
                  dashboardKpis?.confirmationRate.value ??
                  metrics?.confirmationRate ??
                  0
                }
                change={dashboardKpis?.confirmationRate.change ?? undefined}
                suffix="%"
                decimals={1}
                icon={<ChartBarIcon className="h-6 w-6" />}
                isLoading={isLoading}
              />

              <MetricCard
                title={t('dashboard.averageAiScore')}
                value={aiScore ?? 0}
                formattedValue={aiScore === null ? '—' : undefined}
                change={dashboardKpis?.averageAiScore.change ?? undefined}
                suffix="%"
                decimals={1}
                secondaryLabel={aiQualityLabel}
                icon={<SparklesIcon className="h-6 w-6" />}
                isLoading={isLoading}
              />

              <MetricCard
                title={t('dashboard.potentialRevenue')}
                value={dashboardKpis?.potentialRevenue.value ?? 0}
                formattedValue={formatCurrency(
                  dashboardKpis?.potentialRevenue.value ?? 0
                )}
                change={dashboardKpis?.potentialRevenue.change ?? undefined}
                icon={<BanknotesIcon className="h-6 w-6" />}
                isLoading={isLoading}
              />
          </div>

          {/* Recent Orders Widget - Requirements: 1.2 */}
          <RecentOrdersWidget maxOrders={5} />

          {/* Cancelled Orders Widget - Requirements: 9.1, 9.2, 9.6 */}
          {SHOW_CANCELLED_ORDERS_WIDGET && <CancelledOrdersWidget />}

          {/* Pro Plan Widgets - Requirements: 2.1, 2.4 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* AI Risk Score Widget - Pro+ */}
            <WidgetGate
              requiredPlan="pro"
              currentPlan={plan}
              previewOnly
              previewLabel="Bientôt disponible"
              featureName="Analyse du risque IA"
              featureDescription="Identifiez les commandes à risque grâce au score de confiance de l’IA."
            >
              <RiskScoreWidget
                data={riskScoreData}
                isLoading={riskScoreLoading}
                onShowRiskyOrders={handleShowRiskyOrders}
              />
            </WidgetGate>

            {/* Operator Feedback Widget - Pro+ */}
            <WidgetGate
              requiredPlan="pro"
              currentPlan={plan}
              previewOnly
              previewLabel="Bientôt disponible"
              featureName="Analyse Vocale IA & Feedback Opérateurs"
              featureDescription="Analysez les retours des opérateurs et les signaux issus des interactions vocales."
            >
              <OperatorFeedbackWidget
                averageRating={feedbackData.averageRating}
                totalFeedback={feedbackData.totalFeedback}
                topTags={feedbackData.topTags}
                isLoading={feedbackLoading}
              />
            </WidgetGate>
          </div>

          {/* Business Plan Widgets - Requirements: 3.1, 3.4 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Complaints Analytics Widget - Business+ */}
            <WidgetGate
              requiredPlan="business"
              currentPlan={plan}
              previewOnly
              previewLabel="Bientôt disponible"
              featureName="Analyse des réclamations"
              featureDescription="Suivez les tendances, les catégories et les taux de résolution des réclamations."
            >
              <ComplaintsAnalyticsWidget
                totalComplaints={complaintsData.totalComplaints}
                resolutionRate={complaintsData.resolutionRate}
                trendData={complaintsData.trendData}
                categories={complaintsData.categories}
                isLoading={complaintsLoading}
              />
            </WidgetGate>

            {/* Courier Performance Widget - Business+ */}
            <WidgetGate
              requiredPlan="business"
              currentPlan={plan}
              previewOnly
              previewLabel="Bientôt disponible"
              featureName="Performance des sociétés de livraison"
              featureDescription="Comparez les taux de réussite de livraison et identifiez les partenaires les plus performants."
            >
              <CourierPerformanceWidget
                couriers={courierData}
                isLoading={courierLoading}
              />
            </WidgetGate>
          </div>

          {/* Enterprise Plan Widgets - Requirements: 4.1, 4.4 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Predictive Analytics Widget - Enterprise */}
            <WidgetGate
              requiredPlan="enterprise"
              currentPlan={plan}
              previewOnly
              previewLabel="Bientôt disponible"
              featureName="Prédiction de l’IA des Commandes"
              featureDescription="Anticipez les volumes de commandes et les taux de confirmation grâce à l’intelligence artificielle."
            >
              <PredictiveAnalyticsWidget
                forecastedOrders={predictiveData.forecastedOrders}
                forecastedConfirmationRate={predictiveData.forecastedConfirmationRate}
                confidence={predictiveData.confidence}
                isLoading={predictiveLoading}
              />
            </WidgetGate>

            {/* Automation Recommendations Widget - Enterprise */}
            <WidgetGate
              requiredPlan="enterprise"
              currentPlan={plan}
              previewOnly
              previewLabel="Bientôt disponible"
              featureName="Recommandations d’Automatisation IA"
              featureDescription="Recevez des recommandations IA pour automatiser et optimiser vos processus."
            >
              <AutomationRecommendationsWidget
                recommendations={recommendationsData}
                isLoading={recommendationsLoading}
                onActionClick={handleRecommendationAction}
              />
            </WidgetGate>
          </div>

          {/* Quick Links - conservés mais masqués temporairement */}
          {SHOW_DASHBOARD_QUICK_LINKS && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/panel/client/orders" className="card p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <ShoppingBagIcon className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold">{t('nav.orders')}</h3>
                  <p className="text-sm dark:text-slate-400 light:text-gray-600">{t('dashboard.manageOrders')}</p>
                </div>
              </div>
            </Link>

            <Link href="/panel/client/products" className="card p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <TruckIcon className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold">{t('nav.products')}</h3>
                  <p className="text-sm dark:text-slate-400 light:text-gray-600">{t('dashboard.viewProducts')}</p>
                </div>
              </div>
            </Link>
          </div>
          )}
        </div>

        {/* Risky Orders Modal */}
        {showRiskyOrdersModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold">{t('dashboard.riskyOrders')}</h3>
                <button
                  onClick={() => setShowRiskyOrdersModal(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 overflow-y-auto max-h-[60vh]">
                <div className="space-y-3">
                  {/* Mock Risky Order 1 */}
                  <div className="p-4 border border-red-200 dark:border-red-900/30 rounded-lg bg-red-50 dark:bg-red-900/10">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-sm">Order #ORD-2847-18</p>
                        <p className="text-xs text-gray-600 dark:text-slate-400">{t('dashboard.riskyOrderCustomer')}: Ahmed Ben Salah</p>
                      </div>
                      <span className="px-2 py-1 text-xs font-medium bg-red-500 text-white rounded">
                        {t('dashboard.riskyOrderAIScore')}: 32%
                      </span>
                    </div>
                    <div className="text-xs space-y-1">
                      <p><span className="font-medium">{t('dashboard.riskyOrderPhone')}:</span> +216 98 765 432</p>
                      <p><span className="font-medium">{t('dashboard.riskyOrderAmount')}:</span> 38 TND</p>
                      <p><span className="font-medium">{t('dashboard.riskyOrderRegion')}:</span> Kasserine</p>
                      <p className="text-red-600 dark:text-red-400 mt-2">
                        ⚠️ {t('dashboard.riskyOrderReasons')}: New customer, remote region, low order value
                      </p>
                    </div>
                  </div>

                  {/* Mock Risky Order 2 */}
                  <div className="p-4 border border-red-200 dark:border-red-900/30 rounded-lg bg-red-50 dark:bg-red-900/10">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-sm">Order #ORD-2847-22</p>
                        <p className="text-xs text-gray-600 dark:text-slate-400">{t('dashboard.riskyOrderCustomer')}: Fatma Trabelsi</p>
                      </div>
                      <span className="px-2 py-1 text-xs font-medium bg-red-500 text-white rounded">
                        {t('dashboard.riskyOrderAIScore')}: 28%
                      </span>
                    </div>
                    <div className="text-xs space-y-1">
                      <p><span className="font-medium">{t('dashboard.riskyOrderPhone')}:</span> +216 20 111 222</p>
                      <p><span className="font-medium">{t('dashboard.riskyOrderAmount')}:</span> 22 TND</p>
                      <p><span className="font-medium">{t('dashboard.riskyOrderRegion')}:</span> Tataouine</p>
                      <p className="text-red-600 dark:text-red-400 mt-2">
                        ⚠️ {t('dashboard.riskyOrderReasons')}: Very low order value, remote region, late night order
                      </p>
                    </div>
                  </div>

                  {/* Mock Risky Order 3 */}
                  <div className="p-4 border border-red-200 dark:border-red-900/30 rounded-lg bg-red-50 dark:bg-red-900/10">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-sm">Order #ORD-2847-35</p>
                        <p className="text-xs text-gray-600 dark:text-slate-400">{t('dashboard.riskyOrderCustomer')}: Mohamed Gharbi</p>
                      </div>
                      <span className="px-2 py-1 text-xs font-medium bg-orange-500 text-white rounded">
                        {t('dashboard.riskyOrderAIScore')}: 41%
                      </span>
                    </div>
                    <div className="text-xs space-y-1">
                      <p><span className="font-medium">{t('dashboard.riskyOrderPhone')}:</span> +216 55 999 888</p>
                      <p><span className="font-medium">{t('dashboard.riskyOrderAmount')}:</span> 45 TND</p>
                      <p><span className="font-medium">{t('dashboard.riskyOrderRegion')}:</span> Gafsa</p>
                      <p className="text-orange-600 dark:text-orange-400 mt-2">
                        ⚠️ {t('dashboard.riskyOrderReasons')}: Duplicate phone detected, previous cancellation history
                      </p>
                    </div>
                  </div>

                  {/* Mock Risky Order 4 */}
                  <div className="p-4 border border-red-200 dark:border-red-900/30 rounded-lg bg-red-50 dark:bg-red-900/10">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-sm">Order #ORD-2847-41</p>
                        <p className="text-xs text-gray-600 dark:text-slate-400">{t('dashboard.riskyOrderCustomer')}: Salma Mansouri</p>
                      </div>
                      <span className="px-2 py-1 text-xs font-medium bg-red-500 text-white rounded">
                        {t('dashboard.riskyOrderAIScore')}: 35%
                      </span>
                    </div>
                    <div className="text-xs space-y-1">
                      <p><span className="font-medium">{t('dashboard.riskyOrderPhone')}:</span> +216 22 333 444</p>
                      <p><span className="font-medium">{t('dashboard.riskyOrderAmount')}:</span> 19 TND</p>
                      <p><span className="font-medium">{t('dashboard.riskyOrderRegion')}:</span> Tozeur</p>
                      <p className="text-red-600 dark:text-red-400 mt-2">
                        ⚠️ {t('dashboard.riskyOrderReasons')}: Extremely low value, incomplete address data
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-2">
                <button
                  onClick={() => setShowRiskyOrdersModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
                >
                  {t('dashboard.riskyOrdersClose')}
                </button>
                <Link
                  href="/panel/client/orders?filter=risky"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg"
                >
                  {t('dashboard.riskyOrdersViewAll')}
                </Link>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}
