'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'

interface DeliveryIntegration {
  _id: string
  platform: string
  isActive: boolean
  credentialsConfigured: boolean
  updatedAt?: string
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

  const [token, setToken] =
    useState('')

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [editing, setEditing] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  const [success, setSuccess] =
    useState<string | null>(null)

  const loadIntegration = async () => {
    try {
      setLoading(true)
      setError(null)

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

  const handleSave = async () => {
    const cleanToken =
      token.trim()

    if (!cleanToken) {
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

          credentials: {
            addToken: cleanToken,
            baseUrl:
              'https://colissimodelivery.tn'
          },

          settings: {
            autoCreateShipment: false,
            trackingEnabled: false
          }
        }
      )

      setToken('')
      setEditing(false)

      setSuccess(
        'Colissimo connecté avec succès.'
      )

      await loadIntegration()
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
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        Chargement de Colissimo…
      </div>
    )
  }

  const connected =
    integration?.isActive === true &&
    integration?.credentialsConfigured === true

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Colissimo
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            Connectez votre compte Colissimo à Confirmed pour créer vos colis directement depuis vos commandes.
          </p>
        </div>

        <span
          className={[
            'rounded-full px-3 py-1 text-xs font-semibold',
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

      {connected && !editing ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-500/20 dark:bg-green-500/10">
            <p className="text-sm font-medium text-green-700 dark:text-green-400">
              ✓ Token API configuré
            </p>

            <p className="mt-1 text-xs text-green-700/70 dark:text-green-400/70">
              Le token est enregistré de manière privée et n’est jamais réaffiché.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditing(true)
              setError(null)
              setSuccess(null)
            }}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-white dark:hover:bg-slate-700"
          >
            Modifier le token
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
              Token API d&apos;ajout Colissimo
            </label>

            <input
              type="password"
              autoComplete="new-password"
              value={token}
              onChange={event =>
                setToken(
                  event.target.value
                )
              }
              placeholder="Collez votre token API Colissimo"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />

            <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">
              Le token est fourni par Colissimo. Confirmed ne l&apos;affichera plus après l&apos;enregistrement.
            </p>
          </div>

          <div className="flex gap-2">
            {connected && (
              <button
                type="button"
                onClick={() => {
                  setEditing(false)
                  setToken('')
                  setError(null)
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium dark:border-slate-600 dark:text-white"
              >
                Annuler
              </button>
            )}

            <button
              type="button"
              disabled={
                saving ||
                !token.trim()
              }
              onClick={handleSave}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? 'Enregistrement…'
                : connected
                  ? 'Enregistrer le nouveau token'
                  : 'Enregistrer et activer'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-500/10 dark:text-green-400">
          {success}
        </div>
      )}
    </div>
  )
}
