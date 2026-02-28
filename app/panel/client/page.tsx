'use client'

/**
 * Seller Dashboard Page
 * Displays KPI cards and widgets based on subscription tier
 * Requirements: 1.1, 1.2, 2.1, 2.4
 */

import { useState, useEffect, useCallback } from 'react'
import { ShoppingBagIcon, CheckCircleIcon, ClockIcon, TruckIcon, ExclamationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'
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
import WidgetGate from '@/components/dashboard/WidgetGate'
import StaleDataIndicator from '@/components/dashboard/StaleDataIndicator'
import { useLanguage } from '@/hooks/useLanguage'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useSubscription } from '@/hooks/useSubscription'
import { mockAIService } from '@/services/mockAIService'
import Link from 'next/link'

export default function ClientDashboard() {
  const { t } = useLanguage()
  const { 
    metrics, 
    isLoading, 
    error, 
    refetch, 
    isStale, 
    lastUpdated,
    autoRefreshEnabled,
    setAutoRefresh 
  } = useDashboardData()
  const { plan, onPlanChange } = useSubscription()
  
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
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">{t('dashboard.client')}</h1>
              <p className="text-sm dark:text-slate-400 light:text-gray-600 mt-1">
                {t('dashboard.monitorPerformance')}
              </p>
            </div>
            {/* Stale data indicator with refresh controls - Requirements: 6.3 */}
            <StaleDataIndicator
              isStale={isStale}
              lastUpdated={lastUpdated}
              autoRefresh={autoRefreshEnabled}
              onAutoRefreshToggle={setAutoRefresh}
              onRefresh={refetch}
              isRefreshing={isLoading}
            />
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

          {/* KPI Cards - Plan-specific Requirements */}
          {/* Starter Plan: 3 cards - Orders Received, Confirmed, Pending */}
          {/* Pro Plan: 4 cards - Orders Received Today, Confirmed Today, Shipped Today, Delivery Success Rate (7 days) */}
          {/* Business Plan: 5 cards - Orders Received, Confirmed, Shipped, Delivery Success Rate, Complaint Rate */}
          {/* Enterprise Plan: 6 cards - Same as Business + Avg Resolution Time */}
          <div className={`grid grid-cols-1 gap-4 ${
            plan === 'starter' ? 'md:grid-cols-3' :
            plan === 'pro' ? 'md:grid-cols-4' :
            plan === 'business' ? 'md:grid-cols-5' :
            'md:grid-cols-3 lg:grid-cols-6'
          }`}>
            {/* Orders Received - All Plans */}
            <MetricCard
              title={plan === 'pro' ? t('dashboard.ordersReceivedToday') : t('dashboard.ordersReceived')}
              value={metrics?.ordersReceived ?? 0}
              icon={<ShoppingBagIcon className="w-6 h-6" />}
              isLoading={isLoading}
            />
            
            {/* Orders Confirmed - All Plans */}
            <MetricCard
              title={plan === 'pro' ? t('dashboard.ordersConfirmedToday') : t('dashboard.ordersConfirmed')}
              value={metrics?.ordersConfirmed ?? 0}
              change={metrics?.confirmationRate}
              icon={<CheckCircleIcon className="w-6 h-6" />}
              trend={metrics?.confirmationRate && metrics.confirmationRate > 0 ? 'up' : 'neutral'}
              isLoading={isLoading}
            />
            
            {/* Starter: Orders Pending */}
            {plan === 'starter' && (
              <MetricCard
                title={t('dashboard.ordersPending')}
                value={metrics?.ordersPending ?? 0}
                icon={<ClockIcon className="w-6 h-6" />}
                isLoading={isLoading}
              />
            )}
            
            {/* Pro+: Orders Shipped Today */}
            {(plan === 'pro' || plan === 'business' || plan === 'enterprise') && (
              <MetricCard
                title={plan === 'pro' ? t('dashboard.ordersShippedToday') : t('dashboard.ordersShipped')}
                value={metrics?.ordersShipped ?? 0}
                icon={<TruckIcon className="w-6 h-6" />}
                isLoading={isLoading}
              />
            )}
            
            {/* Pro+: Delivery Success Rate (last 7 days) */}
            {(plan === 'pro' || plan === 'business' || plan === 'enterprise') && (
              <MetricCard
                title={plan === 'pro' ? t('dashboard.deliverySuccessRate7d') : t('dashboard.deliverySuccessRate')}
                value={metrics?.deliverySuccessRate ?? 0}
                suffix="%"
                decimals={1}
                icon={<CheckCircleIcon className="w-6 h-6" />}
                trend={metrics?.deliverySuccessRate && metrics.deliverySuccessRate >= 80 ? 'up' : metrics?.deliverySuccessRate && metrics.deliverySuccessRate < 60 ? 'down' : 'neutral'}
                isLoading={isLoading}
              />
            )}
            
            {/* Business+: Complaint Rate */}
            {(plan === 'business' || plan === 'enterprise') && (
              <MetricCard
                title={t('dashboard.complaintRate')}
                value={metrics?.complaintRate ?? 0}
                suffix="%"
                decimals={1}
                icon={<ExclamationCircleIcon className="w-6 h-6" />}
                trend={metrics?.complaintRate && metrics.complaintRate > 5 ? 'down' : 'up'}
                isLoading={isLoading}
              />
            )}
            
            {/* Enterprise: Avg Resolution Time */}
            {plan === 'enterprise' && (
              <MetricCard
                title={t('dashboard.avgResolutionTime')}
                value={metrics?.avgResolutionTime ?? 0}
                suffix="h"
                decimals={1}
                icon={<ClockIcon className="w-6 h-6" />}
                trend={metrics?.avgResolutionTime && metrics.avgResolutionTime < 24 ? 'up' : 'down'}
                isLoading={isLoading}
              />
            )}
          </div>

          {/* Recent Orders Widget - Requirements: 1.2 */}
          <RecentOrdersWidget maxOrders={10} />

          {/* Pro Plan Widgets - Requirements: 2.1, 2.4 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* AI Risk Score Widget - Pro+ */}
            <WidgetGate
              requiredPlan="pro"
              currentPlan={plan}
              featureName="AI Risk Score"
              featureDescription="View order distribution by AI confidence level to identify high-risk orders"
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
              featureName="Operator Feedback"
              featureDescription="See average ratings and common feedback tags from operator assessments"
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
              featureName="Complaints Analytics"
              featureDescription="View complaint trends, categories, and resolution rates to improve customer satisfaction"
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
              featureName="Courier Performance"
              featureDescription="Compare courier delivery success rates and identify top performers"
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
              featureName="Predictive Analytics"
              featureDescription="View AI-powered forecasts for order volumes and confirmation rates"
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
              featureName="Automation Recommendations"
              featureDescription="Get AI-powered suggestions for workflow optimizations"
            >
              <AutomationRecommendationsWidget
                recommendations={recommendationsData}
                isLoading={recommendationsLoading}
                onActionClick={handleRecommendationAction}
              />
            </WidgetGate>
          </div>

          {/* Quick Links */}
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
                        <p className="font-semibold text-sm">Order #ORD-2024-001</p>
                        <p className="text-xs text-gray-600 dark:text-slate-400">{t('dashboard.riskyOrderCustomer')}: Ahmed Ben Ali</p>
                      </div>
                      <span className="px-2 py-1 text-xs font-medium bg-red-500 text-white rounded">
                        {t('dashboard.riskyOrderAIScore')}: 35%
                      </span>
                    </div>
                    <div className="text-xs space-y-1">
                      <p><span className="font-medium">{t('dashboard.riskyOrderPhone')}:</span> +216 98 765 432</p>
                      <p><span className="font-medium">{t('dashboard.riskyOrderAmount')}:</span> 45 TND</p>
                      <p><span className="font-medium">{t('dashboard.riskyOrderRegion')}:</span> Kasserine</p>
                      <p className="text-red-600 dark:text-red-400 mt-2">
                        ⚠️ {t('dashboard.riskyOrderReasons')}: New customer, low-value region, suspicious phone pattern
                      </p>
                    </div>
                  </div>

                  {/* Mock Risky Order 2 */}
                  <div className="p-4 border border-red-200 dark:border-red-900/30 rounded-lg bg-red-50 dark:bg-red-900/10">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-sm">Order #ORD-2024-002</p>
                        <p className="text-xs text-gray-600 dark:text-slate-400">{t('dashboard.riskyOrderCustomer')}: Fatma Trabelsi</p>
                      </div>
                      <span className="px-2 py-1 text-xs font-medium bg-red-500 text-white rounded">
                        {t('dashboard.riskyOrderAIScore')}: 28%
                      </span>
                    </div>
                    <div className="text-xs space-y-1">
                      <p><span className="font-medium">{t('dashboard.riskyOrderPhone')}:</span> +216 20 111 222</p>
                      <p><span className="font-medium">{t('dashboard.riskyOrderAmount')}:</span> 25 TND</p>
                      <p><span className="font-medium">{t('dashboard.riskyOrderRegion')}:</span> Tataouine</p>
                      <p className="text-red-600 dark:text-red-400 mt-2">
                        ⚠️ {t('dashboard.riskyOrderReasons')}: Very low order value, remote region, order placed at 3 AM
                      </p>
                    </div>
                  </div>

                  {/* Mock Risky Order 3 */}
                  <div className="p-4 border border-red-200 dark:border-red-900/30 rounded-lg bg-red-50 dark:bg-red-900/10">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-sm">Order #ORD-2024-003</p>
                        <p className="text-xs text-gray-600 dark:text-slate-400">{t('dashboard.riskyOrderCustomer')}: Mohamed Gharbi</p>
                      </div>
                      <span className="px-2 py-1 text-xs font-medium bg-orange-500 text-white rounded">
                        {t('dashboard.riskyOrderAIScore')}: 42%
                      </span>
                    </div>
                    <div className="text-xs space-y-1">
                      <p><span className="font-medium">{t('dashboard.riskyOrderPhone')}:</span> +216 55 999 888</p>
                      <p><span className="font-medium">{t('dashboard.riskyOrderAmount')}:</span> 35 TND</p>
                      <p><span className="font-medium">{t('dashboard.riskyOrderRegion')}:</span> Gafsa</p>
                      <p className="text-orange-600 dark:text-orange-400 mt-2">
                        ⚠️ {t('dashboard.riskyOrderReasons')}: Duplicate phone number detected, previous cancellation history
                      </p>
                    </div>
                  </div>

                  {/* Mock Risky Order 4 */}
                  <div className="p-4 border border-red-200 dark:border-red-900/30 rounded-lg bg-red-50 dark:bg-red-900/10">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-sm">Order #ORD-2024-004</p>
                        <p className="text-xs text-gray-600 dark:text-slate-400">{t('dashboard.riskyOrderCustomer')}: Salma Mansouri</p>
                      </div>
                      <span className="px-2 py-1 text-xs font-medium bg-red-500 text-white rounded">
                        {t('dashboard.riskyOrderAIScore')}: 31%
                      </span>
                    </div>
                    <div className="text-xs space-y-1">
                      <p><span className="font-medium">{t('dashboard.riskyOrderPhone')}:</span> +216 22 333 444</p>
                      <p><span className="font-medium">{t('dashboard.riskyOrderAmount')}:</span> 18 TND</p>
                      <p><span className="font-medium">{t('dashboard.riskyOrderRegion')}:</span> Tozeur</p>
                      <p className="text-red-600 dark:text-red-400 mt-2">
                        ⚠️ {t('dashboard.riskyOrderReasons')}: Extremely low value, incomplete address, invalid phone format
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
