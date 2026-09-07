'use client'

import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import {
  UserGroupIcon,
  PlusIcon,
  PencilSquareIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

import DashboardLayout from '@/components/dashboard/DashboardLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import api from '@/lib/api'
import logger from '@/lib/logger'
import toast from 'react-hot-toast'

type AvailabilityStatus =
  | 'available'
  | 'busy'
  | 'offline'
  | 'disabled'

interface ShopOption {
  _id: string
  name: string
}

interface Operator {
  _id: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string

  isActive: boolean
  accountStatus:
    | 'active'
    | 'pending'
    | 'disabled'

  availabilityStatus:
    AvailabilityStatus

  lastLogin?: string | null
  lastActiveAt?: string | null

  shop?: {
    _id: string
    name: string
  } | null

  assignedOrders: number
  processedOrders: number
  confirmedOrders: number
}

interface FormState {
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  password: string
  shopId: string
  status: 'active' | 'disabled'
}

const emptyForm: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  password: '',
  shopId: '',
  status: 'active',
}

function statusLabel(
  status: AvailabilityStatus
): string {
  switch (status) {
    case 'available':
      return 'Disponible'
    case 'busy':
      return 'Occupé'
    case 'offline':
      return 'Hors ligne'
    case 'disabled':
      return 'Désactivé'
  }
}

function statusClasses(
  status: AvailabilityStatus
): string {
  switch (status) {
    case 'available':
      return 'bg-green-500/10 text-green-500'
    case 'busy':
      return 'bg-yellow-500/10 text-yellow-500'
    case 'offline':
      return 'bg-slate-500/10 text-slate-400'
    case 'disabled':
      return 'bg-red-500/10 text-red-500'
  }
}

function formatLastActivity(
  value?: string | null
): string {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return new Intl.DateTimeFormat(
    'fr-FR',
    {
      dateStyle: 'short',
      timeStyle: 'short',
    }
  ).format(date)
}

export default function AdminOperatorsPage() {
  const [
    operators,
    setOperators,
  ] = useState<Operator[]>([])

  const [shops, setShops] =
    useState<ShopOption[]>([])

  const [loading, setLoading] =
    useState(true)

  const [search, setSearch] =
    useState('')

  const [statusFilter, setStatusFilter] =
    useState('all')

  const [modalMode, setModalMode] =
    useState<'create' | 'edit' | null>(
      null
    )

  const [
    selectedOperator,
    setSelectedOperator,
  ] = useState<Operator | null>(null)

  const [form, setForm] =
    useState<FormState>(emptyForm)

  const [saving, setSaving] =
    useState(false)

  const [
    statusTarget,
    setStatusTarget,
  ] = useState<Operator | null>(null)

  const fetchOperators =
    useCallback(async () => {
      setLoading(true)

      try {
        const response =
          await api.get(
            '/api/admin/operators'
          )

        setOperators(
          response.data.operators || []
        )

        setShops(
          response.data.shops || []
        )
      } catch (error) {
        logger.error(
          'Failed to fetch operators:',
          error,
          'Admin'
        )

        toast.error(
          'Impossible de charger les opérateurs'
        )
      } finally {
        setLoading(false)
      }
    }, [])

  useEffect(() => {
    fetchOperators()
  }, [fetchOperators])

  // Les statuts disponibilité peuvent changer
  // sans recharger manuellement la page.
  useEffect(() => {
    const intervalId =
      window.setInterval(
        fetchOperators,
        30000
      )

    return () =>
      window.clearInterval(
        intervalId
      )
  }, [fetchOperators])

  const filteredOperators =
    operators.filter(operator => {
      const searchValue =
        search.trim().toLowerCase()

      const fullName =
        `${operator.firstName} ${operator.lastName}`.toLowerCase()

      const matchesSearch =
        !searchValue ||
        fullName.includes(searchValue) ||
        operator.email
          .toLowerCase()
          .includes(searchValue) ||
        operator.phoneNumber
          ?.toLowerCase()
          .includes(searchValue) ||
        operator.shop?.name
          ?.toLowerCase()
          .includes(searchValue)

      const matchesStatus =
        statusFilter === 'all' ||
        operator.availabilityStatus ===
          statusFilter

      return (
        matchesSearch &&
        matchesStatus
      )
    })

  const openCreate = () => {
    setSelectedOperator(null)

    setForm({
      ...emptyForm,
      shopId:
        shops[0]?._id || '',
    })

    setModalMode('create')
  }

  const openEdit = (
    operator: Operator
  ) => {
    setSelectedOperator(operator)

    setForm({
      firstName:
        operator.firstName || '',
      lastName:
        operator.lastName || '',
      email:
        operator.email || '',
      phoneNumber:
        operator.phoneNumber || '',
      password: '',
      shopId:
        operator.shop?._id || '',
      status:
        operator.accountStatus ===
        'disabled'
          ? 'disabled'
          : 'active',
    })

    setModalMode('edit')
  }

  const closeModal = () => {
    if (saving) return

    setModalMode(null)
    setSelectedOperator(null)
    setForm(emptyForm)
  }

  const saveOperator = async () => {
    if (
      !form.firstName.trim() ||
      !form.lastName.trim() ||
      !form.email.trim() ||
      !form.phoneNumber.trim() ||
      !form.shopId
    ) {
      toast.error(
        'Veuillez remplir tous les champs obligatoires'
      )
      return
    }

    if (
      modalMode === 'create' &&
      form.password.length < 6
    ) {
      toast.error(
        'Le mot de passe doit contenir au moins 6 caractères'
      )
      return
    }

    if (
      modalMode === 'edit' &&
      form.password &&
      form.password.length < 6
    ) {
      toast.error(
        'Le mot de passe doit contenir au moins 6 caractères'
      )
      return
    }

    setSaving(true)

    try {
      if (
        modalMode === 'create'
      ) {
        await api.post(
          '/api/admin/operators',
          form
        )

        toast.success(
          'Opérateur créé'
        )
      } else if (
        selectedOperator
      ) {
        await api.patch(
          `/api/admin/operators/${selectedOperator._id}`,
          {
            firstName:
              form.firstName,
            lastName:
              form.lastName,
            email: form.email,
            phoneNumber:
              form.phoneNumber,
            shopId: form.shopId,
            ...(form.password
              ? {
                  password:
                    form.password,
                }
              : {}),
          }
        )

        toast.success(
          'Opérateur modifié'
        )
      }

      closeModal()
      await fetchOperators()
    } catch (error) {
      logger.error(
        'Failed to save operator:',
        error,
        'Admin'
      )

      const err = error as {
        message?: string
      }

      toast.error(
        err.message ||
          "Impossible d'enregistrer l'opérateur"
      )
    } finally {
      setSaving(false)
    }
  }

  const changeOperatorStatus =
    async () => {
      if (!statusTarget) return

      const newStatus =
        statusTarget.accountStatus ===
          'disabled'
          ? 'active'
          : 'disabled'

      try {
        await api.patch(
          `/api/admin/users/${statusTarget._id}/status`,
          {
            status: newStatus,
          }
        )

        toast.success(
          newStatus === 'active'
            ? 'Opérateur réactivé'
            : 'Opérateur désactivé'
        )

        setStatusTarget(null)
        await fetchOperators()
      } catch (error) {
        logger.error(
          'Failed to change operator status:',
          error,
          'Admin'
        )

        toast.error(
          'Impossible de modifier le statut'
        )
      }
    }

  return (
    <ProtectedRoute
      allowedRoles={['admin']}
    >
      <DashboardLayout
        userRole="admin"
      >
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">
                Opérateurs
              </h1>

              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Création, disponibilité et
                suivi des performances des
                opérateurs.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
            >
              <PlusIcon className="w-5 h-5" />
              Créer un opérateur
            </button>
          </div>

          {/* Filters */}
          <div className="card p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />

                <input
                  type="text"
                  value={search}
                  onChange={event =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Nom, email, téléphone ou boutique..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={event =>
                  setStatusFilter(
                    event.target.value
                  )
                }
                className="px-4 py-2.5 rounded-lg border bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700"
              >
                <option value="all">
                  Tous les statuts
                </option>
                <option value="available">
                  Disponibles
                </option>
                <option value="busy">
                  Occupés
                </option>
                <option value="offline">
                  Hors ligne
                </option>
                <option value="disabled">
                  Désactivés
                </option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2">
                <UserGroupIcon className="w-5 h-5" />
                Opérateurs
              </h2>

              <span className="text-sm text-slate-500">
                {
                  filteredOperators.length
                }{' '}
                opérateur(s)
              </span>
            </div>

            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map(
                  (_, index) => (
                    <div
                      key={index}
                      className="h-14 rounded-lg animate-pulse bg-gray-100 dark:bg-slate-800"
                    />
                  )
                )}
              </div>
            ) : filteredOperators.length ===
              0 ? (
              <div className="p-10 text-center text-slate-500">
                Aucun opérateur trouvé.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px]">
                  <thead className="bg-gray-50 dark:bg-slate-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Opérateur
                      </th>

                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Email
                      </th>

                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Boutique
                      </th>

                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Statut
                      </th>

                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Assignées
                      </th>

                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Traitées
                      </th>

                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Confirmées
                      </th>

                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Dernière activité
                      </th>

                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                    {filteredOperators.map(
                      operator => (
                        <tr
                          key={operator._id}
                          className="hover:bg-gray-50 dark:hover:bg-slate-800/50"
                        >
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium">
                              {
                                operator.firstName
                              }{' '}
                              {
                                operator.lastName
                              }
                            </p>

                            <p className="text-xs text-slate-500 mt-0.5">
                              {
                                operator.phoneNumber
                              }
                            </p>
                          </td>

                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                            {
                              operator.email
                            }
                          </td>

                          <td className="px-4 py-3 text-sm">
                            {operator.shop
                              ?.name || '—'}
                          </td>

                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statusClasses(
                                operator.availabilityStatus
                              )}`}
                            >
                              {statusLabel(
                                operator.availabilityStatus
                              )}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-sm font-semibold">
                            {
                              operator.assignedOrders
                            }
                          </td>

                          <td className="px-4 py-3 text-sm font-semibold">
                            {
                              operator.processedOrders
                            }
                          </td>

                          <td className="px-4 py-3 text-sm font-semibold">
                            {
                              operator.confirmedOrders
                            }
                          </td>

                          <td className="px-4 py-3 text-xs text-slate-500">
                            {formatLastActivity(
                              operator.lastActiveAt ||
                                operator.lastLogin
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() =>
                                  openEdit(
                                    operator
                                  )
                                }
                                className="inline-flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600"
                              >
                                <PencilSquareIcon className="w-4 h-4" />
                                Modifier
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setStatusTarget(
                                    operator
                                  )
                                }
                                className={
                                  operator.accountStatus ===
                                  'disabled'
                                    ? 'text-sm text-green-500 hover:text-green-600'
                                    : 'text-sm text-red-500 hover:text-red-600'
                                }
                              >
                                {operator.accountStatus ===
                                'disabled'
                                  ? 'Réactiver'
                                  : 'Désactiver'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Create / edit modal */}
        {modalMode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
              type="button"
              aria-label="Fermer"
              className="absolute inset-0 bg-black/50"
              onClick={closeModal}
            />

            <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden rounded-xl bg-white dark:bg-slate-950 shadow-2xl border border-gray-200 dark:border-slate-800">
              <div className="shrink-0 bg-white dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">
                    {modalMode ===
                    'create'
                      ? 'Créer un opérateur'
                      : "Modifier l'opérateur"}
                  </h2>

                  <p className="text-sm text-slate-500 mt-1">
                    {modalMode ===
                    'create'
                      ? "L'opérateur disposera de son propre accès à CONFIRMED."
                      : 'Modifiez les informations du compte.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="space-y-1">
                  <span className="text-sm">
                    Prénom *
                  </span>

                  <input
                    value={
                      form.firstName
                    }
                    onChange={event =>
                      setForm(prev => ({
                        ...prev,
                        firstName:
                          event.target
                            .value,
                      }))
                    }
                    className="w-full px-3 py-2.5 rounded-lg border bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm">
                    Nom *
                  </span>

                  <input
                    value={
                      form.lastName
                    }
                    onChange={event =>
                      setForm(prev => ({
                        ...prev,
                        lastName:
                          event.target
                            .value,
                      }))
                    }
                    className="w-full px-3 py-2.5 rounded-lg border bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700"
                  />
                </label>

                <label className="space-y-1 md:col-span-2">
                  <span className="text-sm">
                    Email *
                  </span>

                  <input
                    type="email"
                    value={form.email}
                    onChange={event =>
                      setForm(prev => ({
                        ...prev,
                        email:
                          event.target
                            .value,
                      }))
                    }
                    className="w-full px-3 py-2.5 rounded-lg border bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700"
                  />
                </label>

                <label className="space-y-1 md:col-span-2">
                  <span className="text-sm">
                    Téléphone *
                  </span>

                  <input
                    value={
                      form.phoneNumber
                    }
                    onChange={event =>
                      setForm(prev => ({
                        ...prev,
                        phoneNumber:
                          event.target
                            .value,
                      }))
                    }
                    className="w-full px-3 py-2.5 rounded-lg border bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700"
                  />
                </label>

                <label className="space-y-1 md:col-span-2">
                  <span className="text-sm">
                    Boutique associée *
                  </span>

                  <select
                    value={form.shopId}
                    onChange={event =>
                      setForm(prev => ({
                        ...prev,
                        shopId:
                          event.target
                            .value,
                      }))
                    }
                    className="w-full px-3 py-2.5 rounded-lg border bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700"
                  >
                    <option value="">
                      Sélectionner une boutique
                    </option>

                    {shops.map(shop => (
                      <option
                        key={shop._id}
                        value={shop._id}
                      >
                        {shop.name}
                      </option>
                    ))}
                  </select>

                  <p className="text-xs text-slate-500">
                    Nécessaire pour que
                    l&apos;opérateur puisse
                    accéder à sa file de
                    commandes.
                  </p>
                </label>

                <label className="space-y-1 md:col-span-2">
                  <span className="text-sm">
                    {modalMode ===
                    'create'
                      ? 'Mot de passe *'
                      : 'Nouveau mot de passe'}
                  </span>

                  <input
                    type="password"
                    value={
                      form.password
                    }
                    onChange={event =>
                      setForm(prev => ({
                        ...prev,
                        password:
                          event.target
                            .value,
                      }))
                    }
                    placeholder={
                      modalMode ===
                      'edit'
                        ? 'Laisser vide pour ne pas modifier'
                        : 'Minimum 6 caractères'
                    }
                    className="w-full px-3 py-2.5 rounded-lg border bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700"
                  />
                </label>

                {modalMode ===
                  'create' && (
                  <label className="space-y-1 md:col-span-2">
                    <span className="text-sm">
                      Statut du compte
                    </span>

                    <select
                      value={
                        form.status
                      }
                      onChange={event =>
                        setForm(prev => ({
                          ...prev,
                          status:
                            event.target
                              .value as
                              | 'active'
                              | 'disabled',
                        }))
                      }
                      className="w-full px-3 py-2.5 rounded-lg border bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700"
                    >
                      <option value="active">
                        Actif
                      </option>

                      <option value="disabled">
                        Désactivé
                      </option>
                    </select>
                  </label>
                )}
              </div>

              <div className="shrink-0 bg-white dark:bg-slate-950 px-6 py-4 border-t border-gray-200 dark:border-slate-800 flex justify-end gap-3 shadow-[0_-8px_20px_rgba(0,0,0,0.08)]">
                <button
                  type="button"
                  disabled={saving}
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700"
                >
                  Annuler
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={saveOperator}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"
                >
                  {saving
                    ? 'Enregistrement...'
                    : modalMode ===
                        'create'
                      ? 'Créer l’opérateur'
                      : 'Enregistrer les modifications'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Disable confirmation */}
        {statusTarget && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <button
              type="button"
              aria-label="Fermer"
              className="absolute inset-0 bg-black/50"
              onClick={() =>
                setStatusTarget(null)
              }
            />

            <div className="relative w-full max-w-md rounded-xl bg-white dark:bg-slate-900 shadow-2xl p-6">
              <h3 className="text-lg font-semibold">
                {statusTarget.accountStatus ===
                'disabled'
                  ? 'Réactiver cet opérateur ?'
                  : 'Désactiver cet opérateur ?'}
              </h3>

              <p className="mt-3 text-sm text-slate-500">
                {statusTarget.accountStatus ===
                'disabled'
                  ? "L'opérateur pourra de nouveau se connecter à CONFIRMED."
                  : "L'opérateur ne pourra plus accéder à son interface. Ses commandes et son historique seront conservés."}
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setStatusTarget(null)
                  }
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700"
                >
                  Annuler
                </button>

                <button
                  type="button"
                  onClick={
                    changeOperatorStatus
                  }
                  className={
                    statusTarget.accountStatus ===
                    'disabled'
                      ? 'px-4 py-2 rounded-lg bg-green-600 text-white'
                      : 'px-4 py-2 rounded-lg bg-red-600 text-white'
                  }
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}
