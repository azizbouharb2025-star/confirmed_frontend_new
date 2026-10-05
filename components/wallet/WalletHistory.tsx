'use client'

import { useCallback, useEffect, useState } from 'react'
import api from '@/lib/api'
import toast from 'react-hot-toast'

export interface WalletTransaction {
  _id: string
  shopId?: { _id: string; name: string } | string
  kind: string
  type: string
  amount: number
  balanceBefore: number | null
  balanceAfter: number | null
  status: string
  description: string
  reference?: string
  createdAt: string
  billingRate?: number
  billingMode?: string
  createdBy?: { firstName?: string; lastName?: string; email?: string } | null
  orderId?: { confirmedId?: number; orderId?: string } | null
  creditSettlementStatus?: string
  settlement?: { paidAt: string; amount: number; reference: string; note?: string; createdBy?: { firstName?: string; lastName?: string } } | null
}

const kinds: Record<string, string> = { recharge: 'Recharge', consumption: 'Consommation', credit_granted: 'Crédit accordé', refund: 'Remboursement', manual_adjustment: 'Ajustement manuel' }
const statuses: Record<string, string> = { completed: 'Terminé', pending: 'En attente', cancelled: 'Annulé' }
export const amountText = (value?: number | null) => Number(value || 0).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + ' TND'
const dateText = (value: string) => new Date(value).toLocaleString('fr-TN')

export function TransactionRows({ transactions, allowSettlement = false, onSettled }: { transactions: WalletTransaction[]; allowSettlement?: boolean; onSettled?: () => void }) {
  const [credit, setCredit] = useState<WalletTransaction | null>(null)
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')
  const [paidAt, setPaidAt] = useState('')
  const [saving, setSaving] = useState(false)

  const settle = async () => {
    if (!credit || saving || !reference.trim() || !paidAt) return
    setSaving(true)
    try {
      await api.post(`/api/wallet/admin/credits/${credit._id}/settle`, {
        amount: credit.amount, reference: reference.trim(), note: note.trim(), paidAt: new Date(paidAt).toISOString()
      })
      toast.success('Règlement enregistré')
      setCredit(null)
      onSettled?.()
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Impossible d’enregistrer le règlement') }
    finally { setSaving(false) }
  }

  return <>
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 dark:bg-slate-800"><tr>{['Date / heure', 'Boutique', 'Type', 'Montant', 'Solde avant', 'Solde après', 'Motif / commande', 'Responsable', 'Référence', 'Statut'].map(label => <th key={label} className="px-3 py-3 whitespace-nowrap">{label}</th>)}</tr></thead>
        <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
          {transactions.length === 0 && <tr><td colSpan={10} className="p-6 text-center text-gray-500">Aucune transaction.</td></tr>}
          {transactions.map(t => <tr key={t._id}>
            <td className="p-3 whitespace-nowrap">{dateText(t.createdAt)}</td>
            <td className="p-3">{typeof t.shopId === 'object' ? t.shopId?.name : '—'}</td>
            <td className="p-3">{kinds[t.kind] || t.kind}</td>
            <td className="p-3 whitespace-nowrap font-medium">{t.type === 'debit' ? '−' : '+'}{amountText(t.amount)}</td>
            <td className="p-3 whitespace-nowrap">{t.balanceBefore == null ? '—' : amountText(t.balanceBefore)}</td>
            <td className="p-3 whitespace-nowrap">{t.balanceAfter == null ? '—' : amountText(t.balanceAfter)}</td>
            <td className="p-3 min-w-[180px]">{t.description}{t.orderId && <div className="text-xs text-gray-500">Commande #{t.orderId.confirmedId || t.orderId.orderId} · {amountText(t.billingRate)} · {t.billingMode === 'delivered' ? 'Livrée' : 'Confirmée'}</div>}
              {t.settlement && <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">Paiement reçu : {amountText(t.settlement.amount)} le {dateText(t.settlement.paidAt)} · Réf. {t.settlement.reference} · {t.settlement.createdBy?.firstName} {t.settlement.createdBy?.lastName}{t.settlement.note && ` · ${t.settlement.note}`}</div>}
            </td>
            <td className="p-3">{t.createdBy ? `${t.createdBy.firstName || ''} ${t.createdBy.lastName || ''}`.trim() || t.createdBy.email : 'Système'}</td>
            <td className="p-3">{t.reference || '—'}</td>
            <td className="p-3">{statuses[t.status] || t.status}
              {t.kind === 'credit_granted' && <div className="mt-1 text-xs">{t.creditSettlementStatus === 'paid' ? 'Payé' : 'En attente de règlement'}</div>}
              {allowSettlement && t.kind === 'credit_granted' && t.status === 'completed' && t.creditSettlementStatus !== 'paid' && <button type="button" className="mt-2 rounded border px-2 py-1 text-blue-600" onClick={() => { setCredit(t); setReference(''); setNote(''); setPaidAt('') }}>Enregistrer le règlement</button>}
            </td>
          </tr>)}
        </tbody>
      </table>
    </div>
    {credit && <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4"><form onSubmit={e => { e.preventDefault(); void settle() }} className="w-full max-w-lg space-y-4 rounded-xl bg-white p-6 dark:bg-slate-900">
      <h3 className="text-lg font-semibold">Règlement intégral du crédit</h3>
      <p>{amountText(credit.amount)} · {credit.description}</p>
      <p className="text-sm text-gray-500">Ce règlement sera ajouté à l’historique. Le solde ne sera pas crédité une seconde fois.</p>
      <label className="block text-sm">Date et heure du règlement<input required type="datetime-local" value={paidAt} onChange={e => setPaidAt(e.target.value)} className="mt-1 block w-full rounded border p-2 dark:bg-slate-800" /></label>
      <label className="block text-sm">Référence du paiement<input required maxLength={120} value={reference} onChange={e => setReference(e.target.value)} className="mt-1 block w-full rounded border p-2 dark:bg-slate-800" /></label>
      <label className="block text-sm">Note facultative<textarea maxLength={300} value={note} onChange={e => setNote(e.target.value)} className="mt-1 block w-full rounded border p-2 dark:bg-slate-800" /></label>
      <div className="flex justify-end gap-2"><button type="button" disabled={saving} onClick={() => setCredit(null)} className="rounded border px-4 py-2">Annuler</button><button disabled={saving} className="rounded bg-blue-600 px-4 py-2 text-white">{saving ? 'Enregistrement...' : 'Confirmer le règlement'}</button></div>
    </form></div>}
  </>
}

export default function WalletHistory({ period, from, to, onUpdated }: { period: string; from: string; to: string; onUpdated?: () => void }) {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(0)
  const [kind, setKind] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const load = useCallback(async () => {
    setLoading(true); setError(false)
    try {
      const params = new URLSearchParams({ period, page: String(page), limit: '25' })
      if (kind) params.set('kind', kind)
      if (status) params.set('status', status)
      if (period === 'custom' && from) params.set('from', `${from}T00:00:00.000`)
      if (period === 'custom' && to) params.set('to', `${to}T23:59:59.999`)
      const response = await api.get(`/api/wallet/admin/transactions?${params}`)
      setTransactions(response.data.transactions || [])
      setPages(response.data.pagination.pages)
    } catch { setError(true) } finally { setLoading(false) }
  }, [period, from, to, page, kind, status])
  useEffect(() => { void load() }, [load])
  useEffect(() => { setPage(1) }, [period, from, to, kind, status])
  return <section className="rounded-xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900">
    <div className="flex flex-wrap items-center justify-between gap-3 p-5"><h2 className="font-semibold">Historique financier global</h2><div className="flex flex-wrap gap-2">
      <select aria-label="Type de transaction" value={kind} onChange={e => setKind(e.target.value)} className="rounded border p-2 dark:bg-slate-800"><option value="">Tous les types</option>{Object.entries(kinds).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
      <select aria-label="Statut de transaction" value={status} onChange={e => setStatus(e.target.value)} className="rounded border p-2 dark:bg-slate-800"><option value="">Tous les statuts</option>{Object.entries(statuses).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
      <button type="button" onClick={() => void load()} className="rounded border px-3 py-2">Actualiser</button>
    </div></div>
    {error ? <p role="alert" className="p-5 text-red-500">Impossible de charger l’historique.</p> : loading ? <p className="p-5">Chargement...</p> : <TransactionRows transactions={transactions} allowSettlement onSettled={() => { void load(); onUpdated?.() }} />}
    <div className="flex items-center justify-end gap-3 p-4"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)} className="rounded border px-3 py-1 disabled:opacity-40">Précédent</button><span>Page {page} / {Math.max(1, pages)}</span><button type="button" disabled={page >= pages || loading} onClick={() => setPage(page + 1)} className="rounded border px-3 py-1 disabled:opacity-40">Suivant</button></div>
  </section>
}
