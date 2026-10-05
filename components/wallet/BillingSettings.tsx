'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface BillingConfig {
  defaultRate: number
  defaultMode: 'confirmed' | 'delivered'
  lowBalanceThreshold: number
  blockOnInsufficientBalance: boolean
}

export default function BillingSettings() {
  const [config, setConfig] = useState<BillingConfig | null>(null)
  const [error, setError] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/api/wallet/admin/billing-config').then(response => {
      setConfig(response.data.config)
    }).catch(() => setError(true))
  }, [])

  const save = async () => {
    if (!config || saving) return
    if (!Number.isFinite(config.defaultRate) || config.defaultRate < 0 ||
        !Number.isFinite(config.lowBalanceThreshold) || config.lowBalanceThreshold < 0) {
      toast.error('Le tarif et le seuil doivent être des montants positifs ou nuls.')
      return
    }
    setSaving(true)
    try {
      const response = await api.patch('/api/wallet/admin/billing-config', config)
      setConfig(response.data.config)
      toast.success('Configuration de facturation enregistrée')
    } catch {
      toast.error('Impossible d’enregistrer la configuration')
    } finally {
      setSaving(false)
    }
  }

  return <section className="card p-6 space-y-4">
    <h2 className="text-lg font-semibold">Facturation des boutiques</h2>
    <p className="text-sm text-gray-500 dark:text-slate-400">Le tarif personnalisé d’une boutique est prioritaire. Les anciennes transactions conservent leur tarif.</p>
    {error ? <p role="alert" className="text-red-500">Impossible de charger la configuration. Rechargez cette page.</p> : !config ? <p>Chargement...</p> : <>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm">Tarif par défaut (TND / commande)
          <input type="number" min="0" step="0.001" value={config.defaultRate} onChange={e => setConfig({ ...config, defaultRate: Number(e.target.value) })} className="block w-full rounded-lg border p-2 dark:bg-slate-900 dark:border-slate-700" />
        </label>
        <label className="space-y-1 text-sm">Mode par défaut
          <select value={config.defaultMode} onChange={e => setConfig({ ...config, defaultMode: e.target.value as BillingConfig['defaultMode'] })} className="block w-full rounded-lg border p-2 dark:bg-slate-900 dark:border-slate-700">
            <option value="confirmed">Commande confirmée</option><option value="delivered">Commande livrée</option>
          </select>
        </label>
        <label className="space-y-1 text-sm">Seuil de solde faible (TND)
          <input type="number" min="0" step="0.001" value={config.lowBalanceThreshold} onChange={e => setConfig({ ...config, lowBalanceThreshold: Number(e.target.value) })} className="block w-full rounded-lg border p-2 dark:bg-slate-900 dark:border-slate-700" />
        </label>
        <label className="space-y-1 text-sm">Bloquer si solde insuffisant
          <select value={String(config.blockOnInsufficientBalance)} onChange={e => setConfig({ ...config, blockOnInsufficientBalance: e.target.value === 'true' })} className="block w-full rounded-lg border p-2 dark:bg-slate-900 dark:border-slate-700">
            <option value="false">Non</option><option value="true">Oui</option>
          </select>
        </label>
      </div>
      {config.defaultRate === 0 && <p className="text-sm text-amber-600 dark:text-amber-400">Le tarif est à zéro : aucune consommation payante ne sera générée.</p>}
      <button type="button" disabled={saving} onClick={() => void save()} className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50">{saving ? 'Enregistrement...' : 'Enregistrer la facturation'}</button>
    </>}
  </section>
}
