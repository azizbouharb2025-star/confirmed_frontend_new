'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  ArrowPathIcon,
  BanknotesIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  WalletIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

import DashboardLayout from '@/components/dashboard/DashboardLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import api from '@/lib/api'
import logger from '@/lib/logger'
import toast from 'react-hot-toast'
import WalletHistory from '@/components/wallet/WalletHistory'
import ShopWalletDetail from '@/components/wallet/ShopWalletDetail'


type WalletStatus =
  | 'active'
  | 'low_balance'
  | 'exhausted'
  | 'credit_in_progress'

type BillingMode =
  | 'confirmed'
  | 'delivered'


interface WalletRow {
  shop: {
    _id: string
    name: string
    isActive?: boolean
  }

  wallet: {
    _id: string | null
    balance: number
    currency: 'TND'
    totalCredited: number
    totalConsumed: number
    totalFees: number
    creditsGranted: number
    pendingCredits: number
    lastRechargeAt?: string | null
    lastActivityAt?: string | null
  }

  billing: {
    rate: number
    mode: BillingMode
    usesCustomRate: boolean
    usesCustomMode: boolean
  }

  status: WalletStatus
}


interface WalletSummary {
  totalBalance: number
  totalCredited: number
  totalConsumed: number
  confirmedRevenue: number
  totalCreditsGranted: number
  lowBalanceShops: number
  exhaustedShops: number
  billedOrders: number
  unbilledOrders: number
  averageBilledPerOrder: number
  periodConsumption: number
}


interface WalletListResponse {
  wallets: WalletRow[]
  summary: WalletSummary
  total: number
}


interface CreditForm {
  shopId: string
  amount: string
  note: string
  reference: string
}


const emptyCreditForm: CreditForm = {
  shopId: '',
  amount: '',
  note: '',
  reference: '',
}


function formatAmount(
  value?: number | null
): string {
  const amount =
    Number(value || 0)

  return amount.toLocaleString(
    'fr-TN',
    {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }
  )
}


function formatDate(
  value?: string | null
): string {
  if (!value) {
    return '—'
  }

  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '—'
  }

  return new Intl.DateTimeFormat(
    'fr-TN',
    {
      dateStyle: 'short',
      timeStyle: 'short',
    }
  ).format(date)
}


function statusLabel(
  status: WalletStatus
): string {
  switch (status) {
    case 'active':
      return 'Actif'

    case 'low_balance':
      return 'Solde faible'

    case 'exhausted':
      return 'Solde épuisé'

    case 'credit_in_progress':
      return 'Crédit en cours'
  }
}


function statusClasses(
  status: WalletStatus
): string {
  switch (status) {
    case 'active':
      return (
        'bg-emerald-500/10 ' +
        'text-emerald-600 ' +
        'dark:text-emerald-400'
      )

    case 'low_balance':
      return (
        'bg-amber-500/10 ' +
        'text-amber-600 ' +
        'dark:text-amber-400'
      )

    case 'exhausted':
      return (
        'bg-red-500/10 ' +
        'text-red-600 ' +
        'dark:text-red-400'
      )

    case 'credit_in_progress':
      return (
        'bg-blue-500/10 ' +
        'text-blue-600 ' +
        'dark:text-blue-400'
      )
  }
}


function billingModeLabel(
  mode: BillingMode
): string {
  return mode === 'confirmed'
    ? 'Commande confirmée'
    : 'Commande livrée'
}


export default function AdminWalletsPage() {
  const [selectedShop, setSelectedShop] = useState<string | null>(null)
  const [creditKind, setCreditKind] = useState<'recharge' | 'credit_granted'>('recharge')
  const [creditKey, setCreditKey] = useState('')
  const [historyVersion, setHistoryVersion] = useState(0)

  const [
    wallets,
    setWallets,
  ] = useState<WalletRow[]>([])

  const [
    summary,
    setSummary,
  ] = useState<WalletSummary | null>(
    null
  )

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    refreshing,
    setRefreshing,
  ] = useState(false)

  const [
    search,
    setSearch,
  ] = useState('')

  const [
    statusFilter,
    setStatusFilter,
  ] = useState('all')

  const [
    billingModeFilter,
    setBillingModeFilter,
  ] = useState('all')

  const [
    minBalance,
    setMinBalance,
  ] = useState('')

  const [
    maxBalance,
    setMaxBalance,
  ] = useState('')

  const [
    periodFilter,
    setPeriodFilter,
  ] = useState('30d')

  const [
    customFrom,
    setCustomFrom,
  ] = useState('')

  const [
    customTo,
    setCustomTo,
  ] = useState('')

  const [
    creditOpen,
    setCreditOpen,
  ] = useState(false)

  const [
    creditForm,
    setCreditForm,
  ] = useState<CreditForm>(
    emptyCreditForm
  )

  const [
    crediting,
    setCrediting,
  ] = useState(false)


  const fetchWallets =
    useCallback(
      async (
        manual = false
      ) => {

        if (manual) {
          setRefreshing(true)
        } else {
          setLoading(true)
        }

        try {

          const params =
            new URLSearchParams()

          if (search.trim()) {
            params.set(
              'search',
              search.trim()
            )
          }

          if (
            statusFilter !== 'all'
          ) {
            params.set(
              'status',
              statusFilter
            )
          }

          if (
            billingModeFilter !==
            'all'
          ) {
            params.set(
              'billingMode',
              billingModeFilter
            )
          }

          if (
            minBalance.trim()
          ) {
            params.set(
              'minBalance',
              minBalance.trim()
            )
          }

          if (
            maxBalance.trim()
          ) {
            params.set(
              'maxBalance',
              maxBalance.trim()
            )
          }

          params.set(
            'period',
            periodFilter
          )

          if (
            periodFilter ===
              'custom' &&
            customFrom
          ) {
            params.set(
              'from',
              `${customFrom}T00:00:00.000`
            )
          }

          if (
            periodFilter ===
              'custom' &&
            customTo
          ) {
            params.set(
              'to',
              `${customTo}T23:59:59.999`
            )
          }

          const query =
            params.toString()

          const response =
            await api.get(
              `/api/wallet/admin/shops${
                query
                  ? `?${query}`
                  : ''
              }`
            )

          const data =
            response.data as
              WalletListResponse

          setWallets(
            data.wallets || []
          )

          setSummary(
            data.summary || null
          )

        } catch (error) {

          logger.error(
            'Failed to fetch admin wallets:',
            error,
            'Admin'
          )

          toast.error(
            'Impossible de charger les portefeuilles'
          )

        } finally {

          setLoading(false)
          setRefreshing(false)
        }
      },
      [
        search,
        statusFilter,
        billingModeFilter,
        minBalance,
        maxBalance,
        periodFilter,
        customFrom,
        customTo,
      ]
    )


  useEffect(() => {

    const timer =
      setTimeout(
        () => {
          void fetchWallets()
        },
        300
      )

    return () =>
      clearTimeout(timer)

  }, [fetchWallets])


  const shopOptions =
    useMemo(
      () =>
        wallets.map(row => ({
          id:
            row.shop._id,
          name:
            row.shop.name,
        })),
      [wallets]
    )


  const openCreditModal =
    () => {
      setCreditForm(
        emptyCreditForm
      )

      setCreditKind('recharge')
      setCreditKey(crypto.randomUUID())
      setCreditOpen(true)
    }


  const submitCredit =
    async () => {

      const amount =
        Number(
          creditForm.amount
        )

      if (!creditForm.shopId) {
        toast.error(
          'Sélectionnez une boutique'
        )

        return
      }

      if (
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        toast.error(
          'Le montant doit être supérieur à 0'
        )

        return
      }

      if (
        !creditForm.note.trim()
      ) {
        toast.error(
          'Ajoutez un motif'
        )

        return
      }

      setCrediting(true)

      try {

        await api.post(
          creditKind === 'recharge' ? '/api/wallet/admin/credit' : '/api/wallet/admin/grant-credit',
          {
            shopId:
              creditForm.shopId,

            amount,

            note:
              creditForm.note.trim(),

            reference:
              creditForm.reference
                .trim() ||
              null,

            idempotencyKey:
              creditKey,
          }
        )

        toast.success(
          creditKind === 'recharge' ? 'Portefeuille crédité' : 'Crédit commercial accordé'
        )

        setCreditOpen(false)

        setCreditForm(
          emptyCreditForm
        )

        setHistoryVersion(version => version + 1)
        await fetchWallets(true)

      } catch (error) {

        logger.error(
          'Failed to credit wallet:',
          error,
          'Admin'
        )

        toast.error(
          'Impossible de créditer le portefeuille'
        )

      } finally {

        setCrediting(false)
      }
    }


  const cards = [
    {
      label:
        'Solde total',
      value:
        `${formatAmount(
          summary?.totalBalance
        )} DT`,
    },
    {
      label:
        'Total crédité',
      value:
        `${formatAmount(
          summary?.totalCredited
        )} DT`,
    },
    {
      label:
        'Total consommé',
      value:
        `${formatAmount(
          summary?.totalConsumed
        )} DT`,
    },
    {
      label:
        'Revenu CONFIRMED',
      value:
        `${formatAmount(
          summary
            ?.confirmedRevenue
        )} DT`,
    },
    {
      label:
        'Solde faible',
      value:
        String(
          summary
            ?.lowBalanceShops ??
          0
        ),
    },
    {
      label:
        'Solde épuisé',
      value:
        String(
          summary
            ?.exhaustedShops ??
          0
        ),
    },
    {
      label:
        'Crédits accordés',
      value:
        `${formatAmount(
          summary
            ?.totalCreditsGranted
        )} DT`,
    },
  ]


  const activityCards = [
    {
      label:
        'Commandes facturées',
      value:
        String(
          summary?.billedOrders ??
          0
        ),
    },
    {
      label:
        'Commandes non facturées',
      value:
        String(
          summary?.unbilledOrders ??
          0
        ),
    },
    {
      label:
        'Montant moyen / commande',
      value:
        `${formatAmount(
          summary
            ?.averageBilledPerOrder
        )} DT`,
    },
    {
      label:
        'Consommation sur la période',
      value:
        `${formatAmount(
          summary
            ?.periodConsumption
        )} DT`,
    },
  ]


  return (
    <ProtectedRoute
      allowedRoles={['admin']}
    >
      <DashboardLayout
        userRole="admin"
      >
        <div className="space-y-6">

          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <WalletIcon className="h-6 w-6" />
                </div>

                <div>
                  <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    Portefeuilles
                  </h1>

                  <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                    Supervision financière des boutiques CONFIRMED.
                  </p>
                </div>

              </div>
            </div>


            <div className="flex gap-2">

              <button
                type="button"
                onClick={() =>
                  void fetchWallets(true)
                }
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <ArrowPathIcon
                  className={`h-5 w-5 ${
                    refreshing
                      ? 'animate-spin'
                      : ''
                  }`}
                />

                Actualiser
              </button>


              <button
                type="button"
                onClick={
                  openCreditModal
                }
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                <PlusIcon className="h-5 w-5" />

                Créditer le portefeuille
              </button>

            </div>
          </div>


          {/* KPI */}
          <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">

            <div className="mb-4 flex items-center gap-2">
              <BanknotesIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />

              <h2 className="font-semibold text-gray-900 dark:text-white">
                Situation financière
              </h2>
            </div>


            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">

              {cards.map(card => (
                <div
                  key={card.label}
                  className="rounded-lg bg-gray-50 px-3 py-3 dark:bg-slate-800/70"
                >
                  <p className="text-[11px] text-gray-500 dark:text-slate-400">
                    {card.label}
                  </p>

                  <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                    {loading
                      ? '...'
                      : card.value}
                  </p>
                </div>
              ))}

            </div>
          </section>


          {/* KPI Activité */}
          <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">

            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

              <div className="flex items-center gap-2">
                <ArrowPathIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />

                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    Activité
                  </h2>

                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    Données de facturation sur la période sélectionnée
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">

                <select
                  value={periodFilter}
                  onChange={event =>
                    setPeriodFilter(
                      event.target.value
                    )
                  }
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value="today">
                    Aujourd&apos;hui
                  </option>

                  <option value="7d">
                    7 derniers jours
                  </option>

                  <option value="30d">
                    30 derniers jours
                  </option>

                  <option value="this_month">
                    Ce mois
                  </option>

                  <option value="custom">
                    Période personnalisée
                  </option>
                </select>

                {periodFilter ===
                  'custom' && (
                  <>
                    <input
                      type="date"
                      value={customFrom}
                      onChange={event =>
                        setCustomFrom(
                          event.target.value
                        )
                      }
                      aria-label="Date de début"
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                    />

                    <input
                      type="date"
                      value={customTo}
                      onChange={event =>
                        setCustomTo(
                          event.target.value
                        )
                      }
                      aria-label="Date de fin"
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                    />
                  </>
                )}

              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

              {activityCards.map(
                card => (
                  <div
                    key={card.label}
                    className="rounded-lg bg-gray-50 px-4 py-4 dark:bg-slate-800/70"
                  >
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      {card.label}
                    </p>

                    <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                      {loading
                        ? '...'
                        : card.value}
                    </p>
                  </div>
                )
              )}

            </div>
          </section>


          {/* Filters */}
          <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">

              <div className="relative xl:col-span-2">

                <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

                <input
                  type="text"
                  value={search}
                  onChange={event =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Rechercher une boutique..."
                  className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                />
              </div>


              <select
                value={statusFilter}
                onChange={event =>
                  setStatusFilter(
                    event.target.value
                  )
                }
                className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="all">
                  Tous les statuts
                </option>

                <option value="active">
                  Actif
                </option>

                <option value="low_balance">
                  Solde faible
                </option>

                <option value="exhausted">
                  Solde épuisé
                </option>

                <option value="credit_in_progress">
                  Crédit en cours
                </option>
              </select>


              <select
                value={
                  billingModeFilter
                }
                onChange={event =>
                  setBillingModeFilter(
                    event.target.value
                  )
                }
                className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="all">
                  Tous les modes
                </option>

                <option value="confirmed">
                  Commande confirmée
                </option>

                <option value="delivered">
                  Commande livrée
                </option>
              </select>


              <div className="grid grid-cols-2 gap-2">

                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={minBalance}
                  onChange={event =>
                    setMinBalance(
                      event.target.value
                    )
                  }
                  placeholder="Solde min."
                  className="min-w-0 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                />

                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={maxBalance}
                  onChange={event =>
                    setMaxBalance(
                      event.target.value
                    )
                  }
                  placeholder="Solde max."
                  className="min-w-0 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                />

              </div>

            </div>
          </section>


          {/* Table */}
          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900">

            <div className="border-b border-gray-200 px-5 py-4 dark:border-slate-800">

              <h2 className="font-semibold text-gray-900 dark:text-white">
                Portefeuilles des boutiques
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                {wallets.length} boutique(s)
              </p>

            </div>


            <div className="overflow-x-auto">

              <table className="w-full text-left text-sm">

                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-slate-800/70 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">
                      Boutique
                    </th>

                    <th className="px-4 py-3">
                      Solde actuel
                    </th>

                    <th className="px-4 py-3">
                      Total crédité
                    </th>

                    <th className="px-4 py-3">
                      Total consommé
                    </th>

                    <th className="px-4 py-3">
                      Tarif / commande
                    </th>

                    <th className="px-4 py-3">
                      Facturation
                    </th>

                    <th className="px-4 py-3">
                      Statut
                    </th>

                    <th className="px-4 py-3">
                      Dernière activité
                    </th>
                  </tr>
                </thead>


                <tbody className="divide-y divide-gray-200 dark:divide-slate-800">

                  {loading ? (

                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-12 text-center text-gray-500 dark:text-slate-400"
                      >
                        Chargement...
                      </td>
                    </tr>

                  ) : wallets.length === 0 ? (

                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-12 text-center text-gray-500 dark:text-slate-400"
                      >
                        Aucun portefeuille trouvé.
                      </td>
                    </tr>

                  ) : (

                    wallets.map(row => (

                      <tr
                        key={row.shop._id}
                        className="hover:bg-gray-50 dark:hover:bg-slate-800/40"
                      >

                        <td className="px-4 py-4 font-medium text-gray-900 dark:text-white">
                          <button type="button" onClick={() => setSelectedShop(row.shop._id)} className="text-blue-600 hover:underline dark:text-blue-400">{row.shop.name}</button>
                        </td>

                        <td className="px-4 py-4 font-semibold">
                          {formatAmount(
                            row.wallet.balance
                          )}{' '}
                          DT
                        </td>

                        <td className="px-4 py-4">
                          {formatAmount(
                            row.wallet
                              .totalCredited
                          )}{' '}
                          DT
                        </td>

                        <td className="px-4 py-4">
                          {formatAmount(
                            row.wallet
                              .totalConsumed
                          )}{' '}
                          DT
                        </td>

                        <td className="px-4 py-4">

                          {formatAmount(
                            row.billing.rate
                          )}{' '}
                          DT

                          {row.billing
                            .usesCustomRate && (
                            <span className="ml-2 text-[10px] text-blue-500">
                              personnalisé
                            </span>
                          )}

                        </td>

                        <td className="px-4 py-4">
                          {billingModeLabel(
                            row.billing.mode
                          )}
                        </td>

                        <td className="px-4 py-4">

                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses(
                              row.status
                            )}`}
                          >
                            {statusLabel(
                              row.status
                            )}
                          </span>

                        </td>

                        <td className="px-4 py-4 text-gray-500 dark:text-slate-400">
                          {formatDate(
                            row.wallet
                              .lastActivityAt
                          )}
                        </td>

                      </tr>
                    ))

                  )}

                </tbody>
              </table>

            </div>
          </section>


          <WalletHistory key={historyVersion} period={periodFilter} from={customFrom} to={customTo} onUpdated={() => void fetchWallets(true)} />
          {selectedShop && <ShopWalletDetail shopId={selectedShop} onClose={() => setSelectedShop(null)} onUpdated={() => { void fetchWallets(true); setHistoryVersion(version => version + 1) }} />}

          {/* Credit modal */}
          {creditOpen && (

            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">

              <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-slate-900">

                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-slate-800">

                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Créditer le portefeuille
                    </h2>

                    <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                      Une transaction permanente sera créée.
                    </p>
                  </div>


                  <button
                    type="button"
                    onClick={() =>
                      setCreditOpen(
                        false
                      )
                    }
                    className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-slate-800"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>

                </div>


                <div className="space-y-4 p-5">
                  <label className="block text-sm font-medium">Nature de l’opération
                    <select value={creditKind} onChange={event => setCreditKind(event.target.value as 'recharge' | 'credit_granted')} className="mt-1 block w-full rounded-lg border border-gray-200 p-2 dark:border-slate-700 dark:bg-slate-950">
                      <option value="recharge">Recharge reçue</option>
                      <option value="credit_granted">Crédit accordé — en attente de règlement</option>
                    </select>
                  </label>
                  {creditKind === 'credit_granted' && <p className="text-sm text-amber-600">Le montant devient disponible immédiatement et reste en attente de règlement.</p>}

                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Boutique
                    </label>

                    <select
                      value={
                        creditForm.shopId
                      }
                      onChange={event =>
                        setCreditForm(
                          previous => ({
                            ...previous,
                            shopId:
                              event.target
                                .value,
                          })
                        )
                      }
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
                    >
                      <option value="">
                        Sélectionner...
                      </option>

                      {shopOptions.map(
                        shop => (
                          <option
                            key={shop.id}
                            value={shop.id}
                          >
                            {shop.name}
                          </option>
                        )
                      )}
                    </select>
                  </div>


                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Montant (TND)
                    </label>

                    <input
                      type="number"
                      min="0.001"
                      step="0.001"
                      value={
                        creditForm.amount
                      }
                      onChange={event =>
                        setCreditForm(
                          previous => ({
                            ...previous,
                            amount:
                              event.target
                                .value,
                          })
                        )
                      }
                      placeholder="200.000"
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
                    />
                  </div>


                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Motif / note
                    </label>

                    <textarea
                      value={
                        creditForm.note
                      }
                      onChange={event =>
                        setCreditForm(
                          previous => ({
                            ...previous,
                            note:
                              event.target
                                .value,
                          })
                        )
                      }
                      rows={3}
                      placeholder="Recharge manuelle..."
                      className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
                    />
                  </div>


                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Référence interne
                      <span className="ml-1 font-normal text-gray-400">
                        facultative
                      </span>
                    </label>

                    <input
                      type="text"
                      value={
                        creditForm.reference
                      }
                      onChange={event =>
                        setCreditForm(
                          previous => ({
                            ...previous,
                            reference:
                              event.target
                                .value,
                          })
                        )
                      }
                      placeholder="DEPOT-2026-001"
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
                    />
                  </div>

                </div>


                <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-4 dark:border-slate-800">

                  <button
                    type="button"
                    onClick={() =>
                      setCreditOpen(
                        false
                      )
                    }
                    disabled={crediting}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium dark:border-slate-700"
                  >
                    Annuler
                  </button>


                  <button
                    type="button"
                    onClick={() =>
                      void submitCredit()
                    }
                    disabled={crediting}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    <BanknotesIcon className="h-4 w-4" />

                    {crediting
                      ? 'Crédit en cours...'
                      : 'Confirmer le crédit'}
                  </button>

                </div>
              </div>
            </div>

          )}

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
