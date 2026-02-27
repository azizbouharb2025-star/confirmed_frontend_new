'use client'

/**
 * Seller Dashboard Page
 * Displays KPI cards and widgets based on subscription tier
 * Requirements: 1.1, 1.2, 2.1, 2.4
 */

import { useState, useEffect, useCallback } from 'react'
import { ShoppingBagIcon, CheckCircleIcon, ClockIcon, TruckIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import MetricCard from '@/components/dashboard/MetricCard'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import RecentOrdersWidget from '@/components/dashboard/widgets/RecentOrdersWidget'
import RiskScoreWidget, { RiskScoreData } from '@/components/dashboard/widgets/RiskScoreWidget'
import OperatorFeedbackWidget, { FeedbackTag } from '@/components/dashboard/widgets/OperatorFeedbackWidget'
import ComplaintsAnalyticsWidget, { ComplaintTrendData, ComplaintCategory } from '@/components/dashboard/widgets/ComplaintsAnalyticsWidget'
import CourierPerformanceWidget, { CourierData } from '@/components/dashboard/widgets/CourierPerformanceWidget'
import PredictiveAnalyticsWidget, { ForecastDataPoint } from '@/components/dashboard/widgets/PredictiveAnalyticsWidget'
import AutomationRecommendationsWidget, { Recommendation } from '@/components/dashboard/widgets/AutomationRecommendationsWidget'
import WidgetGate from '@/components/dashboard/WidgetGate'
import StaleDataIndicator from '@/components/dashboard/StaleDataIndicator'
import { useLanguage } from '@/hooks/useLanguage'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useSubscription } from '@/hooks/useSubscription'
import api from '@/lib/api'
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
  
  // Pro widget data states
  const [riskScoreData, setRiskScoreData] = useState<RiskScoreData>({ high: 0, medium: 0, low: 0 })
  const [riskScoreLoading, setRiskScoreLoading] = useState(true)
  const [feedbackData, setFeedbackData] = useState<{ averageRating: number; totalFeedback: number; topTags: FeedbackTag[] }>({
    averageRating: 0,
    totalFeedback: 0,
    topTags: []
  })
  const [feedbackLoading, setFeedbackLoading] = useState(true)

  // Business widget data states
  const [complaintsData, setComplaintsData] = useState<{
    totalComplaints: number;
    resolutionRate: number;
    trendData: ComplaintTrendData[];
    categories: ComplaintCategory[];
  }>({
    totalComplaints: 0,
    resolutionRate: 0,
    trendData: [],
    categories: []
  })
  const [complaintsLoading, setComplaintsLoading] = useState(true)
  const [courierData, setCourierData] = useState<CourierData[]>([])
  const [courierLoading, setCourierLoading] = useState(true)

  // Enterprise widget data states
  const [predictiveData, setPredictiveData] = useState<{
    forecastedOrders: ForecastDataPoint[];
    forecastedConfirmationRate: number;
    confidence: number;
  }>({
    forecastedOrders: [],
    forecastedConfirmationRate: 0,
    confidence: 0
  })
  const [predictiveLoading, setPredictiveLoading] = useState(true)
  const [recommendationsData, setRecommendationsData] = useState<Recommendation[]>([])
  const [recommendationsLoading, setRecommendationsLoading] = useState(true)

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

  // Fetch Pro widget data - only if user has pro+ plan
  useEffect(() => {
    if (plan === 'starter') {
      setRiskScoreLoading(false)
      setFeedbackLoading(false)
      return
    }

    const fetchProData = async () => {
      try {
        const [riskResponse, feedbackResponse] = await Promise.all([
          api.get('/api/analytics/risk-score-distribution'),
          api.get('/api/analytics/operator-feedback')
        ])
        if (riskResponse.data) setRiskScoreData(riskResponse.data)
        if (feedbackResponse.data) setFeedbackData(feedbackResponse.data)
      } catch (err) {
        console.error('Failed to fetch pro data:', err)
      } finally {
        setRiskScoreLoading(false)
        setFeedbackLoading(false)
      }
    }

    fetchProData()
  }, [plan])

  // Fetch Business widget data - only if user has business+ plan
  useEffect(() => {
    if (plan === 'starter' || plan === 'pro') {
      setComplaintsLoading(false)
      setCourierLoading(false)
      return
    }

    const fetchBusinessData = async () => {
      try {
        const [complaintsResponse, courierResponse] = await Promise.all([
          api.get('/api/analytics/complaints'),
          api.get('/api/analytics/courier-performance')
        ])
        if (complaintsResponse.data) setComplaintsData(complaintsResponse.data)
        if (courierResponse.data) {
          // Handle both array and object response formats
          const couriers = Array.isArray(courierResponse.data) 
            ? courierResponse.data 
            : courierResponse.data.couriers || []
          setCourierData(couriers)
        }
      } catch (err) {
        console.error('Failed to fetch business data:', err)
      } finally {
        setComplaintsLoading(false)
        setCourierLoading(false)
      }
    }

    fetchBusinessData()
  }, [plan])

  // Fetch Enterprise widget data - only if user has enterprise plan
  useEffect(() => {
    if (plan !== 'enterprise') {
      setPredictiveLoading(false)
      setRecommendationsLoading(false)
      return
    }

    const fetchEnterpriseData = async () => {
      try {
        const [predictiveResponse, recommendationsResponse] = await Promise.all([
          api.get('/api/analytics/predictive'),
          api.get('/api/analytics/automation-recommendations')
        ])
        if (predictiveResponse.data) setPredictiveData(predictiveResponse.data)
        if (recommendationsResponse.data) {
          // Handle both array and object response formats
          const recommendations = Array.isArray(recommendationsResponse.data)
            ? recommendationsResponse.data
            : recommendationsResponse.data.recommendations || []
          setRecommendationsData(recommendations)
        }
      } catch (err) {
        console.error('Failed to fetch enterprise data:', err)
      } finally {
        setPredictiveLoading(false)
        setRecommendationsLoading(false)
      }
    }

    fetchEnterpriseData()
  }, [plan])

  // Handle recommendation action click
  const handleRecommendationAction = useCallback(async (recommendation: Recommendation) => {
    // Apply the recommendation based on its type
    try {
      await api.post(`/api/analytics/recommendations/${recommendation.id}/apply`, {
        recommendationId: recommendation.id,
      })
      // Refresh recommendations after applying
      const response = await api.get('/api/analytics/automation-recommendations')
      if (response.data) {
        const recommendations = Array.isArray(response.data)
          ? response.data
          : response.data.recommendations || []
        setRecommendationsData(recommendations)
      }
    } catch {
      // Silently handle error - recommendation may not be applicable
    }
  }, [])

  // Handle "Show me risky orders" click
  const handleShowRiskyOrders = useCallback(() => {
    // Navigate to orders page with filter for risky orders
    window.location.href = '/panel/client/orders?filter=risky'
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
                Monitor your store performance and orders
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
                Try again
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
              title={plan === 'pro' ? "Orders Received Today" : "Orders Received"}
              value={metrics?.ordersReceived ?? 0}
              icon={<ShoppingBagIcon className="w-6 h-6" />}
              isLoading={isLoading}
            />
            
            {/* Orders Confirmed - All Plans */}
            <MetricCard
              title={plan === 'pro' ? "Orders Confirmed Today" : "Orders Confirmed"}
              value={metrics?.ordersConfirmed ?? 0}
              change={metrics?.confirmationRate}
              icon={<CheckCircleIcon className="w-6 h-6" />}
              trend={metrics?.confirmationRate && metrics.confirmationRate > 0 ? 'up' : 'neutral'}
              isLoading={isLoading}
            />
            
            {/* Starter: Orders Pending */}
            {plan === 'starter' && (
              <MetricCard
                title="Orders Pending"
                value={metrics?.ordersPending ?? 0}
                icon={<ClockIcon className="w-6 h-6" />}
                isLoading={isLoading}
              />
            )}
            
            {/* Pro+: Orders Shipped Today */}
            {(plan === 'pro' || plan === 'business' || plan === 'enterprise') && (
              <MetricCard
                title={plan === 'pro' ? "Orders Shipped Today" : "Orders Shipped"}
                value={metrics?.ordersShipped ?? 0}
                icon={<TruckIcon className="w-6 h-6" />}
                isLoading={isLoading}
              />
            )}
            
            {/* Pro+: Delivery Success Rate (last 7 days) */}
            {(plan === 'pro' || plan === 'business' || plan === 'enterprise') && (
              <MetricCard
                title={plan === 'pro' ? "Delivery Success Rate (7d)" : "Delivery Success Rate"}
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
                title="Complaint Rate"
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
                title="Avg Resolution Time"
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
                  <p className="text-sm dark:text-slate-400 light:text-gray-600">Manage your orders</p>
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
                  <p className="text-sm dark:text-slate-400 light:text-gray-600">View your products</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
