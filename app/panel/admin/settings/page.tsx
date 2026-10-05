'use client'

import { useState, useEffect } from 'react'
import {
  ServerIcon,
  CreditCardIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useLanguage } from '@/hooks/useLanguage'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import BillingSettings from '@/components/wallet/BillingSettings'

interface ServiceStatus {
  status?: string;
  latency?: number;
}

interface HealthData {
  status?: string;
  services?: {
    mongodb?: ServiceStatus;
    redis?: ServiceStatus;
    websocket?: ServiceStatus;
    queue?: ServiceStatus;
  };
  uptime?: number;
  version?: string;
  systemMetrics?: {
    memoryUsage?: number;
    cpuUsage?: number;
    activeConnections?: number;
    memory?: {
      percentage?: number;
    };
    cpu?: {
      usage?: number;
    };
    disk?: {
      percentage?: number;
    };
  };
}

interface PlanData {
  id?: string;
  name?: string;
  price?: number;
  features?: {
    maxOperators?: number;
    maxShops?: number;
    maxOrders?: number;
    maxAICalls?: number;
    [key: string]: number | undefined;
  };
  limits?: Record<string, number>;
}

interface OperatorActivityConfig {
  activeThresholdMinutes: number;
  inactiveThresholdMinutes: number;
  offlineThresholdSeconds: number;
}

export default function SystemSettings() {
  const { t } = useLanguage()
  const [health, setHealth] = useState<HealthData | null>(null)
  const [plans, setPlans] = useState<PlanData[]>([])

  const [
    operatorActivityConfig,
    setOperatorActivityConfig
  ] = useState<OperatorActivityConfig>({
    activeThresholdMinutes: 5,
    inactiveThresholdMinutes: 15,
    offlineThresholdSeconds: 120
  })

  const [
    savingOperatorConfig,
    setSavingOperatorConfig
  ] = useState(false)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          healthRes,
          plansRes,
          operatorConfigRes
        ] = await Promise.all([
          api.get('/health/detailed'),
          api.get('/api/subscriptions/plans'),
          api.get(
            '/api/admin/operator-activity-config'
          )
        ])

        setHealth(healthRes.data)
        setPlans(plansRes.data)

        if (operatorConfigRes.data?.config) {
          setOperatorActivityConfig({
            activeThresholdMinutes:
              operatorConfigRes.data.config
                .activeThresholdMinutes,

            inactiveThresholdMinutes:
              operatorConfigRes.data.config
                .inactiveThresholdMinutes,

            offlineThresholdSeconds:
              operatorConfigRes.data.config
                .offlineThresholdSeconds
          })
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const saveOperatorActivityConfig =
    async () => {
      const {
        activeThresholdMinutes,
        inactiveThresholdMinutes,
        offlineThresholdSeconds
      } = operatorActivityConfig

      if (
        activeThresholdMinutes < 1 ||
        activeThresholdMinutes > 120
      ) {
        toast.error(
          'Le seuil Actif doit être compris entre 1 et 120 minutes'
        )
        return
      }

      if (
        inactiveThresholdMinutes < 2 ||
        inactiveThresholdMinutes > 480
      ) {
        toast.error(
          'Le seuil Inactif doit être compris entre 2 et 480 minutes'
        )
        return
      }

      if (
        inactiveThresholdMinutes <=
        activeThresholdMinutes
      ) {
        toast.error(
          'Le seuil Inactif doit être supérieur au seuil Actif'
        )
        return
      }

      if (
        offlineThresholdSeconds < 60 ||
        offlineThresholdSeconds > 3600
      ) {
        toast.error(
          'Le seuil Hors ligne doit être compris entre 60 et 3600 secondes'
        )
        return
      }

      setSavingOperatorConfig(true)

      try {
        const response =
          await api.patch(
            '/api/admin/operator-activity-config',
            operatorActivityConfig
          )

        if (response.data?.config) {
          setOperatorActivityConfig({
            activeThresholdMinutes:
              response.data.config
                .activeThresholdMinutes,

            inactiveThresholdMinutes:
              response.data.config
                .inactiveThresholdMinutes,

            offlineThresholdSeconds:
              response.data.config
                .offlineThresholdSeconds
          })
        }

        toast.success(
          'Seuils opérateurs enregistrés'
        )
      } catch (error) {
        console.error(
          'Failed to save operator activity config:',
          error
        )

        toast.error(
          'Impossible d’enregistrer les seuils opérateurs'
        )
      } finally {
        setSavingOperatorConfig(false)
      }
    }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['admin']}>
        <DashboardLayout userRole="admin">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 rounded-lg dark:bg-slate-800 light:bg-gray-100" />
            ))}
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout userRole="admin">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">{t('page.systemSettings')}</h1>
            <p className="text-sm dark:text-slate-400 light:text-gray-600 mt-1">{t('page.systemSettingsDesc')}</p>
          </div>

          <BillingSettings />

          {health && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ServerIcon className="h-5 w-5" />
                {t('section.systemHealth')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg dark:bg-slate-800 light:bg-gray-50">
                  <p className="text-sm dark:text-slate-400 light:text-gray-600 mb-1">MongoDB</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      health.services?.mongodb?.status === 'connected' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="font-medium">{health.services?.mongodb?.status || 'Unknown'}</span>
                  </div>
                </div>

                <div className="p-4 rounded-lg dark:bg-slate-800 light:bg-gray-50">
                  <p className="text-sm dark:text-slate-400 light:text-gray-600 mb-1">Redis</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      health.services?.redis?.status === 'connected' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="font-medium">{health.services?.redis?.status || 'Unknown'}</span>
                  </div>
                </div>

                <div className="p-4 rounded-lg dark:bg-slate-800 light:bg-gray-50">
                  <p className="text-sm dark:text-slate-400 light:text-gray-600 mb-1">Queue</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      health.services?.queue?.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="font-medium">{health.services?.queue?.status || 'Unknown'}</span>
                  </div>
                </div>
              </div>

              {health.systemMetrics && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm dark:text-slate-400 light:text-gray-600">{t('label.memoryUsage')}</p>
                    <p className="text-lg font-semibold">{health.systemMetrics.memory?.percentage?.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm dark:text-slate-400 light:text-gray-600">{t('label.cpuUsage')}</p>
                    <p className="text-lg font-semibold">{health.systemMetrics.cpu?.usage?.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm dark:text-slate-400 light:text-gray-600">{t('label.diskUsage')}</p>
                    <p className="text-lg font-semibold">{health.systemMetrics.disk?.percentage?.toFixed(1)}%</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="card p-6">
            <div className="flex flex-col gap-1 mb-5">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <AdjustmentsHorizontalIcon className="h-5 w-5" />
                Présence et activité des opérateurs
              </h2>

              <p className="text-sm dark:text-slate-400 light:text-gray-600">
                Configure les délais utilisés par l’administration pour distinguer un opérateur actif, disponible, inactif ou hors ligne.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Actif après une action
                </label>

                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={
                      operatorActivityConfig
                        .activeThresholdMinutes
                    }
                    onChange={event =>
                      setOperatorActivityConfig(
                        previous => ({
                          ...previous,
                          activeThresholdMinutes:
                            Number(
                              event.target.value
                            )
                        })
                      )
                    }
                    className="w-full rounded-lg border px-3 py-2 pr-20 bg-transparent dark:border-slate-700 light:border-gray-300"
                  />

                  <span className="absolute right-3 top-2.5 text-sm text-slate-500">
                    minutes
                  </span>
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Une action métier récente affiche l’opérateur comme Actif.
                </p>
              </div>


              <div>
                <label className="block text-sm font-medium mb-2">
                  Passage en Inactif
                </label>

                <div className="relative">
                  <input
                    type="number"
                    min={2}
                    max={480}
                    value={
                      operatorActivityConfig
                        .inactiveThresholdMinutes
                    }
                    onChange={event =>
                      setOperatorActivityConfig(
                        previous => ({
                          ...previous,
                          inactiveThresholdMinutes:
                            Number(
                              event.target.value
                            )
                        })
                      )
                    }
                    className="w-full rounded-lg border px-3 py-2 pr-20 bg-transparent dark:border-slate-700 light:border-gray-300"
                  />

                  <span className="absolute right-3 top-2.5 text-sm text-slate-500">
                    minutes
                  </span>
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  La session reste connectée, mais aucune action métier n’a été détectée.
                </p>
              </div>


              <div>
                <label className="block text-sm font-medium mb-2">
                  Passage Hors ligne
                </label>

                <div className="relative">
                  <input
                    type="number"
                    min={60}
                    max={3600}
                    value={
                      operatorActivityConfig
                        .offlineThresholdSeconds
                    }
                    onChange={event =>
                      setOperatorActivityConfig(
                        previous => ({
                          ...previous,
                          offlineThresholdSeconds:
                            Number(
                              event.target.value
                            )
                        })
                      )
                    }
                    className="w-full rounded-lg border px-3 py-2 pr-20 bg-transparent dark:border-slate-700 light:border-gray-300"
                  />

                  <span className="absolute right-3 top-2.5 text-sm text-slate-500">
                    secondes
                  </span>
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Sans heartbeat récent, la session est considérée hors ligne.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4 dark:border-slate-700 light:border-gray-200">
              <p className="text-xs text-slate-500">
                Valeurs par défaut : Actif 5 min · Inactif 15 min · Hors ligne 120 s
              </p>

              <button
                type="button"
                onClick={
                  saveOperatorActivityConfig
                }
                disabled={savingOperatorConfig}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {savingOperatorConfig
                  ? 'Enregistrement...'
                  : 'Enregistrer les seuils'}
              </button>
            </div>
          </div>


          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CreditCardIcon className="h-5 w-5" />
              {t('section.subscriptionPlans')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <div key={plan.id} className="p-4 rounded-lg border dark:border-slate-700 light:border-gray-200">
                  <h3 className="font-semibold text-lg mb-2">{plan.name}</h3>
                  <p className="text-2xl font-bold mb-4">
                    ${plan.price}
                    <span className="text-sm font-normal dark:text-slate-400 light:text-gray-600">/month</span>
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="dark:text-slate-400 light:text-gray-600">{t('label.operators')}</span>
                      <span className="font-medium">{plan.features?.maxOperators === -1 ? t('label.unlimited') : plan.features?.maxOperators}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="dark:text-slate-400 light:text-gray-600">{t('label.aiCalls')}</span>
                      <span className="font-medium">{plan.features?.maxAICalls === -1 ? t('label.unlimited') : plan.features?.maxAICalls}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="dark:text-slate-400 light:text-gray-600">{t('label.shops')}</span>
                      <span className="font-medium">{plan.features?.maxShops === -1 ? t('label.unlimited') : plan.features?.maxShops}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
