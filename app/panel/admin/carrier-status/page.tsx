'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircleIcon,
  ClockIcon,
  PlusIcon,
  TrashIcon,
  TruckIcon
} from '@heroicons/react/24/outline'

import DashboardLayout from '@/components/dashboard/DashboardLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import api from '@/lib/api'


type ConfigStatus =
  | 'draft'
  | 'active'
  | 'archived'

type OrderStatus =
  | 'shipped'
  | 'at_depot'
  | 'out_for_delivery'
  | 'delivered'
  | 'returned'
  | 'cancelled'

type IntigoMatchType =
  | 'exact'
  | 'range'

interface IntigoMapping {
  _id?: string
  matchType: IntigoMatchType
  code?: number
  rangeStart?: number
  rangeEnd?: number
  label?: string
  mappedOrderStatus?: OrderStatus | null
  enabled: boolean
  order?: number
}

interface ColissimoMapping {
  _id?: string
  providerStatus: string
  label?: string
  mappedOrderStatus?: OrderStatus | null
  enabled: boolean
  order?: number
}

interface CarrierStatusConfigSummary {
  _id?: string
  version: number
  status: ConfigStatus
  notes?: string
  clonedFromVersion?: number | null
  activatedAt?: string | null
  createdAt?: string
  updatedAt?: string
}

interface CarrierStatusConfig
  extends CarrierStatusConfigSummary {
  mappings: {
    intigo: IntigoMapping[]
    colissimo: ColissimoMapping[]
  }
}


const ORDER_STATUS_OPTIONS: Array<{
  value: OrderStatus | ''
  label: string
}> = [
  {
    value: '',
    label: 'Ne pas modifier la commande'
  },
  {
    value: 'shipped',
    label: 'Expédiée'
  },
  {
    value: 'at_depot',
    label: 'Dépôt'
  },
  {
    value: 'out_for_delivery',
    label: 'En livraison'
  },
  {
    value: 'delivered',
    label: 'Livrée'
  },
  {
    value: 'returned',
    label: 'Retournée'
  },
  {
    value: 'cancelled',
    label: 'Annulée'
  }
]


const normalizeConfig = (
  value: unknown
): CarrierStatusConfig | null => {
  if (
    !value ||
    typeof value !== 'object'
  ) {
    return null
  }

  const config =
    value as Partial<CarrierStatusConfig>

  if (
    typeof config.version !== 'number' ||
    !config.status
  ) {
    return null
  }

  return {
    ...config,
    version:
      config.version,
    status:
      config.status,
    mappings: {
      intigo:
        Array.isArray(
          config.mappings?.intigo
        )
          ? config.mappings.intigo
          : [],

      colissimo:
        Array.isArray(
          config.mappings?.colissimo
        )
          ? config.mappings.colissimo
          : []
    }
  } as CarrierStatusConfig
}


export default function CarrierStatusPage() {
  const [activeConfig, setActiveConfig] =
    useState<CarrierStatusConfig | null>(null)

  const [configs, setConfigs] =
    useState<CarrierStatusConfigSummary[]>([])

  const [draftConfig, setDraftConfig] =
    useState<CarrierStatusConfig | null>(null)

  const [intigoDraft, setIntigoDraft] =
    useState<IntigoMapping[]>([])

  const [colissimoDraft, setColissimoDraft] =
    useState<ColissimoMapping[]>([])

  const [notesDraft, setNotesDraft] =
    useState('')

  const [loading, setLoading] =
    useState(true)

  const [draftLoading, setDraftLoading] =
    useState(false)

  const [saving, setSaving] =
    useState(false)

  const [initializing, setInitializing] =
    useState(false)

  const [activating, setActivating] =
    useState(false)

  const [
    activationModalOpen,
    setActivationModalOpen
  ] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  const [actionMessage, setActionMessage] =
    useState<string | null>(null)


  const hasResolvedRetourDepotMapping =
    useMemo(
      () =>
        colissimoDraft.some(mapping => {
          const normalized =
            String(
              mapping.providerStatus || ''
            )
              .normalize('NFD')
              .replace(
                /[\u0300-\u036f]/g,
                ''
              )
              .trim()
              .toLowerCase()

          return (
            mapping.enabled !== false &&
            normalized === 'retour depot' &&
            Boolean(
              mapping.mappedOrderStatus
            )
          )
        }),
      [colissimoDraft]
    )


  const latestDraft =
    useMemo(
      () =>
        [...configs]
          .filter(
            config =>
              config.status === 'draft'
          )
          .sort(
            (a, b) =>
              b.version - a.version
          )[0] ?? null,
      [configs]
    )


  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        setLoading(true)
        setError(null)

        const [
          activeResponse,
          configsResponse
        ] = await Promise.all([
          api.get(
            '/api/admin/carrier-status/active'
          ),

          api.get(
            '/api/admin/carrier-status/configs'
          )
        ])

        setActiveConfig(
          normalizeConfig(
            activeResponse.data?.config
          )
        )

        setConfigs(
          Array.isArray(
            configsResponse.data?.configs
          )
            ? configsResponse.data.configs
            : []
        )
      } catch (requestError) {
        console.error(
          'Failed to load carrier status configuration:',
          requestError
        )

        setError(
          'Impossible de charger la configuration des transporteurs.'
        )
      } finally {
        setLoading(false)
      }
    }

    void fetchConfigs()
  }, [])


  useEffect(() => {
    const fetchDraft = async () => {
      if (!latestDraft) {
        setDraftConfig(null)
        setIntigoDraft([])
        setColissimoDraft([])
        setNotesDraft('')
        return
      }

      try {
        setDraftLoading(true)
        setError(null)

        const response =
          await api.get(
            `/api/admin/carrier-status/configs/${latestDraft.version}`
          )

        const config =
          normalizeConfig(
            response.data?.config
          )

        if (
          !config ||
          config.status !== 'draft'
        ) {
          throw new Error(
            'Invalid carrier status draft response'
          )
        }

        setDraftConfig(config)

        setIntigoDraft(
          config.mappings.intigo.map(
            mapping => ({
              ...mapping
            })
          )
        )

        setColissimoDraft(
          config.mappings.colissimo.map(
            mapping => ({
              ...mapping
            })
          )
        )

        setNotesDraft(
          config.notes || ''
        )
      } catch (requestError) {
        console.error(
          'Failed to load carrier status draft:',
          requestError
        )

        setError(
          'Impossible de charger le brouillon du mapping.'
        )
      } finally {
        setDraftLoading(false)
      }
    }

    void fetchDraft()
  }, [latestDraft])


  const handleInitialize = async () => {
    try {
      setInitializing(true)
      setError(null)
      setActionMessage(null)

      const response =
        await api.post(
          '/api/admin/carrier-status/initialize',
          {}
        )

      const created =
        normalizeConfig(
          response.data?.config
        )

      if (!created) {
        throw new Error(
          'Invalid initial carrier status configuration response'
        )
      }

      setConfigs(previous => [
        created,
        ...previous.filter(
          item =>
            item.version !==
            created.version
        )
      ])

      setActionMessage(
        `Brouillon V${created.version} créé. Aucun mapping n’est encore actif en production.`
      )
    } catch (requestError: unknown) {
      console.error(
        'Failed to initialize carrier status configuration:',
        requestError
      )

      const responseData =
        typeof requestError === 'object' &&
        requestError !== null &&
        'response' in requestError
          ? (
              requestError as {
                response?: {
                  data?: {
                    details?: unknown
                    error?: unknown
                  }
                }
              }
            ).response?.data
          : undefined

      const details =
        responseData?.details

      const apiError =
        typeof responseData?.error === 'string'
          ? responseData.error
          : null

      setError(
        Array.isArray(details) &&
        details.length > 0
          ? details
              .map(item => String(item))
              .join(' • ')
          : apiError ||
            'Impossible de créer la configuration initiale.'
      )
    } finally {
      setInitializing(false)
    }
  }


  const handleSaveDraft = async () => {
    if (!draftConfig) {
      return
    }

    try {
      setSaving(true)
      setError(null)
      setActionMessage(null)

      const response =
        await api.put(
          `/api/admin/carrier-status/configs/${draftConfig.version}`,
          {
            mappings: {
              intigo:
                intigoDraft.map(
                  (mapping, index) => ({
                    ...mapping,
                    order:
                      index
                  })
                ),

              colissimo:
                colissimoDraft.map(
                  (mapping, index) => ({
                    ...mapping,
                    order:
                      index
                  })
                )
            },

            notes:
              notesDraft
          }
        )

      const saved =
        normalizeConfig(
          response.data?.config
        )

      if (!saved) {
        throw new Error(
          'Invalid saved carrier status configuration response'
        )
      }

      setDraftConfig(saved)

      setActionMessage(
        `Brouillon V${saved.version} enregistré.`
      )
    } catch (requestError: unknown) {
      console.error(
        'Failed to save carrier status draft:',
        requestError
      )

      const responseData =
        typeof requestError === 'object' &&
        requestError !== null &&
        'response' in requestError
          ? (
              requestError as {
                response?: {
                  data?: {
                    details?: unknown
                    error?: unknown
                  }
                }
              }
            ).response?.data
          : undefined

      const details =
        responseData?.details

      const apiError =
        typeof responseData?.error === 'string'
          ? responseData.error
          : null

      setError(
        Array.isArray(details) &&
        details.length > 0
          ? details
              .map(item => String(item))
              .join(' • ')
          : apiError ||
            'Impossible d’enregistrer le brouillon.'
      )
    } finally {
      setSaving(false)
    }
  }


  const handleActivateDraft = async () => {
    if (!draftConfig) {
      return
    }

    if (!hasResolvedRetourDepotMapping) {
      setError(
        'Colissimo "Retour dépôt" doit être associé à un statut CONFIRMED avant activation.'
      )

      setActivationModalOpen(false)
      return
    }

    try {
      setActivating(true)
      setError(null)
      setActionMessage(null)

      /*
       * On sauvegarde d'abord l'état actuel de
       * l'éditeur afin de ne jamais activer une
       * ancienne version du brouillon.
       */
      const saveResponse =
        await api.put(
          `/api/admin/carrier-status/configs/${draftConfig.version}`,
          {
            mappings: {
              intigo:
                intigoDraft.map(
                  (mapping, index) => ({
                    ...mapping,
                    order:
                      index
                  })
                ),

              colissimo:
                colissimoDraft.map(
                  (mapping, index) => ({
                    ...mapping,
                    order:
                      index
                  })
                )
            },

            notes:
              notesDraft
          }
        )

      const saved =
        normalizeConfig(
          saveResponse.data?.config
        )

      if (!saved) {
        throw new Error(
          'Invalid saved carrier status configuration response'
        )
      }

      const activateResponse =
        await api.post(
          `/api/admin/carrier-status/configs/${saved.version}/activate`,
          {}
        )

      const activated =
        normalizeConfig(
          activateResponse.data?.config
        )

      if (!activated) {
        throw new Error(
          'Invalid activated carrier status configuration response'
        )
      }

      setActiveConfig(
        activated
      )

      setConfigs(previous =>
        previous.map(config => {
          if (
            config.version ===
            activated.version
          ) {
            return {
              ...config,
              status:
                'active',
              activatedAt:
                activated.activatedAt
            }
          }

          if (
            config.status ===
            'active'
          ) {
            return {
              ...config,
              status:
                'archived'
            }
          }

          return config
        })
      )

      setDraftConfig(null)
      setIntigoDraft([])
      setColissimoDraft([])
      setNotesDraft('')

      setActivationModalOpen(false)

      setActionMessage(
        `Version V${activated.version} activée.`
      )
    } catch (requestError: unknown) {
      console.error(
        'Failed to activate carrier status configuration:',
        requestError
      )

      const responseData =
        typeof requestError === 'object' &&
        requestError !== null &&
        'response' in requestError
          ? (
              requestError as {
                response?: {
                  data?: {
                    details?: unknown
                    error?: unknown
                  }
                }
              }
            ).response?.data
          : undefined

      const details =
        responseData?.details

      const apiError =
        typeof responseData?.error === 'string'
          ? responseData.error
          : null

      setError(
        Array.isArray(details) &&
        details.length > 0
          ? details
              .map(item => String(item))
              .join(' • ')
          : apiError ||
            'Impossible d’activer cette version.'
      )

      setActivationModalOpen(false)
    } finally {
      setActivating(false)
    }
  }


  const addIntigoRule = () => {
    setIntigoDraft(previous => [
      ...previous,
      {
        matchType: 'exact',
        code: 0,
        label: '',
        mappedOrderStatus: null,
        enabled: true,
        order: previous.length
      }
    ])
  }


  const addColissimoRule = () => {
    setColissimoDraft(previous => [
      ...previous,
      {
        providerStatus: '',
        label: '',
        mappedOrderStatus: null,
        enabled: true,
        order: previous.length
      }
    ])
  }


  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['admin']}>
        <DashboardLayout userRole="admin">
          <div className="space-y-6">
            <div className="h-20 animate-pulse rounded-xl dark:bg-slate-800 light:bg-gray-100" />

            <div className="grid gap-4 md:grid-cols-2">
              {[0, 1].map(item => (
                <div
                  key={item}
                  className="h-44 animate-pulse rounded-xl dark:bg-slate-800 light:bg-gray-100"
                />
              ))}
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }


  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout userRole="admin">
        <div className="space-y-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">
                Mapping transporteurs
              </h1>

              <p className="mt-1 text-sm dark:text-slate-400 light:text-gray-600">
                Configuration centrale des correspondances entre les
                statuts Intigo / Colissimo et les statuts CONFIRMED.
              </p>
            </div>

            {activeConfig && (
              <div className="flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1.5 text-sm font-medium text-green-500">
                <CheckCircleIcon className="h-4 w-4" />
                V{activeConfig.version} Active
              </div>
            )}
          </div>


          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-500">
              {error}
            </div>
          )}

          {actionMessage && (
            <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-500">
              {actionMessage}
            </div>
          )}


          {!activeConfig && (
            <div className="rounded-2xl border p-6 dark:border-slate-700 dark:bg-slate-900 light:border-gray-200 light:bg-white">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                  <TruckIcon className="h-6 w-6" />
                </div>

                <div>
                  <h2 className="text-lg font-semibold">
                    Aucune configuration active
                  </h2>

                  <p className="mt-1 max-w-2xl text-sm leading-6 dark:text-slate-400 light:text-gray-600">
                    Le tracking actuel continue à utiliser les mappings
                    présents directement dans les services transporteurs.
                  </p>
                </div>
              </div>
            </div>
          )}


          {latestDraft && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
              <div className="flex items-start gap-3">
                <ClockIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />

                <div>
                  <p className="font-medium">
                    V{latestDraft.version} — Brouillon
                  </p>

                  <p className="mt-1 text-sm text-amber-500">
                    Non utilisée en production tant qu’elle n’est pas activée.
                  </p>
                </div>
              </div>
            </div>
          )}


          {!latestDraft && (
            <div className="rounded-2xl border border-dashed p-6 text-center dark:border-slate-700 light:border-gray-300">
              <p className="font-medium">
                Aucun brouillon disponible
              </p>

              <p className="mx-auto mt-1 max-w-2xl text-sm leading-6 dark:text-slate-400 light:text-gray-600">
                Créez la première version à partir des mappings
                actuellement connus pour Intigo et Colissimo.
                Elle restera en brouillon et ne modifiera pas
                le tracking en production.
              </p>

              <button
                type="button"
                disabled={
                  initializing ||
                  configs.length > 0
                }
                onClick={() =>
                  void handleInitialize()
                }
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <PlusIcon className="h-5 w-5" />

                {initializing
                  ? 'Création de V1...'
                  : 'Créer la configuration initiale'}
              </button>
            </div>
          )}


          {draftLoading && (
            <div className="h-56 animate-pulse rounded-2xl dark:bg-slate-800 light:bg-gray-100" />
          )}


          {draftConfig && !draftLoading && (
            <>
              {/* INTIGO */}
              <section className="rounded-2xl border p-5 dark:border-slate-700 dark:bg-slate-900 light:border-gray-200 light:bg-white">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">
                      Intigo
                    </h2>

                    <p className="mt-1 text-sm dark:text-slate-400 light:text-gray-600">
                      Codes ou plages API vers statuts CONFIRMED.
                    </p>

                    <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
                      <div className="rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950/50 light:border-gray-200 light:bg-gray-50">
                        <div className="font-semibold">
                          🔒 1. Code / plage API
                        </div>
                        <div className="mt-1 dark:text-slate-400 light:text-gray-500">
                          Technique — à ne pas modifier normalement.
                        </div>
                      </div>

                      <div className="rounded-lg border px-3 py-2 dark:border-slate-700 light:border-gray-200">
                        <div className="font-semibold">
                          2. Libellé Admin
                        </div>
                        <div className="mt-1 dark:text-slate-400 light:text-gray-500">
                          Description uniquement, sans impact métier.
                        </div>
                      </div>

                      <div className="rounded-lg border border-blue-500/40 bg-blue-500/10 px-3 py-2">
                        <div className="font-semibold text-blue-500">
                          3. Statut CONFIRMED
                        </div>
                        <div className="mt-1 dark:text-slate-300 light:text-gray-600">
                          À modifier pour changer le statut de la commande.
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={addIntigoRule}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition dark:border-slate-600 dark:hover:bg-slate-800 light:border-gray-300 light:hover:bg-gray-100"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Ajouter une règle
                  </button>
                </div>

                <div className="mt-5 space-y-3">
                  {intigoDraft.map(
                    (mapping, index) => (
                      <div
                        key={
                          mapping._id ||
                          `intigo-${index}`
                        }
                        className="grid gap-3 rounded-xl border p-4 lg:grid-cols-[140px_1fr_1fr_220px_auto] dark:border-slate-700 light:border-gray-200"
                      >
                        <select
                          value={mapping.matchType}
                          onChange={event => {
                            const value =
                              event.target.value as IntigoMatchType

                            setIntigoDraft(previous =>
                              previous.map(
                                (item, itemIndex) =>
                                  itemIndex === index
                                    ? {
                                        ...item,
                                        matchType: value,
                                        code:
                                          value === 'exact'
                                            ? item.code ?? 0
                                            : undefined,
                                        rangeStart:
                                          value === 'range'
                                            ? item.rangeStart ?? 0
                                            : undefined,
                                        rangeEnd:
                                          value === 'range'
                                            ? item.rangeEnd ?? 0
                                            : undefined
                                      }
                                    : item
                              )
                            )
                          }}
                          className="rounded-lg border px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 light:border-gray-300 light:bg-white"
                        >
                          <option value="exact">
                            Code exact
                          </option>
                          <option value="range">
                            Plage
                          </option>
                        </select>

                        {mapping.matchType === 'exact' ? (
                          <input
                            type="number"
                            value={mapping.code ?? 0}
                            onChange={event => {
                              const value =
                                Number(
                                  event.target.value
                                )

                              setIntigoDraft(previous =>
                                previous.map(
                                  (item, itemIndex) =>
                                    itemIndex === index
                                      ? {
                                          ...item,
                                          code: value
                                        }
                                      : item
                                )
                              )
                            }}
                            className="rounded-lg border px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 light:border-gray-300 light:bg-white"
                            placeholder="5000"
                          />
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="number"
                              value={
                                mapping.rangeStart ??
                                0
                              }
                              onChange={event => {
                                const value =
                                  Number(
                                    event.target.value
                                  )

                                setIntigoDraft(previous =>
                                  previous.map(
                                    (item, itemIndex) =>
                                      itemIndex === index
                                        ? {
                                            ...item,
                                            rangeStart:
                                              value
                                          }
                                        : item
                                  )
                                )
                              }}
                              className="rounded-lg border px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 light:border-gray-300 light:bg-white"
                              placeholder="1000"
                            />

                            <input
                              type="number"
                              value={
                                mapping.rangeEnd ??
                                0
                              }
                              onChange={event => {
                                const value =
                                  Number(
                                    event.target.value
                                  )

                                setIntigoDraft(previous =>
                                  previous.map(
                                    (item, itemIndex) =>
                                      itemIndex === index
                                        ? {
                                            ...item,
                                            rangeEnd:
                                              value
                                          }
                                        : item
                                  )
                                )
                              }}
                              className="rounded-lg border px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 light:border-gray-300 light:bg-white"
                              placeholder="1008"
                            />
                          </div>
                        )}

                        <input
                          type="text"
                          aria-label="Libellé Admin Intigo"
                          value={mapping.label || ''}
                          onChange={event => {
                            const value =
                              event.target.value

                            setIntigoDraft(previous =>
                              previous.map(
                                (item, itemIndex) =>
                                  itemIndex === index
                                    ? {
                                        ...item,
                                        label: value
                                      }
                                    : item
                              )
                            )
                          }}
                          className="rounded-lg border px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 light:border-gray-300 light:bg-white"
                          placeholder="Libellé"
                        />

                        <select
                          value={
                            mapping.mappedOrderStatus ||
                            ''
                          }
                          onChange={event => {
                            const value =
                              event.target.value as
                                | OrderStatus
                                | ''

                            setIntigoDraft(previous =>
                              previous.map(
                                (item, itemIndex) =>
                                  itemIndex === index
                                    ? {
                                        ...item,
                                        mappedOrderStatus:
                                          value || null
                                      }
                                    : item
                              )
                            )
                          }}
                          className="rounded-lg border px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 light:border-gray-300 light:bg-white"
                        >
                          {ORDER_STATUS_OPTIONS.map(
                            option => (
                              <option
                                key={
                                  option.value ||
                                  'none'
                                }
                                value={option.value}
                              >
                                {option.label}
                              </option>
                            )
                          )}
                        </select>

                        <button
                          type="button"
                          aria-label="Supprimer la règle Intigo"
                          onClick={() =>
                            setIntigoDraft(previous =>
                              previous.filter(
                                (_, itemIndex) =>
                                  itemIndex !== index
                              )
                            )
                          }
                          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-500/10"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    )
                  )}
                </div>
              </section>


              {/* COLISSIMO */}
              <section className="rounded-2xl border p-5 dark:border-slate-700 dark:bg-slate-900 light:border-gray-200 light:bg-white">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">
                      Colissimo
                    </h2>

                    <p className="mt-1 text-sm dark:text-slate-400 light:text-gray-600">
                      États API vers statuts CONFIRMED.
                    </p>

                    <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
                      <div className="rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950/50 light:border-gray-200 light:bg-gray-50">
                        <div className="font-semibold">
                          🔒 1. Statut API Colissimo
                        </div>
                        <div className="mt-1 dark:text-slate-400 light:text-gray-500">
                          Valeur technique reçue du transporteur.
                        </div>
                      </div>

                      <div className="rounded-lg border px-3 py-2 dark:border-slate-700 light:border-gray-200">
                        <div className="font-semibold">
                          2. Libellé Admin
                        </div>
                        <div className="mt-1 dark:text-slate-400 light:text-gray-500">
                          Description uniquement, sans impact métier.
                        </div>
                      </div>

                      <div className="rounded-lg border border-blue-500/40 bg-blue-500/10 px-3 py-2">
                        <div className="font-semibold text-blue-500">
                          3. Statut CONFIRMED
                        </div>
                        <div className="mt-1 dark:text-slate-300 light:text-gray-600">
                          À modifier pour changer le statut de la commande.
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={addColissimoRule}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition dark:border-slate-600 dark:hover:bg-slate-800 light:border-gray-300 light:hover:bg-gray-100"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Ajouter une règle
                  </button>
                </div>

                <div className="mt-5 space-y-3">
                  {colissimoDraft.map(
                    (mapping, index) => (
                      <div
                        key={
                          mapping._id ||
                          `colissimo-${index}`
                        }
                        className="grid gap-3 rounded-xl border p-4 lg:grid-cols-[1fr_1fr_220px_auto] dark:border-slate-700 light:border-gray-200"
                      >
                        <input
                          type="text"
                          value={
                            mapping.providerStatus
                          }
                          readOnly={Boolean(mapping._id)}
                          aria-label="Statut API Colissimo"
                          title={
                            mapping._id
                              ? 'Valeur technique Colissimo — créez une nouvelle règle pour utiliser un autre statut API.'
                              : 'Saisissez le statut exact retourné par Colissimo.'
                          }
                          onChange={event => {
                            const value =
                              event.target.value

                            setColissimoDraft(previous =>
                              previous.map(
                                (item, itemIndex) =>
                                  itemIndex === index
                                    ? {
                                        ...item,
                                        providerStatus:
                                          value
                                      }
                                    : item
                              )
                            )
                          }}
                          className="rounded-lg border px-3 py-2 text-sm read-only:cursor-not-allowed read-only:opacity-70 dark:border-slate-600 dark:bg-slate-800 light:border-gray-300 light:bg-white"
                          placeholder="Statut Colissimo"
                        />

                        <input
                          type="text"
                          aria-label="Libellé Admin Colissimo"
                          value={mapping.label || ''}
                          onChange={event => {
                            const value =
                              event.target.value

                            setColissimoDraft(previous =>
                              previous.map(
                                (item, itemIndex) =>
                                  itemIndex === index
                                    ? {
                                        ...item,
                                        label: value
                                      }
                                    : item
                              )
                            )
                          }}
                          className="rounded-lg border px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 light:border-gray-300 light:bg-white"
                          placeholder="Libellé"
                        />

                        <select
                          aria-label="Statut CONFIRMED Colissimo"
                          title="Ce champ détermine le statut métier appliqué à la commande."
                          value={
                            mapping.mappedOrderStatus ||
                            ''
                          }
                          onChange={event => {
                            const value =
                              event.target.value as
                                | OrderStatus
                                | ''

                            setColissimoDraft(previous =>
                              previous.map(
                                (item, itemIndex) =>
                                  itemIndex === index
                                    ? {
                                        ...item,
                                        mappedOrderStatus:
                                          value || null
                                      }
                                    : item
                              )
                            )
                          }}
                          className="rounded-lg border px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 light:border-gray-300 light:bg-white"
                        >
                          {ORDER_STATUS_OPTIONS.map(
                            option => (
                              <option
                                key={
                                  option.value ||
                                  'none'
                                }
                                value={option.value}
                              >
                                {option.label}
                              </option>
                            )
                          )}
                        </select>

                        <button
                          type="button"
                          aria-label="Supprimer la règle Colissimo"
                          onClick={() =>
                            setColissimoDraft(previous =>
                              previous.filter(
                                (_, itemIndex) =>
                                  itemIndex !== index
                              )
                            )
                          }
                          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-500/10"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    )
                  )}
                </div>
              </section>


              <section className="rounded-2xl border p-5 dark:border-slate-700 dark:bg-slate-900 light:border-gray-200 light:bg-white">
                <label
                  htmlFor="carrier-status-notes"
                  className="text-sm font-medium"
                >
                  Notes de version
                </label>

                <textarea
                  id="carrier-status-notes"
                  value={notesDraft}
                  onChange={event =>
                    setNotesDraft(
                      event.target.value
                    )
                  }
                  rows={3}
                  className="mt-2 block w-full rounded-xl border px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 light:border-gray-300 light:bg-white"
                  placeholder="Décrire les changements de cette version..."
                />

                {!hasResolvedRetourDepotMapping && (
                  <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-500">
                    Activation bloquée : la règle Colissimo
                    « Retour dépôt » doit d’abord être associée
                    explicitement à un statut CONFIRMED.
                  </div>
                )}

                <div className="mt-4 flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    disabled={
                      saving ||
                      activating
                    }
                    onClick={() =>
                      void handleSaveDraft()
                    }
                    className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? 'Enregistrement...'
                      : `Enregistrer V${draftConfig.version}`}
                  </button>

                  <button
                    type="button"
                    disabled={
                      saving ||
                      activating ||
                      !hasResolvedRetourDepotMapping
                    }
                    onClick={() =>
                      setActivationModalOpen(true)
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CheckCircleIcon className="h-5 w-5" />

                    {activating
                      ? 'Activation...'
                      : `Activer V${draftConfig.version}`}
                  </button>
                </div>
              </section>
            </>
          )}

        </div>

        {activationModalOpen && draftConfig && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="carrier-status-activation-title"
          >
            <div className="w-full max-w-lg rounded-2xl border border-green-500/30 dark:bg-slate-900 light:bg-white p-6 shadow-2xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircleIcon className="h-7 w-7 text-green-500" />
              </div>

              <h2
                id="carrier-status-activation-title"
                className="mt-4 text-xl font-semibold"
              >
                Activer V{draftConfig.version} ?
              </h2>

              <p className="mt-2 text-sm leading-6 dark:text-slate-400 light:text-gray-600">
                Cette version deviendra la configuration active
                des mappings transporteurs. L’ancienne version
                active sera archivée automatiquement.
              </p>

              <div className="mt-4 rounded-xl bg-green-500/10 p-4 text-sm text-green-500">
                Les modifications actuelles seront enregistrées
                avant l’activation.
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={activating}
                  onClick={() =>
                    setActivationModalOpen(false)
                  }
                  className="rounded-lg border px-5 py-2.5 text-sm font-semibold transition dark:border-slate-600 dark:hover:bg-slate-800 light:border-gray-300 light:hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Annuler
                </button>

                <button
                  type="button"
                  disabled={
                    activating ||
                    !hasResolvedRetourDepotMapping
                  }
                  onClick={() =>
                    void handleActivateDraft()
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CheckCircleIcon className="h-5 w-5" />

                  {activating
                    ? 'Activation...'
                    : `Confirmer l’activation de V${draftConfig.version}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}
