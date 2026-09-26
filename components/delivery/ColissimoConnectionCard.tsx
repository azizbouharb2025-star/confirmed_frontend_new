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
    trackingEnabled?: boolean
    deliveryCost?: number
    returnCost?: number
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

export default function ColissimoConnectionCard() {
  const [integration, setIntegration] =
    useState<DeliveryIntegration | null>(null)

  const [open, setOpen] =
    useState(false)

  const [token, setToken] =
    useState('')

  const [trackingToken, setTrackingToken] =
    useState('')

  const [deliveryCost, setDeliveryCost] =
    useState('0')

  const [returnCost, setReturnCost] =
    useState('0')

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

      const colissimo =
        integrations.find(
          item =>
            item.platform === 'colissimo'
        ) || null

      setIntegration(colissimo)

      setDeliveryCost(
        String(
          colissimo?.settings?.deliveryCost ?? 0
        )
      )

      setReturnCost(
        String(
          colissimo?.settings?.returnCost ?? 0
        )
      )
    } catch (err: unknown) {
      setError(
        getErrorMessage(
          err,
          'Impossible de charger Colissimo.'
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
    const cleanToken =
      token.trim()

    const numericDeliveryCost =
      Number(deliveryCost)

    const numericReturnCost =
      Number(returnCost)

    if (
      !Number.isFinite(numericDeliveryCost) ||
      numericDeliveryCost < 0 ||
      !Number.isFinite(numericReturnCost) ||
      numericReturnCost < 0
    ) {
      setError(
        'Les frais de livraison et de retour doivent être supérieurs ou égaux à 0.'
      )
      return
    }

    if (!connected && !cleanToken) {
      setError(
        'Veuillez saisir le token API Colissimo.'
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
          platform: 'colissimo',

          credentials: cleanToken
            ? {
                addToken: cleanToken,
                ...(trackingToken.trim()
                  ? {
                      trackingToken:
                        trackingToken.trim()
                    }
                  : {}),
                baseUrl:
                  'https://colissimodelivery.tn/api/v1/post.php'
              }
            : {},

          settings: {
            autoCreateShipment:
              false,

            trackingEnabled:
              trackingToken.trim()
                ? true
                : integration?.settings?.trackingEnabled !== false,

            deliveryCost:
              numericDeliveryCost,

            returnCost:
              numericReturnCost
          }
        }
      )

      setToken('')
      setTrackingToken('')

      await loadIntegration()

      setSuccess(
        'Colissimo connecté avec succès.'
      )

      setTimeout(() => {
        setOpen(false)
        setSuccess(null)
      }, 700)
    } catch (err: unknown) {
      setError(
        getErrorMessage(
          err,
          'Impossible de connecter Colissimo.'
        )
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="h-72 animate-pulse rounded-2xl border border-gray-200 bg-gray-100 dark:border-slate-700 dark:bg-slate-800" />
    )
  }

  return (
    <>
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800">
        <div className="flex h-44 items-center justify-center bg-[#eef9ff] p-7 dark:bg-slate-900">
          <Image
            src="/assets/delivery-logos/colissimo.png"
            alt="Colissimo"
            width={320}
            height={120}
            className="max-h-24 w-auto max-w-[80%] object-contain"
          />
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Colissimo
            </h2>

            <span
              className={[
                'rounded-full px-2.5 py-1 text-xs font-semibold',
                connected
                  ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300',
              ].join(' ')}
            >
              {connected
                ? '● Connecté'
                : 'Non connecté'}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-500/10 dark:text-green-400">
              ✓ Création colis
            </span>

            <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-500/10 dark:text-green-400">
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
            className="mt-auto w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-slate-600 dark:text-white dark:hover:bg-slate-700"
          >
            {connected
              ? 'Gérer'
              : 'Connecter'}
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <Image
                  src="/assets/delivery-logos/colissimo.png"
                  alt="Colissimo"
                  width={100}
                  height={40}
                  className="max-h-9 w-auto object-contain"
                />

                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Colissimo
                  </h3>

                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    Configuration de la connexion
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
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-400">
                  ✓ Colissimo est actuellement connecté.
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Token API d&apos;ajout
                </label>

                <input
                  type="password"
                  value={token}
                  onChange={event =>
                    setToken(
                      event.target.value
                    )
                  }
                  placeholder="Token API Colissimo"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Token de tracking
                </label>

                <input
                  type="password"
                  value={trackingToken}
                  onChange={event =>
                    setTrackingToken(
                      event.target.value
                    )
                  }
                  placeholder="Token de tracking Colissimo"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Frais de livraison (TND)
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={deliveryCost}
                    onChange={event =>
                      setDeliveryCost(event.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Frais de retour (TND)
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={returnCost}
                    onChange={event =>
                      setReturnCost(event.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900"
                  />
                </div>
              </div>

              {connected && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Pour modifier la configuration, ressaisissez les tokens.
                </p>
              )}

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-500/10 dark:text-green-400">
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
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium dark:border-slate-600"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={
                  saving ||
                  (!connected && !token.trim())
                }
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
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
