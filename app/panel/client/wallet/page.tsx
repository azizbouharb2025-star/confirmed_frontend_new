'use client'

import { useEffect, useState } from 'react'
import {
  ArrowPathIcon,
  BanknotesIcon,
  ClockIcon,
  WalletIcon,
} from '@heroicons/react/24/outline'
import api from '@/lib/api'
import { useTheme } from '@/hooks/useTheme'

interface Wallet {
  id: string
  shopId: string
  availableBalance: number
  pendingBalance: number
  currency: 'TND'
  createdAt?: string
  updatedAt?: string
}

interface WalletTransaction {
  _id: string
  type: 'credit' | 'debit' | 'adjustment' | 'refund'
  status: 'pending' | 'completed' | 'cancelled'
  amount: number
  currency: 'TND'
  description: string
  reference?: string | null
  createdAt: string
}

interface WalletResponse {
  wallet: Wallet
}

interface TransactionsResponse {
  transactions: WalletTransaction[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
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

function transactionSign(type: WalletTransaction['type']) {
  return type === 'debit' ? '-' : '+'
}

export default function WalletPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadWallet = async (manual = false) => {
    if (manual) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    setError(null)

    try {
      const [walletResponse, transactionResponse] = await Promise.all([
        api.get('/api/wallet'),
        api.get('/api/wallet/transactions?limit=20&page=1'),
      ])

      const walletData = walletResponse.data as WalletResponse
      const transactionData = transactionResponse.data as TransactionsResponse

      setWallet(walletData.wallet)
      setTransactions(transactionData.transactions ?? [])
    } catch {
      setError('Impossible de charger le portefeuille pour le moment.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadWallet()
  }, [])

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

      <section
        className={`overflow-hidden rounded-2xl border ${
          isDark
            ? 'border-slate-800 bg-slate-900'
            : 'border-gray-200 bg-white'
        }`}
      >
        <div
          className={`border-b px-5 py-4 ${
            isDark ? 'border-slate-800' : 'border-gray-200'
          }`}
        >
          <h2
            className={`text-base font-semibold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
          >
            Historique des transactions
          </h2>

          <p
            className={`mt-1 text-sm ${
              isDark ? 'text-slate-400' : 'text-gray-500'
            }`}
          >
            Les derniers mouvements enregistrés sur votre Wallet.
          </p>
        </div>

        {loading ? (
          <div
            className={`px-5 py-12 text-center text-sm ${
              isDark ? 'text-slate-400' : 'text-gray-500'
            }`}
          >
            Chargement...
          </div>
        ) : transactions.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <WalletIcon
              className={`mx-auto h-10 w-10 ${
                isDark ? 'text-slate-600' : 'text-gray-300'
              }`}
            />

            <p
              className={`mt-3 font-medium ${
                isDark ? 'text-slate-200' : 'text-gray-700'
              }`}
            >
              Aucune transaction pour le moment
            </p>

            <p
              className={`mt-1 text-sm ${
                isDark ? 'text-slate-500' : 'text-gray-500'
              }`}
            >
              Les futurs crédits et débits apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-slate-800">
            {transactions.map(transaction => (
              <div
                key={transaction._id}
                className="flex items-center justify-between gap-4 px-5 py-4"
              >
                <div className="min-w-0">
                  <p
                    className={`truncate text-sm font-medium ${
                      isDark ? 'text-slate-100' : 'text-gray-800'
                    }`}
                  >
                    {transaction.description}
                  </p>

                  <p
                    className={`mt-1 text-xs ${
                      isDark ? 'text-slate-500' : 'text-gray-500'
                    }`}
                  >
                    {formatDate(transaction.createdAt)}
                    {transaction.reference
                      ? ` · ${transaction.reference}`
                      : ''}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p
                    className={`text-sm font-semibold ${
                      transaction.type === 'debit'
                        ? 'text-red-500'
                        : 'text-emerald-500'
                    }`}
                  >
                    {transactionSign(transaction.type)}
                    {formatAmount(transaction.amount)} DT
                  </p>

                  <p
                    className={`mt-1 text-xs ${
                      isDark ? 'text-slate-500' : 'text-gray-500'
                    }`}
                  >
                    {transaction.status === 'completed'
                      ? 'Terminé'
                      : transaction.status === 'pending'
                        ? 'En attente'
                        : 'Annulé'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
