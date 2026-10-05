'use client'

import { useEffect, useState } from 'react'
import {
  UsersIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  PencilSquareIcon,
  BuildingStorefrontIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  NoSymbolIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'

import DashboardLayout from '@/components/dashboard/DashboardLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import logger from '@/lib/logger'

type AccountStatus =
  | 'active'
  | 'pending'
  | 'disabled'

type SubscriptionPlan =
  | 'starter'
  | 'pro'
  | 'business'
  | 'enterprise'

type ActivityPeriod =
  | 'today'
  | '7d'
  | '30d'
  | 'this_month'
  | 'previous_month'
  | 'custom'

interface User {
  _id: string
  firstName?: string
  lastName?: string
  email: string
  phoneNumber?: string
  role: string
  isActive: boolean
  accountStatus?: AccountStatus
  createdAt?: string
  updatedAt?: string
  lastLogin?: string | null
  lastActivity?: string | null
  orderCount?: number

  shop?: {
    _id: string
    name: string
    platform?: string
  } | null

  subscription?: {
    plan: string
    status?: string
  } | null
}

interface UserDetails {
  user: {
    _id: string
    firstName?: string
    lastName?: string
    email: string
    phoneNumber?: string
    whatsappNumber?: string
    country?: string
    role: string
    isActive: boolean
    accountStatus: AccountStatus
    createdAt?: string
    updatedAt?: string
    lastLogin?: string | null
  }

  shop: {
    _id?: string
    name?: string
    domain?: string
    platform?: string
    logoUrl?: string
    contact?: {
      email?: string
      phone?: string
      whatsapp?: string
    }
    address?: {
      street?: string
      city?: string
      governorate?: string
      postalCode?: string
      country?: string
    }
    createdAt?: string
    isActive?: boolean
    numberOfShops: number
  }

  stats: {
    totalOrders: number
    confirmedOrders: number
    deliveredOrders: number
    returnedOrders: number
    failedDeliveryOrders: number
    cancelledOrders: number
    postponedOrders: number
    attempts: number
    confirmationRate: number
    deliveryRate: number
    returnRate: number
    cancellationRate: number
    deliveredRevenue: number
    deliveredAverageOrderValue: number
    averageAiScore: number | null
  }
}

interface EditForm {
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  whatsappNumber: string
  country: string
  role: string
  password: string
  shopName: string
  shopLogoUrl: string
  shopEmail: string
  shopPhone: string
  shopWhatsapp: string
  shopStreet: string
  shopCity: string
  shopGovernorate: string
  shopPostalCode: string
  shopCountry: string
}

function getUserName(user: User): string {
  const fullName =
    `${user.firstName || ''} ${user.lastName || ''}`.trim()

  return fullName || user.email
}

function getUserStatus(user: User): AccountStatus {
  if (user.accountStatus === 'pending') {
    return 'pending'
  }

  if (
    user.accountStatus === 'disabled' ||
    user.isActive === false
  ) {
    return 'disabled'
  }

  return 'active'
}

function formatDate(value?: string | null): string {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function statusLabel(status: AccountStatus): string {
  if (status === 'active') return 'Actif'
  if (status === 'pending') return 'En attente'
  return 'Désactivé'
}

function statusClasses(status: AccountStatus): string {
  if (status === 'active') {
    return 'bg-green-500/10 text-green-500'
  }

  if (status === 'pending') {
    return 'bg-yellow-500/10 text-yellow-500'
  }

  return 'bg-red-500/10 text-red-500'
}

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] =
    useState('')

  const [roleFilter, setRoleFilter] =
    useState('all')

  const [statusFilter, setStatusFilter] =
    useState('all')

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] =
    useState(1)

  const [totalUsers, setTotalUsers] =
    useState(0)

  const [drawerOpen, setDrawerOpen] =
    useState(false)

  const [detailLoading, setDetailLoading] =
    useState(false)

  const [selectedUser, setSelectedUser] =
    useState<UserDetails | null>(null)

  const [editing, setEditing] =
    useState(false)

  const [saving, setSaving] =
    useState(false)

  const [activityPeriod, setActivityPeriod] =
    useState<ActivityPeriod>('30d')

  const [activityFrom, setActivityFrom] =
    useState('')

  const [activityTo, setActivityTo] =
    useState('')

  const [editForm, setEditForm] =
    useState<EditForm>({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      whatsappNumber: '',
      country: '',
      role: 'shop_owner',
      password: '',
      shopName: '',
      shopLogoUrl: '',
      shopEmail: '',
      shopPhone: '',
      shopWhatsapp: '',
      shopStreet: '',
      shopCity: '',
      shopGovernorate: '',
      shopPostalCode: '',
      shopCountry: 'Tunisia',
    })

  const [
    pendingStatusChange,
    setPendingStatusChange,
  ] = useState<{
    user: User
    status: AccountStatus
  } | null>(null)

  const fetchUsers = async () => {
    setLoading(true)

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '25',
      })

      if (roleFilter !== 'all') {
        params.set('role', roleFilter)
      }

      if (statusFilter !== 'all') {
        params.set('status', statusFilter)
      }

      if (debouncedSearch.trim()) {
        params.set(
          'search',
          debouncedSearch.trim()
        )
      }

      const response = await api.get(
        `/api/admin/users?${params.toString()}`
      )

      setUsers(response.data.users || [])
      setTotalPages(
        response.data.totalPages || 1
      )
      setTotalUsers(
        response.data.total || 0
      )
    } catch (error) {
      logger.error(
        'Failed to fetch users:',
        error,
        'Admin'
      )

      toast.error(
        'Impossible de charger les utilisateurs'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPage(1)
    }, 300)

    return () => window.clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    roleFilter,
    statusFilter,
    debouncedSearch,
  ])

  const openUserDetails = async (
    userId: string,
    options?: {
      period?: ActivityPeriod
      from?: string
      to?: string
      preserveEditing?: boolean
    }
  ) => {
    setDrawerOpen(true)
    setDetailLoading(true)

    if (!options?.preserveEditing) {
      setEditing(false)
    }

    try {
      const nextPeriod =
        options?.period || activityPeriod

      const params = new URLSearchParams({
        period: nextPeriod,
      })

      if (nextPeriod === 'custom') {
        const nextFrom =
          options?.from ?? activityFrom

        const nextTo =
          options?.to ?? activityTo

        if (nextFrom) {
          params.set('from', nextFrom)
        }

        if (nextTo) {
          params.set('to', nextTo)
        }
      }

      const response = await api.get(
        `/api/admin/users/${userId}/details?${params.toString()}`
      )

      const details =
        response.data as UserDetails

      setSelectedUser(details)

      if (!options?.preserveEditing) {
        setEditForm({
        firstName:
          details.user.firstName || '',
        lastName:
          details.user.lastName || '',
        email: details.user.email || '',
        phoneNumber:
          details.user.phoneNumber || '',
        whatsappNumber:
          details.user.whatsappNumber || '',
        country:
          details.user.country || '',
        role:
          details.user.role || 'shop_owner',
        password: '',
        shopName:
          details.shop.name || '',
        shopLogoUrl:
          details.shop.logoUrl || '',
        shopEmail:
          details.shop.contact?.email || '',
        shopPhone:
          details.shop.contact?.phone || '',
        shopWhatsapp:
          details.shop.contact?.whatsapp || '',
        shopStreet:
          details.shop.address?.street || '',
        shopCity:
          details.shop.address?.city || '',
        shopGovernorate:
          details.shop.address?.governorate || '',
        shopPostalCode:
          details.shop.address?.postalCode || '',
        shopCountry:
          details.shop.address?.country || 'Tunisia',
        })
      }
    } catch (error) {
      logger.error(
        'Failed to load user details:',
        error,
        'Admin'
      )

      toast.error(
        'Impossible de charger la fiche utilisateur'
      )
    } finally {
      setDetailLoading(false)
    }
  }

  const changeActivityPeriod = async (
    nextPeriod: ActivityPeriod
  ) => {
    setActivityPeriod(nextPeriod)

    if (
      !selectedUser ||
      nextPeriod === 'custom'
    ) {
      return
    }

    await openUserDetails(
      selectedUser.user._id,
      {
        period: nextPeriod,
        preserveEditing: true,
      }
    )
  }

  const applyCustomActivityPeriod =
    async () => {
      if (!selectedUser) return

      if (!activityFrom || !activityTo) {
        toast.error(
          'Sélectionnez une date de début et une date de fin'
        )
        return
      }

      if (
        new Date(activityFrom) >
        new Date(activityTo)
      ) {
        toast.error(
          'La date de début doit précéder la date de fin'
        )
        return
      }

      await openUserDetails(
        selectedUser.user._id,
        {
          period: 'custom',
          from: activityFrom,
          to: activityTo,
          preserveEditing: true,
        }
      )
    }

  const updateUserSubscription = async (
    userId: string,
    plan: SubscriptionPlan
  ) => {
    try {
      await api.patch(
        `/api/admin/users/${userId}/subscription`,
        { plan }
      )

      toast.success(
        `Abonnement mis à jour : ${plan}`
      )

      setUsers(prev =>
        prev.map(user =>
          user._id === userId
            ? {
                ...user,
                subscription: {
                  ...user.subscription,
                  plan,
                },
              }
            : user
        )
      )
    } catch (error) {
      logger.error(
        'Failed to update subscription:',
        error,
        'Admin'
      )

      toast.error(
        "Impossible de modifier l'abonnement"
      )
    }
  }

  const saveUser = async () => {
    if (!selectedUser) return

    if (
      editForm.password &&
      editForm.password.length < 6
    ) {
      toast.error(
        'Le nouveau mot de passe doit contenir au moins 6 caractères'
      )
      return
    }

    setSaving(true)

    try {
      await api.patch(
        `/api/admin/users/${selectedUser.user._id}`,
        {
          firstName:
            editForm.firstName.trim(),
          lastName:
            editForm.lastName.trim(),
          email:
            editForm.email.trim(),
          phoneNumber:
            editForm.phoneNumber.trim(),
          whatsappNumber:
            editForm.whatsappNumber.trim(),
          country:
            editForm.country.trim(),
          role:
            editForm.role,
          ...(editForm.password
            ? { password: editForm.password }
            : {}),
          shopName:
            editForm.shopName.trim(),
          shopLogoUrl:
            editForm.shopLogoUrl.trim(),
          shopEmail:
            editForm.shopEmail.trim(),
          shopPhone:
            editForm.shopPhone.trim(),
          shopWhatsapp:
            editForm.shopWhatsapp.trim(),
          shopStreet:
            editForm.shopStreet.trim(),
          shopCity:
            editForm.shopCity.trim(),
          shopGovernorate:
            editForm.shopGovernorate.trim(),
          shopPostalCode:
            editForm.shopPostalCode.trim(),
          shopCountry:
            editForm.shopCountry.trim(),
        }
      )

      toast.success(
        'Informations enregistrées'
      )

      setEditing(false)

      await Promise.all([
        fetchUsers(),
        openUserDetails(
          selectedUser.user._id
        ),
      ])
    } catch (error) {
      logger.error(
        'Failed to update user:',
        error,
        'Admin'
      )

      const err = error as {
        message?: string
      }

      toast.error(
        err.message ||
          'Impossible de modifier le compte'
      )
    } finally {
      setSaving(false)
    }
  }

  const askStatusChange = (user: User) => {
    const current = getUserStatus(user)

    const nextStatus: AccountStatus =
      current === 'active'
        ? 'disabled'
        : 'active'

    setPendingStatusChange({
      user,
      status: nextStatus,
    })
  }

  const confirmStatusChange = async () => {
    if (!pendingStatusChange) return

    const { user, status } =
      pendingStatusChange

    try {
      await api.patch(
        `/api/admin/users/${user._id}/status`,
        { status }
      )

      if (status === 'active') {
        toast.success(
          getUserStatus(user) === 'pending'
            ? 'Compte activé'
            : 'Compte réactivé'
        )
      } else {
        toast.success(
          'Compte désactivé'
        )
      }

      setPendingStatusChange(null)

      await fetchUsers()

      if (
        drawerOpen &&
        selectedUser?.user._id === user._id
      ) {
        await openUserDetails(user._id)
      }
    } catch (error) {
      logger.error(
        'Failed to change account status:',
        error,
        'Admin'
      )

      toast.error(
        'Impossible de modifier le statut du compte'
      )
    }
  }

  const selectedStatus =
    selectedUser
      ? selectedUser.user.accountStatus
      : null

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout userRole="admin">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">
              Utilisateurs
            </h1>

            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Gestion complète des comptes
              utilisateurs CONFIRMED.
            </p>
          </div>

          {/* Search and filters */}
          <div className="card p-4">
            <div className="flex flex-col xl:flex-row gap-3">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />

                <input
                  type="text"
                  value={searchTerm}
                  onChange={event =>
                    setSearchTerm(
                      event.target.value
                    )
                  }
                  placeholder="Nom, prénom, email, téléphone ou boutique..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={event => {
                  setStatusFilter(
                    event.target.value
                  )
                  setPage(1)
                }}
                className="px-4 py-2.5 rounded-lg border bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700"
              >
                <option value="all">
                  Tous les statuts
                </option>
                <option value="active">
                  Actifs
                </option>
                <option value="pending">
                  En attente
                </option>
                <option value="disabled">
                  Désactivés
                </option>
              </select>

              <select
                value={roleFilter}
                onChange={event => {
                  setRoleFilter(
                    event.target.value
                  )
                  setPage(1)
                }}
                className="px-4 py-2.5 rounded-lg border bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700"
              >
                <option value="all">
                  Tous les rôles
                </option>
                <option value="shop_owner">
                  Commerçants
                </option>
                <option value="operator">
                  Opérateurs
                </option>
                <option value="admin">
                  Admins
                </option>
              </select>
            </div>
          </div>

          {/* Users table */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2">
                <UsersIcon className="h-5 w-5" />
                Utilisateurs
              </h2>

              <span className="text-sm text-slate-500">
                {totalUsers} compte(s)
              </span>
            </div>

            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-14 animate-pulse rounded-lg bg-gray-100 dark:bg-slate-800"
                  />
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="p-10 text-center text-slate-500">
                Aucun utilisateur trouvé.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1250px]">
                  <thead className="bg-gray-50 dark:bg-slate-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Nom et prénom
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Téléphone
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Boutique
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Statut
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Inscription
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Dernière activité
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Commandes
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Plan
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                    {users.map(user => {
                      const status =
                        getUserStatus(user)

                      return (
                        <tr
                          key={user._id}
                          onClick={() =>
                            openUserDetails(
                              user._id
                            )
                          }
                          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50"
                        >
                          <td className="px-4 py-3 text-sm font-medium">
                            {getUserName(user)}

                            <div className="text-xs text-slate-500 mt-0.5">
                              {user.role.replace(
                                '_',
                                ' '
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                            {user.email}
                          </td>

                          <td className="px-4 py-3 text-sm">
                            {user.phoneNumber ||
                              '—'}
                          </td>

                          <td className="px-4 py-3 text-sm">
                            {user.shop?.name ||
                              '—'}
                          </td>

                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statusClasses(
                                status
                              )}`}
                            >
                              {statusLabel(status)}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-xs text-slate-500">
                            {formatDate(
                              user.createdAt
                            )}
                          </td>

                          <td className="px-4 py-3 text-xs text-slate-500">
                            {formatDate(
                              user.lastActivity
                            )}
                          </td>

                          <td className="px-4 py-3 text-sm font-medium">
                            {user.orderCount || 0}
                          </td>

                          <td
                            className="px-4 py-3"
                            onClick={event =>
                              event.stopPropagation()
                            }
                          >
                            {user.role ===
                            'shop_owner' ? (
                              <select
                                value={
                                  user.subscription
                                    ?.plan ||
                                  'starter'
                                }
                                onChange={event =>
                                  updateUserSubscription(
                                    user._id,
                                    event.target
                                      .value as SubscriptionPlan
                                  )
                                }
                                className="px-2 py-1 text-xs rounded border bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700"
                              >
                                <option value="starter">
                                  Starter
                                </option>
                                <option value="pro">
                                  Pro
                                </option>
                                <option value="business">
                                  Business
                                </option>
                                <option value="enterprise">
                                  Enterprise
                                </option>
                              </select>
                            ) : (
                              <span className="text-slate-400">
                                —
                              </span>
                            )}
                          </td>

                          <td
                            className="px-4 py-3"
                            onClick={event =>
                              event.stopPropagation()
                            }
                          >
                            <button
                              type="button"
                              onClick={() =>
                                askStatusChange(
                                  user
                                )
                              }
                              className={
                                status ===
                                'active'
                                  ? 'text-sm font-medium text-red-500 hover:text-red-600'
                                  : 'text-sm font-medium text-green-500 hover:text-green-600'
                              }
                            >
                              {status ===
                              'active'
                                ? 'Désactiver'
                                : status ===
                                    'pending'
                                  ? 'Activer'
                                  : 'Réactiver'}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() =>
                    setPage(value =>
                      Math.max(
                        value - 1,
                        1
                      )
                    )
                  }
                  className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-700 disabled:opacity-40"
                >
                  Précédent
                </button>

                <span className="text-sm text-slate-500">
                  Page {page} / {totalPages}
                </span>

                <button
                  type="button"
                  disabled={
                    page >= totalPages
                  }
                  onClick={() =>
                    setPage(value =>
                      Math.min(
                        value + 1,
                        totalPages
                      )
                    )
                  }
                  className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-700 disabled:opacity-40"
                >
                  Suivant
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Detail drawer */}
        {drawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <button
              type="button"
              aria-label="Fermer"
              className="absolute inset-0 bg-black/40"
              onClick={() =>
                setDrawerOpen(false)
              }
            />

            <div className="relative h-full w-full max-w-2xl overflow-y-auto bg-white dark:bg-slate-950 shadow-2xl">
              <div className="sticky top-0 z-10 bg-white dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">
                    Fiche utilisateur
                  </h2>

                  {selectedUser && (
                    <p className="text-sm text-slate-500 mt-1">
                      {selectedUser.user.firstName}{' '}
                      {selectedUser.user.lastName}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setDrawerOpen(false)
                  }
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {detailLoading ? (
                <div className="p-6 space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="h-16 animate-pulse rounded-lg bg-gray-100 dark:bg-slate-800"
                    />
                  ))}
                </div>
              ) : selectedUser ? (
                <div className="p-6 space-y-6">
                  {/* Status/actions */}
                  <div className="flex flex-wrap gap-3 items-center justify-between">
                    <span
                      className={`inline-flex px-3 py-1.5 rounded-full text-sm font-medium ${statusClasses(
                        selectedStatus ||
                          'disabled'
                      )}`}
                    >
                      {statusLabel(
                        selectedStatus ||
                          'disabled'
                      )}
                    </span>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setEditing(
                            value => !value
                          )
                        }
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 text-sm font-medium"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                        Modifier
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const listUser =
                            users.find(
                              item =>
                                item._id ===
                                selectedUser
                                  .user._id
                            )

                          if (listUser) {
                            askStatusChange(
                              listUser
                            )
                          }
                        }}
                        className={
                          selectedStatus ===
                          'active'
                            ? 'inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-500 text-sm font-medium'
                            : 'inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 text-green-500 text-sm font-medium'
                        }
                      >
                        {selectedStatus ===
                        'active' ? (
                          <>
                            <NoSymbolIcon className="w-4 h-4" />
                            Désactiver le compte
                          </>
                        ) : selectedStatus ===
                          'pending' ? (
                          <>
                            <CheckCircleIcon className="w-4 h-4" />
                            Activer le compte
                          </>
                        ) : (
                          <>
                            <ArrowPathIcon className="w-4 h-4" />
                            Réactiver le compte
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Personal information */}
                  <section className="card p-5">
                    <h3 className="font-semibold mb-4">
                      Informations personnelles
                    </h3>

                    {editing ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="space-y-1">
                          <span className="text-xs text-slate-500">
                            Prénom
                          </span>
                          <input
                            value={
                              editForm.firstName
                            }
                            onChange={event =>
                              setEditForm(
                                prev => ({
                                  ...prev,
                                  firstName:
                                    event.target
                                      .value,
                                })
                              )
                            }
                            className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700"
                          />
                        </label>

                        <label className="space-y-1">
                          <span className="text-xs text-slate-500">
                            Nom
                          </span>
                          <input
                            value={
                              editForm.lastName
                            }
                            onChange={event =>
                              setEditForm(
                                prev => ({
                                  ...prev,
                                  lastName:
                                    event.target
                                      .value,
                                })
                              )
                            }
                            className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700"
                          />
                        </label>

                        <label className="space-y-1 md:col-span-2">
                          <span className="text-xs text-slate-500">
                            Email
                          </span>
                          <input
                            type="email"
                            value={editForm.email}
                            onChange={event =>
                              setEditForm(
                                prev => ({
                                  ...prev,
                                  email:
                                    event.target
                                      .value,
                                })
                              )
                            }
                            className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700"
                          />
                        </label>

                        <label className="space-y-1">
                          <span className="text-xs text-slate-500">
                            Téléphone
                          </span>
                          <input
                            value={editForm.phoneNumber}
                            onChange={event =>
                              setEditForm(prev => ({
                                ...prev,
                                phoneNumber:
                                  event.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700"
                          />
                        </label>

                        <label className="space-y-1">
                          <span className="text-xs text-slate-500">
                            WhatsApp
                          </span>
                          <input
                            value={editForm.whatsappNumber}
                            onChange={event =>
                              setEditForm(prev => ({
                                ...prev,
                                whatsappNumber:
                                  event.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700"
                          />
                        </label>

                        <label className="space-y-1">
                          <span className="text-xs text-slate-500">
                            Pays
                          </span>
                          <input
                            value={editForm.country}
                            onChange={event =>
                              setEditForm(prev => ({
                                ...prev,
                                country:
                                  event.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700"
                          />
                        </label>

                        <label className="space-y-1">
                          <span className="text-xs text-slate-500">
                            Rôle
                          </span>
                          <select
                            value={editForm.role}
                            onChange={event =>
                              setEditForm(prev => ({
                                ...prev,
                                role:
                                  event.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700"
                          >
                            <option value="shop_owner">
                              Commerçant
                            </option>
                            <option value="operator">
                              Opérateur
                            </option>
                            <option value="admin">
                              Administrateur
                            </option>
                          </select>
                        </label>

                        <label className="space-y-1 md:col-span-2">
                          <span className="text-xs text-slate-500">
                            Nouveau mot de passe
                          </span>
                          <input
                            type="password"
                            autoComplete="new-password"
                            value={editForm.password}
                            onChange={event =>
                              setEditForm(prev => ({
                                ...prev,
                                password:
                                  event.target.value,
                              }))
                            }
                            placeholder="Laisser vide pour conserver le mot de passe actuel"
                            className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700"
                          />
                          <p className="text-xs text-slate-400">
                            Minimum 6 caractères. Le mot de passe actuel n&apos;est jamais affiché.
                          </p>
                        </label>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-slate-500">
                            Nom
                          </span>
                          <p className="font-medium mt-1">
                            {
                              selectedUser.user
                                .lastName
                            }
                          </p>
                        </div>

                        <div>
                          <span className="text-slate-500">
                            Prénom
                          </span>
                          <p className="font-medium mt-1">
                            {
                              selectedUser.user
                                .firstName
                            }
                          </p>
                        </div>

                        <div>
                          <span className="text-slate-500 flex items-center gap-1">
                            <EnvelopeIcon className="w-4 h-4" />
                            Email
                          </span>
                          <p className="font-medium mt-1 break-all">
                            {
                              selectedUser.user
                                .email
                            }
                          </p>
                        </div>

                        <div>
                          <span className="text-slate-500 flex items-center gap-1">
                            <PhoneIcon className="w-4 h-4" />
                            Téléphone
                          </span>
                          <p className="font-medium mt-1">
                            {selectedUser.user
                              .phoneNumber || '—'}
                          </p>
                        </div>

                        <div>
                          <span className="text-slate-500">
                            WhatsApp
                          </span>
                          <p className="font-medium mt-1">
                            {selectedUser.user
                              .whatsappNumber || '—'}
                          </p>
                        </div>

                        <div>
                          <span className="text-slate-500">
                            Pays
                          </span>
                          <p className="font-medium mt-1">
                            {selectedUser.user
                              .country || '—'}
                          </p>
                        </div>

                        <div>
                          <span className="text-slate-500">
                            Rôle
                          </span>
                          <p className="font-medium mt-1">
                            {selectedUser.user.role ===
                            'shop_owner'
                              ? 'Commerçant'
                              : selectedUser.user.role ===
                                  'operator'
                                ? 'Opérateur'
                                : 'Administrateur'}
                          </p>
                        </div>

                        <div>
                          <span className="text-slate-500 flex items-center gap-1">
                            <CalendarDaysIcon className="w-4 h-4" />
                            Création du compte
                          </span>
                          <p className="font-medium mt-1">
                            {formatDate(
                              selectedUser.user
                                .createdAt
                            )}
                          </p>
                        </div>

                        <div>
                          <span className="text-slate-500">
                            Dernière connexion
                          </span>
                          <p className="font-medium mt-1">
                            {formatDate(
                              selectedUser.user
                                .lastLogin
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </section>

                  {/* Shop */}
                  <section className="card p-5">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <BuildingStorefrontIcon className="w-5 h-5" />
                      Informations boutique
                    </h3>

                    {editing &&
                    selectedUser.shop._id ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        <label className="space-y-1 md:col-span-2">
                          <span className="text-xs text-slate-500">
                            Nom de la boutique
                          </span>
                          <input
                            value={editForm.shopName}
                            onChange={event =>
                              setEditForm(prev => ({
                                ...prev,
                                shopName:
                                  event.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700"
                          />
                        </label>

                        <label className="space-y-1 md:col-span-2">
                          <span className="text-xs text-slate-500">
                            URL du logo
                          </span>
                          <input
                            value={editForm.shopLogoUrl}
                            onChange={event =>
                              setEditForm(prev => ({
                                ...prev,
                                shopLogoUrl:
                                  event.target.value,
                              }))
                            }
                            placeholder="https://..."
                            className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700"
                          />
                        </label>

                        <label className="space-y-1">
                          <span className="text-xs text-slate-500">
                            Email boutique
                          </span>
                          <input
                            type="email"
                            value={editForm.shopEmail}
                            onChange={event =>
                              setEditForm(prev => ({
                                ...prev,
                                shopEmail:
                                  event.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700"
                          />
                        </label>

                        <label className="space-y-1">
                          <span className="text-xs text-slate-500">
                            Téléphone boutique
                          </span>
                          <input
                            value={editForm.shopPhone}
                            onChange={event =>
                              setEditForm(prev => ({
                                ...prev,
                                shopPhone:
                                  event.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700"
                          />
                        </label>

                        <label className="space-y-1 md:col-span-2">
                          <span className="text-xs text-slate-500">
                            WhatsApp boutique
                          </span>
                          <input
                            value={editForm.shopWhatsapp}
                            onChange={event =>
                              setEditForm(prev => ({
                                ...prev,
                                shopWhatsapp:
                                  event.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700"
                          />
                        </label>

                        <label className="space-y-1 md:col-span-2">
                          <span className="text-xs text-slate-500">
                            Adresse
                          </span>
                          <input
                            value={editForm.shopStreet}
                            onChange={event =>
                              setEditForm(prev => ({
                                ...prev,
                                shopStreet:
                                  event.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700"
                          />
                        </label>

                        <label className="space-y-1">
                          <span className="text-xs text-slate-500">
                            Ville
                          </span>
                          <input
                            value={editForm.shopCity}
                            onChange={event =>
                              setEditForm(prev => ({
                                ...prev,
                                shopCity:
                                  event.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700"
                          />
                        </label>

                        <label className="space-y-1">
                          <span className="text-xs text-slate-500">
                            Gouvernorat
                          </span>
                          <input
                            value={editForm.shopGovernorate}
                            onChange={event =>
                              setEditForm(prev => ({
                                ...prev,
                                shopGovernorate:
                                  event.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700"
                          />
                        </label>

                        <label className="space-y-1">
                          <span className="text-xs text-slate-500">
                            Code postal
                          </span>
                          <input
                            value={editForm.shopPostalCode}
                            onChange={event =>
                              setEditForm(prev => ({
                                ...prev,
                                shopPostalCode:
                                  event.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700"
                          />
                        </label>

                        <label className="space-y-1">
                          <span className="text-xs text-slate-500">
                            Pays
                          </span>
                          <input
                            value={editForm.shopCountry}
                            onChange={event =>
                              setEditForm(prev => ({
                                ...prev,
                                shopCountry:
                                  event.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700"
                          />
                        </label>

                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">

                        <div>
                          <span className="text-slate-500">
                            Nom
                          </span>
                          <p className="font-medium mt-1">
                            {selectedUser.shop.name || '—'}
                          </p>
                        </div>

                        <div>
                          <span className="text-slate-500">
                            Logo
                          </span>
                          <p className="font-medium mt-1 break-all">
                            {selectedUser.shop.logoUrl || '—'}
                          </p>
                        </div>

                        <div>
                          <span className="text-slate-500">
                            Email
                          </span>
                          <p className="font-medium mt-1 break-all">
                            {selectedUser.shop
                              .contact?.email || '—'}
                          </p>
                        </div>

                        <div>
                          <span className="text-slate-500">
                            Téléphone
                          </span>
                          <p className="font-medium mt-1">
                            {selectedUser.shop
                              .contact?.phone || '—'}
                          </p>
                        </div>

                        <div>
                          <span className="text-slate-500">
                            WhatsApp
                          </span>
                          <p className="font-medium mt-1">
                            {selectedUser.shop
                              .contact?.whatsapp || '—'}
                          </p>
                        </div>

                        <div>
                          <span className="text-slate-500">
                            Adresse
                          </span>
                          <p className="font-medium mt-1">
                            {selectedUser.shop
                              .address?.street || '—'}
                          </p>
                        </div>

                        <div>
                          <span className="text-slate-500">
                            Ville
                          </span>
                          <p className="font-medium mt-1">
                            {selectedUser.shop
                              .address?.city || '—'}
                          </p>
                        </div>

                        <div>
                          <span className="text-slate-500">
                            Gouvernorat
                          </span>
                          <p className="font-medium mt-1">
                            {selectedUser.shop
                              .address?.governorate || '—'}
                          </p>
                        </div>

                        <div>
                          <span className="text-slate-500">
                            Code postal
                          </span>
                          <p className="font-medium mt-1">
                            {selectedUser.shop
                              .address?.postalCode || '—'}
                          </p>
                        </div>

                        <div>
                          <span className="text-slate-500">
                            Pays
                          </span>
                          <p className="font-medium mt-1">
                            {selectedUser.shop
                              .address?.country || '—'}
                          </p>
                        </div>

                        <div>
                          <span className="text-slate-500">
                            Plateforme / CMS
                          </span>
                          <p className="font-medium mt-1 capitalize">
                            {selectedUser.shop
                              .platform || '—'}
                          </p>
                        </div>

                        <div>
                          <span className="text-slate-500">
                            Domaine
                          </span>
                          <p className="font-medium mt-1 break-all">
                            {selectedUser.shop
                              .domain || '—'}
                          </p>
                        </div>

                        <div>
                          <span className="text-slate-500">
                            Date de création
                          </span>
                          <p className="font-medium mt-1">
                            {formatDate(
                              selectedUser.shop.createdAt
                            )}
                          </p>
                        </div>

                        <div>
                          <span className="text-slate-500">
                            Statut boutique
                          </span>
                          <p className="font-medium mt-1">
                            {selectedUser.shop._id
                              ? selectedUser.shop.isActive
                                ? 'Active'
                                : 'Inactive'
                              : '—'}
                          </p>
                        </div>

                      </div>
                    )}
                  </section>

                  {/* Activity */}
                  <section className="card p-5">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                      <div>
                        <h3 className="font-semibold">
                          Activité
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Données réelles selon la période sélectionnée
                        </p>
                      </div>

                      <select
                        value={activityPeriod}
                        onChange={event => {
                          const nextPeriod =
                            event.target
                              .value as ActivityPeriod

                          void changeActivityPeriod(
                            nextPeriod
                          )
                        }}
                        className="px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-sm"
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
                        <option value="previous_month">
                          Mois précédent
                        </option>
                        <option value="custom">
                          Période personnalisée
                        </option>
                      </select>
                    </div>

                    {activityPeriod ===
                      'custom' && (
                      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 mb-5">
                        <input
                          type="date"
                          value={activityFrom}
                          onChange={event =>
                            setActivityFrom(
                              event.target.value
                            )
                          }
                          className="px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-sm"
                        />

                        <input
                          type="date"
                          value={activityTo}
                          onChange={event =>
                            setActivityTo(
                              event.target.value
                            )
                          }
                          className="px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-sm"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            void applyCustomActivityPeriod()
                          }
                          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium"
                        >
                          Appliquer
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        [
                          'Commandes totales',
                          selectedUser.stats
                            .totalOrders,
                        ],
                        [
                          'Confirmées',
                          selectedUser.stats
                            .confirmedOrders,
                        ],
                        [
                          'Livrées',
                          selectedUser.stats
                            .deliveredOrders,
                        ],
                        [
                          'Annulées',
                          selectedUser.stats
                            .cancelledOrders,
                        ],
                        [
                          'Reportées',
                          selectedUser.stats
                            .postponedOrders,
                        ],
                        [
                          'Retours',
                          selectedUser.stats
                            .returnedOrders,
                        ],
                        [
                          'Échecs livraison',
                          selectedUser.stats
                            .failedDeliveryOrders,
                        ],
                        [
                          'Tentatives',
                          selectedUser.stats
                            .attempts,
                        ],
                        [
                          'Taux confirmation',
                          `${selectedUser.stats.confirmationRate.toFixed(
                            1
                          )}%`,
                        ],
                        [
                          'Taux livraison',
                          `${selectedUser.stats.deliveryRate.toFixed(
                            1
                          )}%`,
                        ],
                        [
                          'Taux retour',
                          `${selectedUser.stats.returnRate.toFixed(
                            1
                          )}%`,
                        ],
                        [
                          'Taux annulation',
                          `${selectedUser.stats.cancellationRate.toFixed(
                            1
                          )}%`,
                        ],
                        [
                          'Revenu livré',
                          `${selectedUser.stats.deliveredRevenue.toFixed(
                            2
                          )} TND`,
                        ],
                        [
                          'Panier moyen livré',
                          `${selectedUser.stats.deliveredAverageOrderValue.toFixed(
                            2
                          )} TND`,
                        ],
                        [
                          'Score IA moyen',
                          selectedUser.stats
                            .averageAiScore !==
                          null
                            ? selectedUser.stats.averageAiScore.toFixed(
                                1
                              )
                            : '—',
                        ],
                      ].map(([label, value]) => (
                        <div
                          key={String(label)}
                          className="rounded-lg bg-gray-50 dark:bg-slate-900 p-3"
                        >
                          <p className="text-xs text-slate-500">
                            {label}
                          </p>

                          <p className="text-lg font-semibold mt-1">
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {editing && (
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() =>
                          setEditing(false)
                        }
                        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700"
                      >
                        Annuler
                      </button>

                      <button
                        type="button"
                        disabled={saving}
                        onClick={saveUser}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"
                      >
                        {saving
                          ? 'Enregistrement...'
                          : 'Enregistrer les modifications'}
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Status confirmation modal */}
        {pendingStatusChange && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <button
              type="button"
              aria-label="Fermer"
              className="absolute inset-0 bg-black/50"
              onClick={() =>
                setPendingStatusChange(
                  null
                )
              }
            />

            <div className="relative w-full max-w-md rounded-xl bg-white dark:bg-slate-900 shadow-2xl p-6">
              <h3 className="text-lg font-semibold">
                {pendingStatusChange.status ===
                'disabled'
                  ? 'Désactiver ce compte ?'
                  : getUserStatus(
                        pendingStatusChange.user
                      ) === 'pending'
                    ? 'Activer ce compte ?'
                    : 'Réactiver ce compte ?'}
              </h3>

              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                {pendingStatusChange.status ===
                'disabled'
                  ? "L'utilisateur ne pourra plus accéder à son espace CONFIRMED tant que son compte sera désactivé. Ses données et ses commandes seront conservées."
                  : "L'utilisateur pourra de nouveau accéder à son espace CONFIRMED."}
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setPendingStatusChange(
                      null
                    )
                  }
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700"
                >
                  Annuler
                </button>

                <button
                  type="button"
                  onClick={
                    confirmStatusChange
                  }
                  className={
                    pendingStatusChange.status ===
                    'disabled'
                      ? 'px-4 py-2 rounded-lg bg-red-600 text-white'
                      : 'px-4 py-2 rounded-lg bg-green-600 text-white'
                  }
                >
                  {pendingStatusChange.status ===
                  'disabled'
                    ? 'Confirmer la désactivation'
                    : 'Confirmer'}
                </button>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}
