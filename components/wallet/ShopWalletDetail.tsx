'use client'

import { useCallback, useEffect, useState } from 'react'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { amountText, TransactionRows, WalletTransaction } from './WalletHistory'

interface Detail {
  shop: { name: string }
  wallet: { balance: number; totalCredited: number; totalConsumed: number; totalFees: number; creditsGranted: number; pendingCredits: number; lastRechargeAt?: string; lastActivityAt?: string }
  billing: { rate: number; mode: string; rateOverride: number | null; modeOverride: string | null }
  transactions: WalletTransaction[]
  pagination: { pages: number }
}

export default function ShopWalletDetail({ shopId, onClose, onUpdated }: { shopId: string; onClose: () => void; onUpdated: () => void }) {
  const [detail, setDetail] = useState<Detail | null>(null)
  const [error, setError] = useState(false)
  const [rate, setRate] = useState('')
  const [mode, setMode] = useState('')
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(1)
  const load = useCallback(async () => {
    setError(false)
    try {
      const response = await api.get(`/api/wallet/admin/shops/${shopId}?page=${page}&limit=25`)
      const data = response.data as Detail
      setDetail(data); setRate(data.billing.rateOverride == null ? '' : String(data.billing.rateOverride)); setMode(data.billing.modeOverride || '')
    } catch { setError(true) }
  }, [shopId, page])
  useEffect(() => { void load() }, [load])
  const save = async () => {
    if (saving || (rate !== '' && (!Number.isFinite(Number(rate)) || Number(rate) < 0))) return
    setSaving(true)
    try {
      await api.patch(`/api/wallet/admin/shops/${shopId}/billing`, { rateOverride: rate === '' ? null : Number(rate), modeOverride: mode || null })
      toast.success('Facturation boutique enregistrée'); await load(); onUpdated()
    } catch { toast.error('Impossible d’enregistrer la facturation') } finally { setSaving(false) }
  }
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3 sm:p-6"><div role="dialog" aria-modal="true" aria-label="Détail du portefeuille" className="max-h-[90vh] w-full max-w-7xl overflow-y-auto rounded-xl bg-white p-5 dark:bg-slate-900">
    <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-semibold">{detail?.shop.name || 'Portefeuille boutique'}</h2><button type="button" onClick={onClose} className="rounded border px-3 py-2">Fermer</button></div>
    {error ? <p role="alert" className="text-red-500">Impossible de charger le détail.</p> : !detail ? <p>Chargement...</p> : <>
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[
        ['Solde actuel', detail.wallet.balance], ['Total crédité', detail.wallet.totalCredited], ['Total consommé', detail.wallet.totalConsumed], ['Total des frais', detail.wallet.totalFees], ['Crédits accordés', detail.wallet.creditsGranted], ['Crédits en attente de règlement', detail.wallet.pendingCredits], ['Tarif effectif / commande', detail.billing.rate]
      ].map(([label, value]) => <div key={String(label)} className="rounded-lg bg-gray-50 p-3 dark:bg-slate-800"><p className="text-xs text-gray-500 dark:text-slate-400">{label}</p><p className="font-semibold">{amountText(Number(value))}</p></div>)}</div>
      <p className="mb-4 text-sm">Mode effectif : {detail.billing.mode === 'confirmed' ? 'Commande confirmée' : 'Commande livrée'} · Dernière recharge : {detail.wallet.lastRechargeAt ? new Date(detail.wallet.lastRechargeAt).toLocaleString('fr-TN') : '—'} · Dernière activité : {detail.wallet.lastActivityAt ? new Date(detail.wallet.lastActivityAt).toLocaleString('fr-TN') : '—'}</p>
      <form className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border p-4 dark:border-slate-700" onSubmit={e => { e.preventDefault(); void save() }}>
        <label className="text-sm">Tarif personnalisé (vide = tarif général)<input type="number" min="0" step="0.001" value={rate} onChange={e => setRate(e.target.value)} className="mt-1 block rounded border p-2 dark:bg-slate-800" /></label>
        <label className="text-sm">Mode personnalisé<select value={mode} onChange={e => setMode(e.target.value)} className="mt-1 block rounded border p-2 dark:bg-slate-800"><option value="">Mode général</option><option value="confirmed">Commande confirmée</option><option value="delivered">Commande livrée</option></select></label>
        <button disabled={saving} className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50">{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
      </form>
      <h3 className="mb-3 font-semibold">Transactions et commandes facturées</h3>
      <TransactionRows transactions={detail.transactions} allowSettlement onSettled={() => { void load(); onUpdated() }} />
      <div className="mt-4 flex justify-end items-center gap-3"><button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded border px-3 py-1 disabled:opacity-40">Précédent</button><span>Page {page} / {Math.max(1, detail.pagination.pages)}</span><button type="button" disabled={page >= detail.pagination.pages} onClick={() => setPage(page + 1)} className="rounded border px-3 py-1 disabled:opacity-40">Suivant</button></div>
    </>}
  </div></div>
}
