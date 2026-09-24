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

  const [error, setError] =
    useState<string | null>(null)

  const [actionMessage, setActionMessage] =
    useState<string | null>(null)


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

              <p className="mt-1 text-sm dark:text-slate-400 light:text-gray-600">
                L’éditeur apparaîtra ici dès que la première version
                de configuration sera créée.
              </p>
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
                          className="rounded-lg border px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 light:border-gray-300 light:bg-white"
                          placeholder="Statut Colissimo"
                        />

                        <input
                          type="text"
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

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      void handleSaveDraft()
                    }
                    className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? 'Enregistrement...'
                      : `Enregistrer V${draftConfig.version}`}
                  </button>
                </div>
              </section>
            </>
          )}

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
