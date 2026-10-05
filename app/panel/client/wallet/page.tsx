'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  ArrowPathIcon,
  BanknotesIcon,
  ClockIcon,
  WalletIcon,
} from '@heroicons/react/24/outline'
import api from '@/lib/api'
import { useTheme } from '@/hooks/useTheme'
import { TransactionRows, WalletTransaction as LedgerTransaction, amountText } from '@/components/wallet/WalletHistory'

interface Wallet {
  id: string
  shopId: string
  availableBalance: number
  pendingBalance: number
  currency: 'TND'
  createdAt?: string
  updatedAt?: string
}

interface WalletResponse {
  wallet: Wallet
  summary?: { totalCredited: number; totalConsumed: number; totalFees: number; creditsGranted: number; pendingCredits: number; lastRechargeAt?: string; lastActivityAt?: string }
  billing?: { rate: number; mode: string }
  status?: string
}

function formatAmount(value: number) {
  return value.toLocaleString('fr-TN', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-TN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

const walletStatuses: Record<string, string> = { active: 'Actif', low_balance: 'Solde faible', exhausted: 'Solde épuisé', credit_in_progress: 'Crédit en cours' }

export default function WalletPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [walletInfo, setWalletInfo] = useState<WalletResponse | null>(null)
  const [journal, setJournal] = useState<LedgerTransaction[]>([])
  const [journalPage, setJournalPage] = useState(1)
  const [journalPages, setJournalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadWallet = useCallback(async (manual = false) => {
    if (manual) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    setError(null)

    try {
      const [walletResponse, transactionResponse] = await Promise.all([
        api.get('/api/wallet'),
        api.get(`/api/wallet/transactions?limit=20&page=${journalPage}`),
      ])

      const walletData = walletResponse.data as WalletResponse

      setWallet(walletData.wallet)
      setWalletInfo(walletData)
      setJournal(transactionResponse.data.transactions || [])
      setJournalPages(transactionResponse.data.pagination?.pages || 0)

    } catch {
      setError('Impossible de charger le portefeuille pour le moment.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [journalPage])

  useEffect(() => {
    void loadWallet()
  }, [loadWallet])

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                isDark
                  ? 'bg-slate-800 text-slate-100'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              <WalletIcon className="h-6 w-6" />
            </div>

            <div>
              <h1
                className={`text-2xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              >
                Wallet
              </h1>

              <p
                className={`mt-0.5 text-sm ${
                  isDark ? 'text-slate-400' : 'text-gray-500'
                }`}
              >
                Consultez le solde et les mouvements financiers de votre boutique.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadWallet(true)}
          disabled={refreshing}
          className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
            isDark
              ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
              : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <ArrowPathIcon
            className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
          />
          Actualiser
        </button>
      </div>

      {error && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            isDark
              ? 'border-red-900/50 bg-red-950/30 text-red-300'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {error}
        </div>
      )}

      {walletInfo?.summary && <section className="rounded-xl border border-gray-200 p-4 dark:border-slate-800">
        <p className="mb-3 text-sm">Statut : {walletStatuses[walletInfo.status || ''] || walletInfo.status} · Tarif : {amountText(walletInfo.billing?.rate)} / commande · {walletInfo.billing?.mode === 'delivered' ? 'Commande livrée' : 'Commande confirmée'}</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{[
          ['Total crédité', walletInfo.summary.totalCredited], ['Total consommé', walletInfo.summary.totalConsumed], ['Total des frais', walletInfo.summary.totalFees], ['Crédits accordés', walletInfo.summary.creditsGranted], ['Crédits en attente de règlement', walletInfo.summary.pendingCredits]
        ].map(([label, value]) => <div key={String(label)}><p className="text-xs text-gray-500 dark:text-slate-400">{label}</p><p className="font-semibold">{amountText(Number(value))}</p></div>)}</div>
        <p className="mt-3 text-xs text-gray-500">Dernière recharge : {walletInfo.summary.lastRechargeAt ? formatDate(walletInfo.summary.lastRechargeAt) : '—'} · Dernière activité : {walletInfo.summary.lastActivityAt ? formatDate(walletInfo.summary.lastActivityAt) : '—'}</p>
      </section>}

      <div className="grid gap-4 md:grid-cols-2">
        <div
          className={`rounded-2xl border p-5 ${
            isDark
              ? 'border-slate-800 bg-slate-900'
              : 'border-gray-200 bg-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className={`text-sm font-medium ${
                  isDark ? 'text-slate-400' : 'text-gray-500'
                }`}
              >
                Solde disponible
              </p>

              <p
                className={`mt-2 text-3xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              >
                {loading || !wallet
                  ? '...'
                  : `${formatAmount(wallet.availableBalance)} DT`}
              </p>
            </div>

            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                isDark
                  ? 'bg-slate-800 text-emerald-400'
                  : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              <BanknotesIcon className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div
          className={`rounded-2xl border p-5 ${
            isDark
              ? 'border-slate-800 bg-slate-900'
              : 'border-gray-200 bg-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className={`text-sm font-medium ${
                  isDark ? 'text-slate-400' : 'text-gray-500'
                }`}
              >
                Solde en attente
              </p>

              <p
                className={`mt-2 text-3xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              >
                {loading || !wallet
                  ? '...'
                  : `${formatAmount(wallet.pendingBalance)} DT`}
              </p>
            </div>

            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                isDark
                  ? 'bg-slate-800 text-amber-400'
                  : 'bg-amber-50 text-amber-600'
              }`}
            >
              <ClockIcon className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 font-semibold">Historique financier détaillé</h2>
        {loading ? <p>Chargement...</p> : <TransactionRows transactions={journal} />}
        <div className="mt-4 flex justify-end items-center gap-3"><button type="button" disabled={journalPage <= 1 || loading} onClick={() => setJournalPage(journalPage - 1)} className="rounded border px-3 py-1 disabled:opacity-40">Précédent</button><span>Page {journalPage} / {Math.max(1, journalPages)}</span><button type="button" disabled={journalPage >= journalPages || loading} onClick={() => setJournalPage(journalPage + 1)} className="rounded border px-3 py-1 disabled:opacity-40">Suivant</button></div>
      </section>
    </div>
  )
}
