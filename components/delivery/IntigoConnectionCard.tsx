'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import api from '@/lib/api'

interface DeliveryIntegration {
  _id: string
  platform: string
  isActive: boolean
  credentialsConfigured: boolean
  settings?: {
    pickupIndex?: number
    trackingEnabled?: boolean
  }
}

const getErrorMessage = (
  error: unknown,
  fallback: string
) => {
  if (
    typeof error === 'object' &&
    error !== null
  ) {
    const value = error as {
      response?: {
        data?: {
          error?: unknown
        }
      }
      message?: unknown
    }

    const apiError =
      value.response?.data?.error

    if (
      typeof apiError === 'string' &&
      apiError.trim()
    ) {
      return apiError
    }

    if (
      typeof value.message === 'string' &&
      value.message.trim()
    ) {
      return value.message
    }
  }

  return fallback
}

export default function IntigoConnectionCard() {
  const [integration, setIntegration] =
    useState<DeliveryIntegration | null>(null)

  const [open, setOpen] =
    useState(false)

  const [apiKey, setApiKey] =
    useState('')

  const [pickupIndex, setPickupIndex] =
    useState('1')

  const [trackingEnabled, setTrackingEnabled] =
    useState(true)

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  const [success, setSuccess] =
    useState<string | null>(null)

  const loadIntegration = async () => {
    try {
      setLoading(true)

      const response =
        await api.get(
          '/api/delivery/integrations'
        )

      const integrations =
        Array.isArray(response.data)
          ? response.data
          : []

      const intigo =
        integrations.find(
          item =>
            item.platform === 'intigo'
        ) || null

      setIntegration(intigo)

      if (
        Number.isInteger(
          intigo?.settings?.pickupIndex
        )
      ) {
        setPickupIndex(
          String(
            intigo.settings.pickupIndex
          )
        )
      }

      setTrackingEnabled(
        intigo?.settings
          ?.trackingEnabled !== false
      )
    } catch (err: unknown) {
      setError(
        getErrorMessage(
          err,
          'Impossible de charger Intigo.'
        )
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadIntegration()
  }, [])

  const connected =
    integration?.isActive === true &&
    integration?.credentialsConfigured === true

  const handleSave = async () => {
    const cleanApiKey =
      apiKey.trim()

    const numericPickupIndex =
      Number(pickupIndex)

    if (!cleanApiKey) {
      setError(
        'Veuillez saisir votre clé API Intigo.'
      )
      return
    }

    if (
      !Number.isInteger(
        numericPickupIndex
      ) ||
      numericPickupIndex < 0
    ) {
      setError(
        'Pickup Index invalide.'
      )
      return
    }

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      await api.post(
        '/api/delivery/integration',
        {
          platform: 'intigo',

          credentials: {
            apiKey: cleanApiKey,
            baseUrl:
              'https://api.intigo.net/api/v3'
          },

          settings: {
            autoCreateShipment: false,
            trackingEnabled,
            pickupIndex:
              numericPickupIndex
          }
        }
      )

      setApiKey('')

      await loadIntegration()

      setSuccess(
        'Intigo connecté avec succès.'
      )

      setTimeout(() => {
        setOpen(false)
        setSuccess(null)
      }, 700)
    } catch (err: unknown) {
      setError(
        getErrorMessage(
          err,
          'Impossible de connecter Intigo.'
        )
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="h-80 animate-pulse rounded-2xl border border-slate-700 bg-slate-800" />
    )
  }

  return (
    <>
      <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-700 dark:bg-slate-800">
        <div className="flex h-44 items-center justify-center bg-[#fff4e8] p-7 dark:bg-slate-900">
          <Image
            src="/assets/delivery-logos/intigo.png"
            alt="Intigo"
            width={240}
            height={100}
            className="max-h-24 w-auto object-contain"
          />
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Intigo
            </h2>

            <span
              className={[
                'rounded-full px-2.5 py-1 text-xs font-semibold',
                connected
                  ? 'bg-green-500/10 text-green-500'
                  : 'bg-slate-700 text-slate-300',
              ].join(' ')}
            >
              {connected
                ? '● Connecté'
                : 'Non connecté'}
            </span>
          </div>

          <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
            Livraison, création de colis et suivi automatique.
          </p>

          <div className="mt-4 flex gap-2">
            <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-500">
              ✓ Labels
            </span>

            <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-500">
              ✓ Tracking
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setOpen(true)
              setError(null)
              setSuccess(null)
            }}
            className="mt-5 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold transition hover:bg-gray-50 dark:border-slate-600 dark:text-white dark:hover:bg-slate-700"
          >
            {connected
              ? 'Gérer'
              : 'Connecter'}
          </button>
        </div>
      </article>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-slate-700">
              <div className="flex items-center gap-4">
                <Image
                  src="/assets/delivery-logos/intigo.png"
                  alt="Intigo"
                  width={100}
                  height={40}
                  className="max-h-10 w-auto object-contain"
                />

                <div>
                  <h3 className="font-semibold">
                    Intigo
                  </h3>

                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    Configuration
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setOpen(false)
                }
                className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              {connected && (
                <div className="rounded-lg bg-green-500/10 p-3 text-sm text-green-500">
                  ✓ Intigo est connecté.
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Clé API Intigo
                </label>

                <input
                  type="password"
                  value={apiKey}
                  onChange={event =>
                    setApiKey(
                      event.target.value
                    )
                  }
                  placeholder="Clé API Intigo"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Pickup Index
                </label>

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={pickupIndex}
                  onChange={event =>
                    setPickupIndex(
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900"
                />
              </div>

              <label className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-slate-700">
                <div>
                  <p className="text-sm font-medium">
                    Synchronisation automatique
                  </p>

                  <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                    Récupère automatiquement les statuts.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={trackingEnabled}
                  onChange={event =>
                    setTrackingEnabled(
                      event.target.checked
                    )
                  }
                  className="h-4 w-4"
                />
              </label>

              {error && (
                <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-lg bg-green-500/10 p-3 text-sm text-green-500">
                  {success}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-slate-700">
              <button
                type="button"
                onClick={() =>
                  setOpen(false)
                }
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-slate-600"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={
                  saving ||
                  !apiKey.trim() ||
                  !pickupIndex.trim()
                }
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving
                  ? 'Enregistrement…'
                  : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
