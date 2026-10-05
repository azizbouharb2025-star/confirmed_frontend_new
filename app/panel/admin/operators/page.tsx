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
  | 'active'
  | 'available'
  | 'busy'
  | 'inactive'
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

  // Boutique principale historique.
  shop?: ShopOption | null

  // Toutes les boutiques autorisées.
  shops?: ShopOption[]

  assignedOrders: number
  processedOrders: number
  confirmedOrders: number
}

type OperatorDetailMetric =
  | 'taken'
  | 'processed'
  | 'confirmed'
  | 'cancelled'
  | 'postponed'
  | 'attempts'
  | 'active'
  | 'busy'
  | 'available'
  | 'inactive'

interface OperatorKpiResponse {
  operator: {
    _id: string
    firstName: string
    lastName: string
    email: string
  }

  period: {
    key: string
    from: string
    to: string
    shopId?: string | null
  }

  kpis: {
    takenOrders: number
    processedOrders: number
    confirmedOrders: number
    cancelledOrders: number
    postponedOrders: number
    attempts: number
    confirmationRate: number
    averageTreatmentSeconds: number | null
    averagePickupSeconds: number | null
    averageBetweenOrdersSeconds: number | null
    connectedSeconds: number
    activeSeconds: number | null
    processingSeconds: number | null
    waitingSeconds: number | null
    inactiveSeconds: number | null
    activityRate: number | null
    processedPerActiveHour: number | null
  }

  businessKpis: {
    totalOrders: number
    confirmedOrders: number
    cancelledOrders: number
    postponedOrders: number
    deliveredOrders: number
    returnedOrders: number
    failedDeliveryOrders: number
    confirmationRate: number
    deliveryRate: number
    deliveredRevenue: number
    averageAiScore: number | null
    returnRate: number
    cancellationRate: number
    failedDeliveryRate: number
    deliveredAverageOrderValue: number
  } | null

  dataCoverage: {
    trackedWorkCycles: number
    treatmentTimingAvailable: boolean
    pickupTimingSamples: number
    betweenOrdersSamples: number
    sessionCount: number
    activityIntervals: number
    activityTrackingAvailable: boolean
  }
  details: {
    activityIntervals: Array<{
      _id: string
      state:
        | 'available'
        | 'active'
        | 'busy'
        | 'inactive'
      startedAt: string
      endedAt: string
      durationSeconds: number
    }>

    orders: Array<{
      _id: string
      orderId: string
      customerName: string

      shop?: {
        _id: string
        name: string
      } | null

      currentStatus: string

      metrics: {
        taken: boolean
        processed: boolean
        confirmed: boolean
        cancelled: boolean
        postponed: boolean
        attempts: number
      }

      timing: {
        takenAt?: string | null
        startedAt?: string | null
        endedAt?: string | null
        durationSeconds?: number | null
      }

      lastActionAt?: string | null
      finalResult?: string | null
    }>
  }
}

interface FormState {
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  password: string
  shopIds: string[]
  status: 'active' | 'disabled'
}

const emptyForm: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  password: '',
  shopIds: [],
  status: 'active',
}

function statusLabel(
  status: AvailabilityStatus
): string {
  switch (status) {
    case 'active':
      return 'Actif'
    case 'available':
      return 'Disponible'
    case 'busy':
      return 'En traitement'
    case 'inactive':
      return 'Inactif'
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
    case 'active':
      return 'bg-emerald-500/10 text-emerald-500'
    case 'available':
      return 'bg-green-500/10 text-green-500'
    case 'busy':
      return 'bg-amber-500/10 text-amber-500'
    case 'inactive':
      return 'bg-orange-500/10 text-orange-500'
    case 'offline':
      return 'bg-slate-500/10 text-slate-400'
    case 'disabled':
      return 'bg-red-500/10 text-red-500'
  }
}

function getOperatorShops(
  operator: Operator
): ShopOption[] {
  if (
    Array.isArray(operator.shops) &&
    operator.shops.length > 0
  ) {
    return operator.shops
  }

  return operator.shop
    ? [operator.shop]
    : []
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

function formatKpiDuration(
  value?: number | null
): string {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return '—'
  }

  const totalSeconds =
    Math.max(
      0,
      Math.round(value)
    )

  if (totalSeconds < 60) {
    return `${totalSeconds} s`
  }

  const hours =
    Math.floor(
      totalSeconds / 3600
    )

  const minutes =
    Math.floor(
      (totalSeconds % 3600) / 60
    )

  const seconds =
    totalSeconds % 60

  if (hours > 0) {
    return `${hours} h ${minutes} min`
  }

  if (minutes > 0) {
    return `${minutes} min ${seconds} s`
  }

  return `${seconds} s`
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


  const [
    listShopFilter,
    setListShopFilter,
  ] = useState('all')

  const [
    activityFilter,
    setActivityFilter,
  ] = useState('all')

  const [
    processedMin,
    setProcessedMin,
  ] = useState('')

  const [
    processedMax,
    setProcessedMax,
  ] = useState('')

  const [
    performanceMin,
    setPerformanceMin,
  ] = useState('')

  const [
    performanceMax,
    setPerformanceMax,
  ] = useState('')

  const [
    selectedKpiOperatorId,
    setSelectedKpiOperatorId,
  ] = useState('')

  const [
    kpiPeriod,
    setKpiPeriod,
  ] = useState('30d')

  const [
    kpiShopId,
    setKpiShopId,
  ] = useState('')

  const [
    operatorKpis,
    setOperatorKpis,
  ] = useState<OperatorKpiResponse | null>(
    null
  )

  const [
    kpiLoading,
    setKpiLoading,
  ] = useState(false)

  const [
    detailMetric,
    setDetailMetric,
  ] = useState<OperatorDetailMetric | null>(
    null
  )

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

        const loadedOperators =
          response.data.operators || []

        setOperators(
          loadedOperators
        )

        setSelectedKpiOperatorId(
          current =>
            current ||
            loadedOperators[0]?._id ||
            ''
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

  const fetchOperatorKpis =
    useCallback(async () => {
      if (!selectedKpiOperatorId) {
        setOperatorKpis(null)
        return
      }

      setKpiLoading(true)

      try {
        const queryParams =
          new URLSearchParams({
            period: kpiPeriod,
          })

        if (kpiShopId) {
          queryParams.set(
            'shopId',
            kpiShopId
          )
        }

        const response =
          await api.get(
            `/api/admin/operators/${selectedKpiOperatorId}/kpis?${queryParams.toString()}`
          )

        setOperatorKpis(
          response.data || null
        )
      } catch (error) {
        logger.error(
          'Failed to fetch operator KPIs:',
          error,
          'Admin'
        )

        setOperatorKpis(null)

        toast.error(
          'Impossible de charger les KPI opérateur'
        )
      } finally {
        setKpiLoading(false)
      }
    }, [
      selectedKpiOperatorId,
      kpiPeriod,
      kpiShopId,
    ])

  useEffect(() => {
    fetchOperatorKpis()
  }, [fetchOperatorKpis])


  const filteredOperators =
    operators.filter(operator => {
      const searchValue =
        search.trim().toLowerCase()

      const fullName =
        `${operator.firstName} ${operator.lastName}`
          .toLowerCase()

      const operatorShops =
        operator.shops?.length
          ? operator.shops
          : operator.shop
            ? [operator.shop]
            : []

      const matchesSearch =
        !searchValue ||
        fullName.includes(searchValue) ||
        operator.email
          .toLowerCase()
          .includes(searchValue) ||
        operator.phoneNumber
          ?.toLowerCase()
          .includes(searchValue) ||
        operatorShops.some(shop =>
          shop.name
            .toLowerCase()
            .includes(searchValue)
        )

      /*
       * Statut temps réel :
       * Actif / Disponible / En traitement /
       * Inactif / Hors ligne / Désactivé.
       */
      const matchesStatus =
        statusFilter === 'all' ||
        operator.availabilityStatus ===
          statusFilter

      /*
       * Affectation boutique.
       * Toutes les boutiques autorisées de
       * l'opérateur sont prises en compte.
       */
      const matchesShop =
        listShopFilter === 'all' ||
        operatorShops.some(
          shop =>
            shop._id ===
            listShopFilter
        )

      /*
       * Filtre explicite Actif / Inactif
       * demandé séparément dans la spec.
       */
      const matchesActivity =
        activityFilter === 'all' ||
        operator.availabilityStatus ===
          activityFilter

      const processed =
        Number(
          operator.processedOrders || 0
        )

      const confirmed =
        Number(
          operator.confirmedOrders || 0
        )

      const processedMinValue =
        processedMin === ''
          ? null
          : Number(processedMin)

      const processedMaxValue =
        processedMax === ''
          ? null
          : Number(processedMax)

      const matchesProcessed =
        (
          processedMinValue === null ||
          processed >=
            processedMinValue
        ) &&
        (
          processedMaxValue === null ||
          processed <=
            processedMaxValue
        )

      /*
       * Performance :
       * taux de confirmation réel de la
       * synthèse opérateur actuellement chargée.
       *
       * Aucun seuil "bon/mauvais" arbitraire :
       * l'admin choisit lui-même min/max.
       */
      const confirmationPerformance =
        processed > 0
          ? (
              confirmed /
              processed
            ) * 100
          : null

      const performanceMinValue =
        performanceMin === ''
          ? null
          : Number(performanceMin)

      const performanceMaxValue =
        performanceMax === ''
          ? null
          : Number(performanceMax)

      const hasPerformanceConstraint =
        performanceMinValue !== null ||
        performanceMaxValue !== null

      const matchesPerformance =
        !hasPerformanceConstraint ||
        (
          confirmationPerformance !==
            null &&
          (
            performanceMinValue ===
              null ||
            confirmationPerformance >=
              performanceMinValue
          ) &&
          (
            performanceMaxValue ===
              null ||
            confirmationPerformance <=
              performanceMaxValue
          )
        )

      return (
        matchesSearch &&
        matchesStatus &&
        matchesShop &&
        matchesActivity &&
        matchesProcessed &&
        matchesPerformance
      )
    })


  const openCreate = () => {
    setSelectedOperator(null)

    setForm({
      ...emptyForm,
      shopIds: [],
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
      shopIds:
        getOperatorShops(operator).map(
          shop => shop._id
        ),
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

  const toggleShop = (
    shopId: string
  ) => {
    setForm(prev => ({
      ...prev,
      shopIds: prev.shopIds.includes(
        shopId
      )
        ? prev.shopIds.filter(
            id => id !== shopId
          )
        : [
            ...prev.shopIds,
            shopId,
          ],
    }))
  }

  const saveOperator = async () => {
    if (
      !form.firstName.trim() ||
      !form.lastName.trim() ||
      !form.email.trim() ||
      !form.phoneNumber.trim() ||
      form.shopIds.length === 0
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
            shopIds: form.shopIds,
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

          {/* KPI opérateurs */}
          <div className="card p-5 space-y-5">

            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">

              <div>
                <h2 className="text-lg font-semibold">
                  Performance opérateur
                </h2>

                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  KPI calculés à partir des actions et sessions réelles.
                </p>
              </div>


              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">

                <label className="space-y-1">
                  <span className="text-xs text-slate-500">
                    Opérateur
                  </span>

                  <select
                    value={
                      selectedKpiOperatorId
                    }
                    onChange={event =>
                      setSelectedKpiOperatorId(
                        event.target.value
                      )
                    }
                    className="w-full min-w-[190px] px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700"
                  >
                    {operators.length === 0 && (
                      <option value="">
                        Aucun opérateur
                      </option>
                    )}

                    {operators.map(operator => (
                      <option
                        key={operator._id}
                        value={operator._id}
                      >
                        {operator.firstName}{' '}
                        {operator.lastName}
                      </option>
                    ))}
                  </select>
                </label>


                <label className="space-y-1">
                  <span className="text-xs text-slate-500">
                    Période
                  </span>

                  <select
                    value={kpiPeriod}
                    onChange={event =>
                      setKpiPeriod(
                        event.target.value
                      )
                    }
                    className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700"
                  >
                    <option value="today">
                      Aujourd&apos;hui
                    </option>

                    <option value="7d">
                      7 jours
                    </option>

                    <option value="30d">
                      30 jours
                    </option>

                    <option value="90d">
                      90 jours
                    </option>

                    <option value="this_month">
                      Mois en cours
                    </option>

                    <option value="previous_month">
                      Mois précédent
                    </option>
                  </select>
                </label>


                <label className="space-y-1">
                  <span className="text-xs text-slate-500">
                    Boutique
                  </span>

                  <select
                    value={kpiShopId}
                    onChange={event =>
                      setKpiShopId(
                        event.target.value
                      )
                    }
                    className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700"
                  >
                    <option value="">
                      Toutes
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
                </label>

              </div>
            </div>


            {kpiLoading ? (
              <div className="py-10 text-center text-sm text-slate-500">
                Chargement des KPI...
              </div>
            ) : operatorKpis ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">

                  {[
                    {
                      metric: 'taken',
                      label:
                        'Prises en charge',
                      value:
                        operatorKpis.kpis
                          .takenOrders,
                    },
                    {
                      metric: 'processed',
                      label:
                        'Traitées',
                      value:
                        operatorKpis.kpis
                          .processedOrders,
                    },
                    {
                      metric: 'confirmed',
                      label:
                        'Confirmées',
                      value:
                        operatorKpis.kpis
                          .confirmedOrders,
                    },
                    {
                      metric: 'cancelled',
                      label:
                        'Annulées',
                      value:
                        operatorKpis.kpis
                          .cancelledOrders,
                    },
                    {
                      metric: 'postponed',
                      label:
                        'Reportées',
                      value:
                        operatorKpis.kpis
                          .postponedOrders,
                    },
                    {
                      metric: 'attempts',
                      label:
                        'Tentatives',
                      value:
                        operatorKpis.kpis
                          .attempts,
                    },
                  ].map(item => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() =>
                        setDetailMetric(
                          item.metric as OperatorDetailMetric
                        )
                      }
                      className="rounded-xl border border-gray-200 dark:border-slate-700 p-4 text-left transition hover:border-blue-400 hover:bg-blue-50/40 dark:hover:bg-blue-950/20"
                    >
                      <p className="text-xs text-slate-500">
                        {item.label}
                      </p>

                      <p className="text-2xl font-semibold mt-1">
                        {item.value}
                      </p>
                    </button>
                  ))}

                </div>


                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">

                  <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-4">
                    <p className="text-xs text-slate-500">
                      Taux de confirmation
                    </p>

                    <p className="text-xl font-semibold mt-1">
                      {operatorKpis.kpis
                        .confirmationRate
                        .toFixed(1)}
                      %
                    </p>
                  </div>


                  <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-4">
                    <p className="text-xs text-slate-500">
                      Temps connecté
                    </p>

                    <p className="text-xl font-semibold mt-1">
                      {formatKpiDuration(
                        operatorKpis.kpis
                          .connectedSeconds
                      )}
                    </p>
                  </div>


                  <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-4">
                    <p className="text-xs text-slate-500">
                      Traitement moyen
                    </p>

                    <p className="text-xl font-semibold mt-1">
                      {formatKpiDuration(
                        operatorKpis.kpis
                          .averageTreatmentSeconds
                      )}
                    </p>
                  </div>


                  <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-4">
                    <p className="text-xs text-slate-500">
                      Avant prise en charge
                    </p>

                    <p className="text-xl font-semibold mt-1">
                      {formatKpiDuration(
                        operatorKpis.kpis
                          .averagePickupSeconds
                      )}
                    </p>
                  </div>


                  <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-4">
                    <p className="text-xs text-slate-500">
                      Entre commandes
                    </p>

                    <p className="text-xl font-semibold mt-1">
                      {formatKpiDuration(
                        operatorKpis.kpis
                          .averageBetweenOrdersSeconds
                      )}
                    </p>
                  </div>

                </div>


                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3">

                  <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-4">
                    <p className="text-xs text-slate-500">
                      Temps actif
                    </p>

                    <p className="text-xl font-semibold mt-1">
                      {formatKpiDuration(
                        operatorKpis.kpis
                          .activeSeconds
                      )}
                    </p>
                  </div>


                  <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-4">
                    <p className="text-xs text-slate-500">
                      En traitement
                    </p>

                    <p className="text-xl font-semibold mt-1">
                      {formatKpiDuration(
                        operatorKpis.kpis
                          .processingSeconds
                      )}
                    </p>
                  </div>


                  <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-4">
                    <p className="text-xs text-slate-500">
                      Disponible / attente
                    </p>

                    <p className="text-xl font-semibold mt-1">
                      {formatKpiDuration(
                        operatorKpis.kpis
                          .waitingSeconds
                      )}
                    </p>
                  </div>


                  <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-4">
                    <p className="text-xs text-slate-500">
                      Temps d&apos;inactivité
                    </p>

                    <p className="text-xl font-semibold mt-1">
                      {formatKpiDuration(
                        operatorKpis.kpis
                          .inactiveSeconds
                      )}
                    </p>
                  </div>


                  <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-4">
                    <p className="text-xs text-slate-500">
                      Taux d&apos;activité
                    </p>

                    <p className="text-xl font-semibold mt-1">
                      {operatorKpis.kpis
                        .activityRate === null
                        ? '—'
                        : `${operatorKpis.kpis.activityRate.toFixed(1)} %`}
                    </p>
                  </div>


                  <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-4">
                    <p className="text-xs text-slate-500">
                      Commandes / heure active
                    </p>

                    <p className="text-xl font-semibold mt-1">
                      {operatorKpis.kpis
                        .processedPerActiveHour === null
                        ? '—'
                        : operatorKpis.kpis
                            .processedPerActiveHour
                            .toFixed(1)}
                    </p>
                  </div>

                </div>


                {kpiShopId &&
                  operatorKpis.businessKpis && (
                  <div className="rounded-2xl border border-gray-200 dark:border-slate-700 p-5 space-y-4">

                    <div>
                      <h3 className="font-semibold">
                        KPI boutique
                      </h3>

                      <p className="text-xs text-slate-500 mt-1">
                        {
                          shops.find(
                            shop =>
                              shop._id ===
                              kpiShopId
                          )?.name ||
                          'Boutique sélectionnée'
                        }
                        {' — '}
                        même période et mêmes formules que Admin → Utilisateurs.
                      </p>
                    </div>


                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">

                      {[
                        {
                          label:
                            'Commandes',
                          value:
                            operatorKpis
                              .businessKpis
                              .totalOrders,
                        },
                        {
                          label:
                            'Confirmées',
                          value:
                            operatorKpis
                              .businessKpis
                              .confirmedOrders,
                        },
                        {
                          label:
                            'Annulées',
                          value:
                            operatorKpis
                              .businessKpis
                              .cancelledOrders,
                        },
                        {
                          label:
                            'Reportées',
                          value:
                            operatorKpis
                              .businessKpis
                              .postponedOrders,
                        },
                        {
                          label:
                            'Taux confirmation',
                          value:
                            `${operatorKpis.businessKpis.confirmationRate.toFixed(1)} %`,
                        },
                        {
                          label:
                            'Taux livraison',
                          value:
                            `${operatorKpis.businessKpis.deliveryRate.toFixed(1)} %`,
                        },
                        {
                          label:
                            'CA livré',
                          value:
                            `${operatorKpis.businessKpis.deliveredRevenue.toFixed(2)} TND`,
                        },
                        {
                          label:
                            'Score IA moyen',
                          value:
                            operatorKpis
                              .businessKpis
                              .averageAiScore ===
                            null
                              ? '—'
                              : operatorKpis
                                  .businessKpis
                                  .averageAiScore
                                  .toFixed(1),
                        },
                        {
                          label:
                            'Taux retour',
                          value:
                            `${operatorKpis.businessKpis.returnRate.toFixed(1)} %`,
                        },
                        {
                          label:
                            'Taux annulation',
                          value:
                            `${operatorKpis.businessKpis.cancellationRate.toFixed(1)} %`,
                        },
                        {
                          label:
                            'Échec livraison',
                          value:
                            `${operatorKpis.businessKpis.failedDeliveryRate.toFixed(1)} %`,
                        },
                        {
                          label:
                            'Panier moyen livré',
                          value:
                            `${operatorKpis.businessKpis.deliveredAverageOrderValue.toFixed(2)} TND`,
                        },
                      ].map(item => (
                        <div
                          key={item.label}
                          className="rounded-xl bg-gray-50 dark:bg-slate-800/60 p-3"
                        >
                          <p className="text-xs text-slate-500">
                            {item.label}
                          </p>

                          <p className="font-semibold mt-1">
                            {item.value}
                          </p>
                        </div>
                      ))}

                    </div>

                  </div>
                )}


                <div className="flex flex-wrap items-center gap-2">

                  <span className="text-xs text-slate-500 mr-1">
                    Détail des temps :
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setDetailMetric('active')
                    }
                    className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-xs font-medium hover:bg-gray-50 dark:hover:bg-slate-800"
                  >
                    Temps actif
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setDetailMetric('busy')
                    }
                    className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-xs font-medium hover:bg-gray-50 dark:hover:bg-slate-800"
                  >
                    En traitement
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setDetailMetric('available')
                    }
                    className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-xs font-medium hover:bg-gray-50 dark:hover:bg-slate-800"
                  >
                    Disponible / attente
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setDetailMetric('inactive')
                    }
                    className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-xs font-medium hover:bg-gray-50 dark:hover:bg-slate-800"
                  >
                    Inactivité
                  </button>

                </div>


                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">

                  <span>
                    Sessions analysées :{' '}
                    {
                      operatorKpis.dataCoverage
                        .sessionCount
                    }
                  </span>

                  {!operatorKpis.dataCoverage
                    .activityTrackingAvailable && (
                    <span className="text-amber-600 dark:text-amber-400">
                      Le suivi actif / inactif commence à partir de son activation.
                    </span>
                  )}

                  {operatorKpis.dataCoverage
                    .trackedWorkCycles === 0 && (
                    <span className="text-amber-600 dark:text-amber-400">
                      Les durées détaillées commenceront à apparaître avec les nouvelles prises en charge.
                    </span>
                  )}

                </div>
              </>
            ) : (
              <div className="py-10 text-center text-sm text-slate-500">
                Sélectionne un opérateur pour afficher ses KPI.
              </div>
            )}

          </div>


          {detailMetric && operatorKpis && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

              <div className="w-full max-w-5xl max-h-[85vh] overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl">

                <div className="flex items-center justify-between gap-4 border-b border-gray-200 dark:border-slate-700 px-5 py-4">

                  <div>

                    <h3 className="text-lg font-semibold">
                      Détail KPI — {
                        detailMetric === 'taken'
                          ? 'Prises en charge'
                          : detailMetric === 'processed'
                            ? 'Traitées'
                            : detailMetric === 'confirmed'
                              ? 'Confirmées'
                              : detailMetric === 'cancelled'
                                ? 'Annulées'
                                : detailMetric === 'postponed'
                                  ? 'Reportées'
                                  : detailMetric === 'attempts'
                                    ? 'Tentatives'
                                    : detailMetric === 'active'
                                      ? 'Temps actif'
                                      : detailMetric === 'busy'
                                        ? 'En traitement'
                                        : detailMetric === 'available'
                                          ? 'Disponible / attente'
                                          : 'Temps d’inactivité'
                      }
                    </h3>

                    <p className="text-sm text-slate-500 mt-1">
                      {operatorKpis.operator.firstName}{' '}
                      {operatorKpis.operator.lastName}
                    </p>

                  </div>


                  <button
                    type="button"
                    onClick={() =>
                      setDetailMetric(null)
                    }
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>

                </div>


                <div className="overflow-auto max-h-[68vh]">

                  {[
                    'active',
                    'busy',
                    'available',
                    'inactive',
                  ].includes(detailMetric) ? (

                    <table className="w-full text-sm">

                      <thead className="sticky top-0 bg-gray-50 dark:bg-slate-800">
                        <tr className="text-left">
                          <th className="px-4 py-3">
                            État
                          </th>

                          <th className="px-4 py-3">
                            Début
                          </th>

                          <th className="px-4 py-3">
                            Fin
                          </th>

                          <th className="px-4 py-3">
                            Durée
                          </th>
                        </tr>
                      </thead>


                      <tbody>

                        {(operatorKpis.details
                          ?.activityIntervals || [])
                          .filter(
                            interval =>
                              interval.state ===
                              detailMetric
                          )
                          .map(interval => (
                            <tr
                              key={interval._id}
                              className="border-t border-gray-100 dark:border-slate-800"
                            >

                              <td className="px-4 py-3 font-medium">
                                {interval.state === 'active'
                                  ? 'Actif'
                                  : interval.state === 'busy'
                                    ? 'En traitement'
                                    : interval.state === 'available'
                                      ? 'Disponible / attente'
                                      : 'Inactif'}
                              </td>

                              <td className="px-4 py-3">
                                {formatLastActivity(
                                  interval.startedAt
                                )}
                              </td>

                              <td className="px-4 py-3">
                                {formatLastActivity(
                                  interval.endedAt
                                )}
                              </td>

                              <td className="px-4 py-3">
                                {formatKpiDuration(
                                  interval.durationSeconds
                                )}
                              </td>

                            </tr>
                          ))}


                        {(operatorKpis.details
                          ?.activityIntervals || [])
                          .filter(
                            interval =>
                              interval.state ===
                              detailMetric
                          ).length === 0 && (

                          <tr>
                            <td
                              colSpan={4}
                              className="px-4 py-10 text-center text-slate-500"
                            >
                              Aucun intervalle enregistré pour cet état sur cette période.
                            </td>
                          </tr>
                        )}

                      </tbody>

                    </table>

                  ) : (

                    <table className="w-full text-sm">

                      <thead className="sticky top-0 bg-gray-50 dark:bg-slate-800">
                        <tr className="text-left">

                          <th className="px-4 py-3">
                            Commande
                          </th>

                          <th className="px-4 py-3">
                            Client
                          </th>

                          <th className="px-4 py-3">
                            Boutique
                          </th>

                          <th className="px-4 py-3">
                            Statut
                          </th>

                          <th className="px-4 py-3">
                            Tentatives
                          </th>

                          <th className="px-4 py-3">
                            Durée
                          </th>

                          <th className="px-4 py-3">
                            Dernière action
                          </th>

                        </tr>
                      </thead>


                      <tbody>

                        {(operatorKpis.details
                          ?.orders || [])
                          .filter(order => {
                            if (
                              detailMetric ===
                              'attempts'
                            ) {
                              return (
                                order.metrics
                                  .attempts > 0
                              )
                            }

                            if (
                              detailMetric ===
                              'taken'
                            ) {
                              return (
                                order.metrics.taken
                              )
                            }

                            if (
                              detailMetric ===
                              'processed'
                            ) {
                              return (
                                order.metrics.processed
                              )
                            }

                            if (
                              detailMetric ===
                              'confirmed'
                            ) {
                              return (
                                order.metrics.confirmed
                              )
                            }

                            if (
                              detailMetric ===
                              'cancelled'
                            ) {
                              return (
                                order.metrics.cancelled
                              )
                            }

                            if (
                              detailMetric ===
                              'postponed'
                            ) {
                              return (
                                order.metrics.postponed
                              )
                            }

                            return false
                          })
                          .map(order => (

                            <tr
                              key={order._id}
                              className="border-t border-gray-100 dark:border-slate-800"
                            >

                              <td className="px-4 py-3 font-medium">
                                {order.orderId}
                              </td>

                              <td className="px-4 py-3">
                                {order.customerName}
                              </td>

                              <td className="px-4 py-3">
                                {order.shop?.name ||
                                  '—'}
                              </td>

                              <td className="px-4 py-3">
                                {order.finalResult ||
                                  order.currentStatus ||
                                  '—'}
                              </td>

                              <td className="px-4 py-3">
                                {
                                  order.metrics
                                    .attempts
                                }
                              </td>

                              <td className="px-4 py-3">
                                {formatKpiDuration(
                                  order.timing
                                    .durationSeconds
                                )}
                              </td>

                              <td className="px-4 py-3">
                                {formatLastActivity(
                                  order.lastActionAt
                                )}
                              </td>

                            </tr>
                          ))}


                        {(operatorKpis.details
                          ?.orders || [])
                          .filter(order => {
                            if (
                              detailMetric ===
                              'attempts'
                            ) {
                              return (
                                order.metrics
                                  .attempts > 0
                              )
                            }

                            if (
                              detailMetric ===
                              'taken'
                            ) {
                              return order.metrics.taken
                            }

                            if (
                              detailMetric ===
                              'processed'
                            ) {
                              return order.metrics.processed
                            }

                            if (
                              detailMetric ===
                              'confirmed'
                            ) {
                              return order.metrics.confirmed
                            }

                            if (
                              detailMetric ===
                              'cancelled'
                            ) {
                              return order.metrics.cancelled
                            }

                            if (
                              detailMetric ===
                              'postponed'
                            ) {
                              return order.metrics.postponed
                            }

                            return false
                          }).length === 0 && (

                          <tr>
                            <td
                              colSpan={7}
                              className="px-4 py-10 text-center text-slate-500"
                            >
                              Aucune commande correspondante sur cette période.
                            </td>
                          </tr>
                        )}

                      </tbody>

                    </table>
                  )}

                </div>

              </div>
            </div>
          )}


          {/* Advanced operator filters */}
          <div className="card p-4 space-y-4">

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">

              <div>
                <h2 className="font-semibold">
                  Filtres avancés
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  Boutique, activité, commandes traitées et performance.
                </p>
              </div>

              <div className="flex items-center gap-3">

                <span className="text-xs text-slate-500">
                  {filteredOperators.length}{' '}
                  / {operators.length}{' '}
                  opérateur(s)
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setSearch('')
                    setStatusFilter('all')
                    setListShopFilter('all')
                    setActivityFilter('all')
                    setProcessedMin('')
                    setProcessedMax('')
                    setPerformanceMin('')
                    setPerformanceMax('')
                  }}
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 text-xs font-medium hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  Réinitialiser
                </button>

              </div>
            </div>


            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">

              <label className="space-y-1">
                <span className="text-xs text-slate-500">
                  Boutique
                </span>

                <select
                  value={listShopFilter}
                  onChange={event =>
                    setListShopFilter(
                      event.target.value
                    )
                  }
                  className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700"
                >
                  <option value="all">
                    Toutes
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
              </label>


              <label className="space-y-1">
                <span className="text-xs text-slate-500">
                  Actif / inactif
                </span>

                <select
                  value={activityFilter}
                  onChange={event =>
                    setActivityFilter(
                      event.target.value
                    )
                  }
                  className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700"
                >
                  <option value="all">
                    Tous
                  </option>

                  <option value="active">
                    Actif
                  </option>

                  <option value="inactive">
                    Inactif
                  </option>
                </select>
              </label>


              <label className="space-y-1">
                <span className="text-xs text-slate-500">
                  Traitées min.
                </span>

                <input
                  type="number"
                  min="0"
                  value={processedMin}
                  onChange={event =>
                    setProcessedMin(
                      event.target.value
                    )
                  }
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700"
                />
              </label>


              <label className="space-y-1">
                <span className="text-xs text-slate-500">
                  Traitées max.
                </span>

                <input
                  type="number"
                  min="0"
                  value={processedMax}
                  onChange={event =>
                    setProcessedMax(
                      event.target.value
                    )
                  }
                  placeholder="∞"
                  className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700"
                />
              </label>


              <label className="space-y-1">
                <span className="text-xs text-slate-500">
                  Performance min. %
                </span>

                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={performanceMin}
                  onChange={event =>
                    setPerformanceMin(
                      event.target.value
                    )
                  }
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700"
                />
              </label>


              <label className="space-y-1">
                <span className="text-xs text-slate-500">
                  Performance max. %
                </span>

                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={performanceMax}
                  onChange={event =>
                    setPerformanceMax(
                      event.target.value
                    )
                  }
                  placeholder="100"
                  className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700"
                />
              </label>

            </div>

            <p className="text-xs text-slate-500">
              Performance = commandes confirmées ÷ commandes traitées × 100.
              Aucun seuil qualitatif n’est imposé automatiquement.
            </p>

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
                        Boutiques
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
                            <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                              {getOperatorShops(
                                operator
                              ).length > 0 ? (
                                getOperatorShops(
                                  operator
                                ).map(shop => (
                                  <span
                                    key={shop._id}
                                    className="inline-flex items-center rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300"
                                  >
                                    {shop.name}
                                  </span>
                                ))
                              ) : (
                                <span className="text-slate-400">
                                  —
                                </span>
                              )}
                            </div>
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

                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm">
                      Boutiques associées *
                    </span>

                    <span className="text-xs text-slate-500">
                      {form.shopIds.length}{' '}
                      sélectionnée(s)
                    </span>
                  </div>

                  <div className="max-h-52 overflow-y-auto rounded-lg border border-gray-300 dark:border-slate-700 divide-y divide-gray-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {shops.length === 0 ? (
                      <div className="p-4 text-sm text-slate-500">
                        Aucune boutique active disponible.
                      </div>
                    ) : (
                      shops.map(shop => {
                        const checked =
                          form.shopIds.includes(
                            shop._id
                          )

                        return (
                          <label
                            key={shop._id}
                            className="flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/70"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                toggleShop(
                                  shop._id
                                )
                              }
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />

                            <span className="text-sm font-medium">
                              {shop.name}
                            </span>
                          </label>
                        )
                      })
                    )}
                  </div>

                  <p className="text-xs text-slate-500">
                    L&apos;opérateur pourra
                    uniquement accéder aux
                    commandes des boutiques
                    sélectionnées.
                  </p>
                </div>

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
