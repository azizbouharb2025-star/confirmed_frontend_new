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

      setDeliveryCost(
        String(
          intigo?.settings?.deliveryCost ?? 0
        )
      )

      setReturnCost(
        String(
          intigo?.settings?.returnCost ?? 0
        )
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

    const parsedPickupIndex =
      Number(pickupIndex)

    const numericPickupIndex =
      Number.isInteger(parsedPickupIndex) &&
      parsedPickupIndex >= 0
        ? parsedPickupIndex
        : 1

    if (!connected && !cleanApiKey) {
      setError(
        'Veuillez saisir votre clé API Intigo.'
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

          credentials: cleanApiKey
            ? {
                apiKey: cleanApiKey,
                baseUrl:
                  'https://api.intigo.net/api/v3'
              }
            : {},

          settings: {
            autoCreateShipment: false,
            trackingEnabled,
            pickupIndex:
              numericPickupIndex,
            deliveryCost:
              numericDeliveryCost,
            returnCost:
              numericReturnCost
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
      <div className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-orange-50 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900" />
    )
  }

  return (
    <>
      <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-white to-[#ADFF2F]/[0.035] shadow-[0_10px_35px_rgba(15,23,42,0.055)] transition-all duration-300 hover:-translate-y-1 hover:border-[#ADFF2F]/40 hover:shadow-[0_18px_45px_rgba(15,23,42,0.10)] dark:border-slate-700/80 dark:from-slate-900 dark:via-slate-900 dark:to-green-950/20">
        <div
          className="pointer-events-none absolute inset-x-10 top-0 z-20 h-[2px] bg-gradient-to-r from-transparent via-[#ADFF2F] to-transparent opacity-80"
          aria-hidden="true"
        />
        <div className="relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-[#fff4e8] via-white to-[#ADFF2F]/[0.05] p-7 dark:from-slate-900 dark:via-slate-900 dark:to-orange-950/20">
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#ADFF2F]/10 blur-3xl"
            aria-hidden="true"
          />
          <Image
            src="/assets/delivery-logos/intigo.png"
            alt="Intigo"
            width={240}
            height={100}
            className="max-h-24 w-auto max-w-[80%] object-contain"
          />
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold tracking-tight text-slate-950 dark:text-white">
              Intigo
            </h2>

            <span
              className={[
                'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold',
                connected
                  ? 'border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400'
                  : 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300',
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
            <span className="rounded-full border border-green-500/15 bg-green-500/[0.08] px-3 py-1 text-xs font-semibold text-green-600 dark:text-green-400">
              ✓ Labels
            </span>

            <span className="rounded-full border border-green-500/15 bg-green-500/[0.08] px-3 py-1 text-xs font-semibold text-green-600 dark:text-green-400">
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
            className="mt-auto w-full rounded-xl border border-[#32CD32]/30 bg-gradient-to-r from-[#ADFF2F]/10 to-[#00BFFF]/[0.05] px-4 py-2.5 text-sm font-semibold text-green-700 transition-all duration-300 hover:border-[#32CD32]/55 hover:bg-[#ADFF2F]/15 hover:shadow-sm dark:text-green-400"
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
                  (!connected && !apiKey.trim())
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
