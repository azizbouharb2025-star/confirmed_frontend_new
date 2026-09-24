'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  PhoneIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import api from '@/lib/api'
import logger from '@/lib/logger'
import { formatCurrency } from '@/lib/formatCurrency'
import type { Order } from '@/types/order'
import type { Product } from '@/types/product'
import {
  sortQueueOrders,
  getPriorityColor,
  getAIScoreColor,
} from './queueUtils'

type OperatorFeedbackQuestionType =
  | 'single_choice'
  | 'multiple_choice'

interface OperatorFeedbackAnswer {
  key: string
  label: string
  order?: number
}

interface OperatorFeedbackQuestion {
  key: string
  categoryKey: string
  title: string
  prompt: string
  type: OperatorFeedbackQuestionType
  required: boolean
  maxSelections?: number | null
  order?: number
  answers: OperatorFeedbackAnswer[]
}

interface OperatorFeedbackCategory {
  key: string
  label: string
  order?: number
}

interface OperatorFeedbackFormConfig {
  enabled: boolean
  configVersion: number | null
  categories: OperatorFeedbackCategory[]
  questions: OperatorFeedbackQuestion[]
}

type OperatorFeedbackResponses =
  Record<string, string[]>

interface OperatorClientDraft {
  orderId: string
  name: string
  phone: string
  additionalPhones: string[]
  street: string
  city: string
  governorate: string
}

interface OperatorOrderItemDraft {
  id: string
  productId: string
  name: string
  quantity: string
  price: string
}

interface OperatorOrderDraft {
  orderId: string
  items: OperatorOrderItemDraft[]
  deliveryFee: string
}

const TUNISIA_GOVERNORATES = [
  'Ariana',
  'Béja',
  'Ben Arous',
  'Bizerte',
  'Gabès',
  'Gafsa',
  'Jendouba',
  'Kairouan',
  'Kasserine',
  'Kébili',
  'Le Kef',
  'Mahdia',
  'La Manouba',
  'Médenine',
  'Monastir',
  'Nabeul',
  'Sfax',
  'Sidi Bouzid',
  'Siliana',
  'Sousse',
  'Tataouine',
  'Tozeur',
  'Tunis',
  'Zaghouan',
] as const

function getPriorityLabel(priority: Order['priority']) {
  const labels: Record<string, string> = {
    low: 'Faible',
    medium: 'Moyenne',
    normal: 'Normale',
    high: 'Élevée',
    urgent: 'Urgente',
  }

  return labels[priority] || priority
}

function getOrderAIScore(
  order: Order
): number | undefined {
  if (typeof order.aiScore === 'number') {
    return order.aiScore
  }

  if (typeof order.aiRiskScore === 'number') {
    return order.aiRiskScore
  }

  return undefined
}

function getRiskLevelLabel(
  riskLevel: Order['riskLevel']
): string {
  const labels = {
    critical: 'Critique',
    high: 'Élevé',
    medium: 'Modéré',
    low: 'Faible',
    very_low: 'Très faible',
  }

  return riskLevel
    ? labels[riskLevel]
    : 'Non déterminé'
}

function getAIDecisionLabel(
  decision: Order['aiDecision']
): string {
  const labels = {
    accept: 'Acceptée',
    review: 'À examiner',
    reject: 'À risque',
  }

  return decision
    ? labels[decision]
    : 'Non déterminée'
}


function formatFrenchDateInput(
  value: string
): string {
  const digits = value
    .replace(/\D/g, '')
    .slice(0, 8)

  if (digits.length <= 2) {
    return digits
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`
  }

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

function frenchDateToISO(
  value: string
): string | null {
  const match =
    /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(
      value.trim()
    )

  if (!match) {
    return null
  }

  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])

  const date = new Date(
    Date.UTC(
      year,
      month - 1,
      day
    )
  )

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }

  return [
    String(year).padStart(4, '0'),
    String(month).padStart(2, '0'),
    String(day).padStart(2, '0'),
  ].join('-')
}


function ProductImagePreview({
  src,
  alt,
}: {
  src?: string
  alt: string
}) {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [src])

  if (!src || failed) {
    return (
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border px-1 text-center text-[10px] dark:border-slate-700 dark:text-slate-500 light:border-gray-200 light:text-gray-400">
        Image indisponible
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className="h-16 w-16 shrink-0 rounded-lg object-cover"
    />
  )
}


function buildClientDraft(order: Order): OperatorClientDraft {
  return {
    orderId: order._id,
    name: order.clientInfo?.name || '',
    phone: order.clientInfo?.phone || '',
    additionalPhones: order.clientInfo?.additionalPhones || [],
    street: order.clientInfo?.address?.street || '',
    city: order.clientInfo?.address?.city || '',
    governorate:
      order.clientInfo?.address?.state ||
      order.region ||
      '',
  }
}

function buildOrderDraft(order: Order): OperatorOrderDraft {
  return {
    orderId: order._id,
    items: order.items.map(item => ({
      id: item._id || '',
      productId:
        typeof item.productId === 'object'
          ? item.productId?._id || ''
          : item.productId || '',
      name: item.name || '',
      quantity: String(item.quantity ?? 1),
      price: String(item.price ?? 0),
    })),
    deliveryFee: String(order.deliveryFee ?? 0),
  }
}

function calculateOrderDraftTotal(
  draft: OperatorOrderDraft
): number {
  const subtotal = draft.items.reduce((sum, item) => {
    const quantity = Number(item.quantity)
    const price = Number(item.price)

    if (
      !Number.isFinite(quantity) ||
      !Number.isFinite(price)
    ) {
      return sum
    }

    return sum + quantity * price
  }, 0)

  const deliveryFee = Number(draft.deliveryFee)

  return Number(
    (
      subtotal +
      (Number.isFinite(deliveryFee) ? deliveryFee : 0)
    ).toFixed(3)
  )
}

type OperatorCancellationReason =
  | 'customer_refused'
  | 'price_too_high'
  | 'quality_doubts'
  | 'duplicate_order'
  | 'fake_number'
  | 'not_available'
  | 'courier_failed'
  | 'customer_rejected_at_door'

const OPERATOR_CANCELLATION_REASONS: Array<{
  value: OperatorCancellationReason | ''
  label: string
}> = [
  { value: '', label: 'Aucun motif' },
  { value: 'customer_refused', label: 'Client refuse la commande' },
  { value: 'price_too_high', label: 'Prix trop élevé' },
  { value: 'quality_doubts', label: 'Doutes sur la qualité' },
  { value: 'duplicate_order', label: 'Commande en double' },
  { value: 'fake_number', label: 'Numéro incorrect ou faux' },
  { value: 'not_available', label: 'Produit indisponible' },
  { value: 'courier_failed', label: 'Problème de livraison' },
  { value: 'customer_rejected_at_door', label: 'Refus à la livraison' },
]

type OperatorCallAttemptReason =
  | 'no_answer'
  | 'busy'
  | 'unreachable'
  | 'callback_requested'
  | 'interrupted'
  | 'other'

interface CallAttemptApiResponse {
  order: Order
  attemptNumber: 1 | 2 | 3
  requiresCancellationConfirmation: boolean
}

const CALL_ATTEMPT_REASONS: Array<{
  value: OperatorCallAttemptReason | ''
  label: string
}> = [
  { value: '', label: 'Aucun motif' },
  { value: 'no_answer', label: 'Pas de réponse' },
  { value: 'busy', label: 'Occupé' },
  { value: 'unreachable', label: 'Injoignable' },
  {
    value: 'callback_requested',
    label: 'Souhaite être rappelé',
  },
  {
    value: 'interrupted',
    label: 'Appel interrompu',
  },
  { value: 'other', label: 'Autre' },
]

function getRecordedCallAttempts(
  order: Order | null
): Array<1 | 2 | 3> {
  if (!order?.callHistory) {
    return []
  }

  return Array.from(
    new Set(
      order.callHistory
        .map(entry => entry.attemptNumber)
        .filter(
          (
            value
          ): value is 1 | 2 | 3 =>
            value === 1 ||
            value === 2 ||
            value === 3
        )
    )
  ).sort(
    (a, b) => a - b
  )
}

function normalizeQueueSearchValue(
  value: unknown
): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function normalizeQueuePhone(
  value: unknown
): string {
  return String(value ?? '')
    .replace(/\D/g, '')
}


export default function CallQueue() {
  const [orders, setOrders] = useState<Order[]>([])
  const [queueSearch, setQueueSearch] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [clientDraft, setClientDraft] = useState<OperatorClientDraft | null>(null)
  const [savingClient, setSavingClient] = useState(false)
  const [clientSaveMessage, setClientSaveMessage] = useState('')
  const [clientSaveError, setClientSaveError] = useState('')
  const [orderDraft, setOrderDraft] = useState<OperatorOrderDraft | null>(null)
  const [shopProducts, setShopProducts] = useState<Product[]>([])
  const [loadingShopProducts, setLoadingShopProducts] = useState(false)
  const [shopProductsError, setShopProductsError] = useState('')
  const [savingOrder, setSavingOrder] = useState(false)
  const [orderSaveMessage, setOrderSaveMessage] = useState('')
  const [orderSaveError, setOrderSaveError] = useState('')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [cancellationReason, setCancellationReason] =
    useState<OperatorCancellationReason | ''>('')
  const [cancellationComment, setCancellationComment] = useState('')
  const [showCancellationModal, setShowCancellationModal] = useState(false)
  const [cancellationError, setCancellationError] = useState('')
  const [showPostponeModal, setShowPostponeModal] = useState(false)
  const [postponeDate, setPostponeDate] = useState('')
  const [postponeTime, setPostponeTime] = useState('')
  const [postponeNote, setPostponeNote] = useState('')
  const [postponeError, setPostponeError] = useState('')
  const [savingPostpone, setSavingPostpone] = useState(false)
  const [showAttemptModal, setShowAttemptModal] = useState(false)
  const [attemptNumber, setAttemptNumber] = useState<1 | 2 | 3>(1)
  const [attemptReason, setAttemptReason] = useState<OperatorCallAttemptReason | ''>('')
  const [attemptNotes, setAttemptNotes] = useState('')
  const [savingAttempt, setSavingAttempt] = useState(false)
  const [attemptError, setAttemptError] = useState('')
  const [attemptSaveMessage, setAttemptSaveMessage] = useState('')
  const [showThirdAttemptCancelModal, setShowThirdAttemptCancelModal] = useState(false)
  const [confirmingThirdAttemptCancel, setConfirmingThirdAttemptCancel] = useState(false)

  // Retour opérateur dynamique configuré par l'admin.
  const [showConfirmationModal, setShowConfirmationModal] =
    useState(false)

  const [feedbackFormConfig, setFeedbackFormConfig] =
    useState<OperatorFeedbackFormConfig | null>(null)

  const [feedbackResponses, setFeedbackResponses] =
    useState<OperatorFeedbackResponses>({})

  const [loadingFeedbackForm, setLoadingFeedbackForm] =
    useState(false)

  const [confirmationNotes, setConfirmationNotes] =
    useState('')

  const [confirmationError, setConfirmationError] =
    useState('')

  // Chronomètre réel de l'appel opérateur.
  const [callStartedAt, setCallStartedAt] =
    useState<number | null>(null)

  const [callElapsedSeconds, setCallElapsedSeconds] =
    useState(0)

  const [callTimerActive, setCallTimerActive] =
    useState(false)

  useEffect(() => {
    if (!callTimerActive || !callStartedAt) {
      return
    }

    const timer = window.setInterval(() => {
      setCallElapsedSeconds(
        Math.max(
          0,
          Math.floor(
            (Date.now() - callStartedAt) / 1000
          )
        )
      )
    }, 1000)

    return () => {
      window.clearInterval(timer)
    }
  }, [callTimerActive, callStartedAt])

  useEffect(() => {
    setCallStartedAt(null)
    setCallElapsedSeconds(0)
    setCallTimerActive(false)
  }, [selectedOrder?._id])

  // Sort orders by priority then AI score
  const sortedOrders = useMemo(() => sortQueueOrders(orders), [orders])

  // Recherche instantanée dans la file d'appels.
  // Le tri métier existant reste inchangé.
  const filteredOrders = useMemo(() => {
    const rawQuery = queueSearch.trim()

    if (!rawQuery) {
      return sortedOrders
    }

    const isOrderIdSearch = rawQuery.startsWith('#')

    const textQuery = normalizeQueueSearchValue(rawQuery)
      .replace(/^#/, '')

    /*
     * Une recherche commençant par # cible exclusivement
     * le numéro Confirmed de la commande.
     *
     * Exemple :
     * #42 => commande #42, sans correspondance téléphone.
     */
    if (isOrderIdSearch) {
      if (!textQuery) {
        return sortedOrders
      }

      const exactMatches = sortedOrders.filter(order =>
        normalizeQueueSearchValue(
          order.confirmedId
        ) === textQuery
      )

      if (exactMatches.length > 0) {
        return exactMatches
      }

      // Utile pendant la saisie : #4 peut afficher #42, #45...
      return sortedOrders.filter(order =>
        normalizeQueueSearchValue(
          order.confirmedId
        ).startsWith(textQuery)
      )
    }

    const phoneQuery = normalizeQueuePhone(rawQuery)

    return sortedOrders.filter(order => {
      const confirmedId = normalizeQueueSearchValue(
        order.confirmedId
      )

      const clientName = normalizeQueueSearchValue(
        order.clientInfo?.name
      )

      const mainPhoneText = normalizeQueueSearchValue(
        order.clientInfo?.phone
      )

      const mainPhoneDigits = normalizeQueuePhone(
        order.clientInfo?.phone
      )

      const additionalPhones =
        order.clientInfo?.additionalPhones || []

      const additionalPhoneTextMatch =
        additionalPhones.some(phone =>
          normalizeQueueSearchValue(phone).includes(
            textQuery
          )
        )

      const additionalPhoneDigitsMatch =
        phoneQuery.length > 0 &&
        additionalPhones.some(phone =>
          normalizeQueuePhone(phone).includes(
            phoneQuery
          )
        )

      return (
        confirmedId.includes(textQuery) ||
        clientName.includes(textQuery) ||
        mainPhoneText.includes(textQuery) ||
        additionalPhoneTextMatch ||
        (
          phoneQuery.length > 0 &&
          mainPhoneDigits.includes(phoneQuery)
        ) ||
        additionalPhoneDigitsMatch
      )
    })
  }, [sortedOrders, queueSearch])

  const selectedShopId = useMemo(() => {
    if (!selectedOrder?.shopId) {
      return ''
    }

    return typeof selectedOrder.shopId === 'string'
      ? selectedOrder.shopId
      : selectedOrder.shopId._id
  }, [selectedOrder?.shopId])

  useEffect(() => {
    let cancelled = false

    const loadShopProducts = async () => {
      if (!selectedShopId) {
        setShopProducts([])
        setShopProductsError('')
        return
      }

      setLoadingShopProducts(true)
      setShopProductsError('')

      try {
        const products: Product[] = []
        let page = 1
        let totalPages = 1

        do {
          const response = await api.get(
            `/api/products/shop/${selectedShopId}?page=${page}&limit=100`
          )

          const currentPage = Array.isArray(response.data?.products)
            ? response.data.products
            : Array.isArray(response.data)
              ? response.data
              : []

          products.push(...currentPage)

          totalPages = Number(
            response.data?.pagination?.pages || 1
          )

          page += 1
        } while (page <= totalPages && page <= 100)

        if (!cancelled) {
          setShopProducts(
            products.filter(
              product => product.isActive !== false
            )
          )
        }
      } catch (error) {
        logger.error(
          'Impossible de charger le catalogue produits:',
          error,
          'Queue'
        )

        if (!cancelled) {
          setShopProducts([])
          setShopProductsError(
            'Impossible de charger le catalogue produits.'
          )
        }
      } finally {
        if (!cancelled) {
          setLoadingShopProducts(false)
        }
      }
    }

    loadShopProducts()

    return () => {
      cancelled = true
    }
  }, [selectedShopId])

  const fetchOrders = async () => {
    try {
      const response = await api.get(
        '/api/operators/queue?limit=50'
      )

      setOrders(
        response.data.orders || []
      )
    } catch (error) {
      logger.error('Failed to fetch orders:', error, 'Queue')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Sélectionner une commande puis charger sa fiche complète.
   *
   * La liste /api/orders reste légère.
   * GET /api/orders/:id fournit ensuite les informations
   * détaillées nécessaires au poste opérateur :
   * produit, image, landing page, notes vendeur, historique,
   * analyse IA, etc.
   */
  const selectOrder = async (order: Order) => {
    const requestedOrderId = order._id;

    // Affichage immédiat de la commande issue de la liste.
    setSelectedOrder(order);
    setClientDraft(buildClientDraft(order));
    setClientSaveMessage('');
    setClientSaveError('');

    setOrderDraft(buildOrderDraft(order));
    setOrderSaveMessage('');
    setOrderSaveError('');
    setAttemptSaveMessage('');
    setAttemptError('');
    setShowAttemptModal(false);
    setShowThirdAttemptCancelModal(false);

    try {
      const response = await api.get(
        `/api/orders/${requestedOrderId}`
      );

      if (!response.data) {
        return;
      }

      /*
       * Empêcher une ancienne requête de remplacer la
       * commande si l'opérateur a cliqué entre-temps
       * sur une autre commande.
       */
      setSelectedOrder(current =>
        current?._id === requestedOrderId
          ? response.data
          : current
      );

      setClientDraft(current =>
        current?.orderId === requestedOrderId
          ? buildClientDraft(response.data)
          : current
      );

      setOrderDraft(current =>
        current?.orderId === requestedOrderId
          ? buildOrderDraft(response.data)
          : current
      );
    } catch (error) {
      logger.error(
        'Impossible de charger la fiche complète de la commande:',
        error,
        'Queue'
      );
    }
  }

  const addAdditionalPhone = () => {
    setClientDraft(current => {
      if (!current || current.additionalPhones.length >= 10) {
        return current
      }

      return {
        ...current,
        additionalPhones: [
          ...current.additionalPhones,
          '',
        ],
      }
    })
  }

  const updateAdditionalPhone = (
    index: number,
    value: string
  ) => {
    setClientDraft(current => {
      if (!current) return current

      const phones = [...current.additionalPhones]
      phones[index] = value

      return {
        ...current,
        additionalPhones: phones,
      }
    })
  }

  const removeAdditionalPhone = (index: number) => {
    setClientDraft(current => {
      if (!current) return current

      return {
        ...current,
        additionalPhones:
          current.additionalPhones.filter(
            (_, phoneIndex) => phoneIndex !== index
          ),
      }
    })
  }

  /**
   * Sauvegarder les informations client sans modifier
   * les autres données de la commande.
   */
  const saveClientDetails = async () => {
    if (!selectedOrder || !clientDraft) return

    const name = clientDraft.name.trim()
    const phone = clientDraft.phone.trim()

    if (!name) {
      setClientSaveError('Le nom du client est obligatoire.')
      return
    }

    if (!phone) {
      setClientSaveError(
        'Le téléphone principal est obligatoire.'
      )
      return
    }

    setSavingClient(true)
    setClientSaveError('')
    setClientSaveMessage('')

    try {
      const response = await api.patch(
        `/api/orders/${selectedOrder._id}/operator-details`,
        {
          clientInfo: {
            name,
            phone,
            additionalPhones:
              clientDraft.additionalPhones
                .map(value => value.trim())
                .filter(Boolean),
            address: {
              street: clientDraft.street.trim(),
              city: clientDraft.city.trim(),
              state: clientDraft.governorate.trim(),
            },
          },
        }
      )

      const updatedOrder = response.data as Order

      setSelectedOrder(updatedOrder)
      setClientDraft(buildClientDraft(updatedOrder))

      // Garder également la liste de gauche synchronisée.
      setOrders(current =>
        current.map(order =>
          order._id === updatedOrder._id
            ? updatedOrder
            : order
        )
      )

      setClientSaveMessage(
        'Informations client enregistrées.'
      )
    } catch (error) {
      logger.error(
        'Impossible de sauvegarder les informations client:',
        error,
        'Queue'
      )

      setClientSaveError(
        "Impossible d'enregistrer les informations client."
      )
    } finally {
      setSavingClient(false)
    }
  }

  const updateOrderItemDraft = (
    index: number,
    field: 'quantity' | 'price',
    value: string
  ) => {
    setOrderDraft(current => {
      if (!current) return current

      const items = [...current.items]

      items[index] = {
        ...items[index],
        [field]: value,
      }

      return {
        ...current,
        items,
      }
    })
  }

  const changeOrderItemProduct = (
    index: number,
    productId: string
  ) => {
    const selectedProduct =
      shopProducts.find(
        product => product._id === productId
      )

    if (!selectedProduct) {
      return
    }

    setOrderDraft(current => {
      if (!current) {
        return current
      }

      const items = [...current.items]

      if (!items[index]) {
        return current
      }

      items[index] = {
        ...items[index],
        productId: selectedProduct._id,
        name: selectedProduct.name,
        price: String(selectedProduct.price ?? 0),
      }

      return {
        ...current,
        items,
      }
    })

    setOrderSaveMessage('')
    setOrderSaveError('')
  }


  const saveOrderDetails = async () => {
    if (!selectedOrder || !orderDraft) return

    if (
      orderDraft.items.some(
        item => !item.id
      )
    ) {
      setOrderSaveError(
        "Un article de la commande n'a pas d'identifiant valide."
      )
      return
    }

    const invalidItem = orderDraft.items.some(item => {
      const quantity = Number(item.quantity)
      const price = Number(item.price)

      return (
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        !Number.isFinite(price) ||
        price < 0
      )
    })

    if (invalidItem) {
      setOrderSaveError(
        'Vérifiez les quantités et les prix.'
      )
      return
    }

    const deliveryFee = Number(orderDraft.deliveryFee)

    if (
      !Number.isFinite(deliveryFee) ||
      deliveryFee < 0
    ) {
      setOrderSaveError(
        'Les frais de livraison sont invalides.'
      )
      return
    }

    setSavingOrder(true)
    setOrderSaveError('')
    setOrderSaveMessage('')

    try {
      const response = await api.patch(
        `/api/orders/${selectedOrder._id}/operator-details`,
        {
          items: orderDraft.items.map(item => ({
            _id: item.id,
            productId: item.productId || '',
            name: item.name,
            quantity: Number(item.quantity),
            price: Number(item.price),
          })),
          deliveryFee,
        }
      )

      const updatedOrder = response.data as Order

      setSelectedOrder(updatedOrder)
      setOrderDraft(buildOrderDraft(updatedOrder))

      setOrders(current =>
        current.map(order =>
          order._id === updatedOrder._id
            ? updatedOrder
            : order
        )
      )

      setOrderSaveMessage(
        'Commande enregistrée.'
      )
    } catch (error) {
      logger.error(
        'Impossible de sauvegarder la commande:',
        error,
        'Queue'
      )

      setOrderSaveError(
        "Impossible d'enregistrer la commande."
      )
    } finally {
      setSavingOrder(false)
    }
  }

  const recordedAttempts =
    useMemo(
      () =>
        getRecordedCallAttempts(
          selectedOrder
        ),
      [selectedOrder]
    )

  const nextAttemptNumber:
    | 1
    | 2
    | 3
    | null =
      recordedAttempts.length >= 3
        ? null
        : (recordedAttempts.length + 1) as
            | 1
            | 2
            | 3

  const openAttemptModal = (
    number: 1 | 2 | 3
  ) => {
    if (
      nextAttemptNumber !== number
    ) {
      return
    }

    setAttemptNumber(number)
    setAttemptReason('')
    setAttemptNotes('')
    setAttemptError('')
    setAttemptSaveMessage('')
    setShowAttemptModal(true)
  }

  const saveCallAttempt = async () => {
    if (!selectedOrder) return

    setSavingAttempt(true)
    setAttemptError('')
    setAttemptSaveMessage('')

    try {
      const response = await api.post(
        `/api/orders/${selectedOrder._id}/call-attempt`,
        {
          attemptNumber,
          reason:
            attemptReason || '',
          notes:
            attemptNotes.trim(),
        }
      )

      const result =
        response.data as CallAttemptApiResponse

      /*
       * Recharger la fiche complète afin de conserver
       * produit, image, notes propriétaire, IA, etc.
       */
      const detailsResponse =
        await api.get(
          `/api/orders/${selectedOrder._id}`
        )

      const updatedOrder =
        detailsResponse.data as Order

      setSelectedOrder(updatedOrder)

      setOrders(current =>
        current.map(order =>
          order._id === updatedOrder._id
            ? updatedOrder
            : order
        )
      )

      setShowAttemptModal(false)

      setAttemptSaveMessage(
        `Tentative ${result.attemptNumber} enregistrée.`
      )

      if (
        result.requiresCancellationConfirmation
      ) {
        setShowThirdAttemptCancelModal(
          true
        )
      }
    } catch (error) {
      logger.error(
        "Impossible d'enregistrer la tentative:",
        error,
        'Queue'
      )

      setAttemptError(
        "Impossible d'enregistrer cette tentative."
      )
    } finally {
      setSavingAttempt(false)
    }
  }

  const confirmThirdAttemptCancellation =
    async () => {
      if (!selectedOrder) return

      setConfirmingThirdAttemptCancel(
        true
      )
      setAttemptError('')

      try {
        await api.post(
          `/api/orders/${selectedOrder._id}/call-attempt/confirm-cancellation`,
          {}
        )

        setShowThirdAttemptCancelModal(
          false
        )

        await fetchOrders()
        resetState()
      } catch (error) {
        logger.error(
          "Impossible d'annuler la commande après la troisième tentative:",
          error,
          'Queue'
        )

        setAttemptError(
          "Impossible de finaliser l'annulation."
        )
      } finally {
        setConfirmingThirdAttemptCancel(
          false
        )
      }
    }

  const startCallTimer = () => {
    const alreadyElapsed =
      Math.max(0, callElapsedSeconds)

    setCallStartedAt(
      Date.now() - alreadyElapsed * 1000
    )

    setCallTimerActive(true)
  }

  const finishCallTimer = () => {
    if (callStartedAt) {
      setCallElapsedSeconds(
        Math.max(
          1,
          Math.round(
            (Date.now() - callStartedAt) / 1000
          )
        )
      )
    }

    setCallTimerActive(false)
  }

  const formatCallTimer = (
    totalSeconds: number
  ) => {
    const minutes =
      Math.floor(totalSeconds / 60)

    const seconds =
      totalSeconds % 60

    return `${String(minutes).padStart(
      2,
      '0'
    )}:${String(seconds).padStart(
      2,
      '0'
    )}`
  }

  const openConfirmationModal = async () => {
    if (callTimerActive && callStartedAt) {
      setCallElapsedSeconds(
        Math.max(
          1,
          Math.round(
            (Date.now() - callStartedAt) / 1000
          )
        )
      )

      setCallTimerActive(false)
    }

    setFeedbackFormConfig(null)
    setFeedbackResponses({})
    setConfirmationNotes('')
    setConfirmationError('')
    setShowConfirmationModal(true)
    setLoadingFeedbackForm(true)

    try {
      const response = await api.get(
        '/api/orders/operator-feedback/questions'
      )

      const formConfig =
        response.data as OperatorFeedbackFormConfig

      if (
        !formConfig ||
        !Array.isArray(formConfig.categories) ||
        !Array.isArray(formConfig.questions)
      ) {
        throw new Error(
          'Configuration du retour opérateur invalide.'
        )
      }

      setFeedbackFormConfig(formConfig)
    } catch (error) {
      logger.error(
        'Impossible de charger le formulaire opérateur:',
        error,
        'Queue'
      )

      setConfirmationError(
        "Impossible de charger le formulaire de retour. Fermez puis réessayez."
      )
    } finally {
      setLoadingFeedbackForm(false)
    }
  }

  const toggleFeedbackAnswer = (
    question: OperatorFeedbackQuestion,
    answerKey: string
  ) => {
    setFeedbackResponses(current => {
      const selected =
        current[question.key] || []

      if (question.type === 'single_choice') {
        return {
          ...current,
          [question.key]: [answerKey],
        }
      }

      if (selected.includes(answerKey)) {
        return {
          ...current,
          [question.key]:
            selected.filter(
              key => key !== answerKey
            ),
        }
      }

      const maxSelections =
        typeof question.maxSelections ===
          'number' &&
        question.maxSelections > 0
          ? question.maxSelections
          : question.answers.length

      if (selected.length >= maxSelections) {
        return current
      }

      return {
        ...current,
        [question.key]: [
          ...selected,
          answerKey,
        ],
      }
    })

    setConfirmationError('')
  }

  /**
   * Confirmation finale après saisie du
   * Retour opérateur structuré.
   */
  const confirmOrder = async () => {
    if (!selectedOrder) return

    if (loadingFeedbackForm) {
      setConfirmationError(
        'Le formulaire est encore en cours de chargement.'
      )
      return
    }

    if (!feedbackFormConfig) {
      setConfirmationError(
        'Le formulaire de retour opérateur est indisponible.'
      )
      return
    }

    const activeQuestions =
      feedbackFormConfig.enabled
        ? feedbackFormConfig.questions
        : []

    const missingQuestion =
      activeQuestions.find(
        question =>
          question.required &&
          (
            feedbackResponses[
              question.key
            ] || []
          ).length === 0
      )

    if (missingQuestion) {
      setConfirmationError(
        `Répondez à la question obligatoire : ${missingQuestion.title}.`
      )
      return
    }

    const responses =
      activeQuestions
        .map(question => ({
          questionKey:
            question.key,

          answerKeys:
            feedbackResponses[
              question.key
            ] || [],
        }))
        .filter(
          response =>
            response.answerKeys.length > 0
        )

    setProcessing(true)
    setConfirmationError('')

    try {
      await api.post(
        `/api/orders/${selectedOrder._id}/operator-actions/confirm`,
        {
          responses,

          duration:
            callElapsedSeconds > 0
              ? callElapsedSeconds
              : undefined,

          notes:
            confirmationNotes.trim(),
        }
      )

      setShowConfirmationModal(false)

      await fetchOrders()
      resetState()
    } catch (error) {
      logger.error(
        'Impossible de confirmer la commande avec le retour opérateur:',
        error,
        'Queue'
      )

      setConfirmationError(
        "Impossible d'enregistrer le retour et de confirmer la commande."
      )
    } finally {
      setProcessing(false)
    }
  }

  /**
   * Reporter une commande.
   *
   * Date obligatoire.
   * Heure et note facultatives.
   */
  const postponeOrder = async () => {
    if (!selectedOrder) return

    if (!postponeDate) {
      setPostponeError(
        'La date de disponibilité du client est obligatoire.'
      )
      return
    }

    const postponeDateISO =
      frenchDateToISO(postponeDate)

    if (!postponeDateISO) {
      setPostponeError(
        'Saisissez une date valide au format JJ/MM/AAAA.'
      )
      return
    }

    setSavingPostpone(true)
    setPostponeError('')

    try {
      await api.post(
        `/api/orders/${selectedOrder._id}/operator-actions/postpone`,
        {
          date: postponeDateISO,
          time: postponeTime || '',
          note: postponeNote.trim(),
          timezoneOffsetMinutes:
            new Date().getTimezoneOffset(),
        }
      )

      setShowPostponeModal(false)

      await fetchOrders()
      resetState()
    } catch (error) {
      logger.error(
        'Impossible de reporter la commande:',
        error,
        'Queue'
      )

      setPostponeError(
        'Impossible de reporter cette commande. Vérifiez que la date choisie est dans le futur.'
      )
    } finally {
      setSavingPostpone(false)
    }
  }


  /**
   * Annuler une commande.
   * Le motif et le commentaire sont facultatifs.
   */
  const cancelOrder = async () => {
    if (!selectedOrder) return

    setProcessing(true)
    setCancellationError('')

    try {
      await api.post(
        `/api/orders/${selectedOrder._id}/operator-actions/cancel`,
        {
          reason: cancellationReason || '',
          comment: cancellationComment.trim(),
        }
      )

      setShowCancellationModal(false)

      await fetchOrders()
      resetState()
    } catch (error) {
      logger.error(
        "Impossible d'annuler la commande:",
        error,
        'Queue'
      )

      setCancellationError(
        "Impossible d'annuler cette commande."
      )
    } finally {
      setProcessing(false)
    }
  }

  const resetState = () => {
    setSelectedOrder(null)
    setClientDraft(null)
    setClientSaveMessage('')
    setClientSaveError('')
    setOrderDraft(null)
    setOrderSaveMessage('')
    setOrderSaveError('')
    setShowAttemptModal(false)
    setAttemptReason('')
    setAttemptNotes('')
    setAttemptError('')
    setAttemptSaveMessage('')
    setShowThirdAttemptCancelModal(false)
    setCancellationReason('')
    setCancellationComment('')
    setCancellationError('')
    setShowPostponeModal(false)
    setPostponeDate('')
    setPostponeTime('')
    setPostponeNote('')
    setPostponeError('')
    setShowConfirmationModal(false)
    setFeedbackFormConfig(null)
    setFeedbackResponses({})
    setLoadingFeedbackForm(false)
    setConfirmationNotes('')
    setConfirmationError('')
    setCallStartedAt(null)
    setCallElapsedSeconds(0)
    setCallTimerActive(false)
  }

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 30000)
    return () => clearInterval(interval)
  }, [])


  return (
    <ProtectedRoute allowedRoles={['operator']}>
      <DashboardLayout userRole="operator">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">{"File d'appels"}</h1>
            <p className="text-sm dark:text-slate-400 light:text-gray-600 mt-1">
              Appels sortants • {sortedOrders.length} en attente
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Orders List - Sorted by priority then AI score */}
            <div className="lg:col-span-1">
              <div className="card p-4">
                <div className="mb-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h2 className="font-semibold">
                      En attente ({sortedOrders.length})
                    </h2>

                    {queueSearch.trim() && (
                      <span className="text-xs dark:text-slate-400 light:text-gray-500">
                        {filteredOrders.length}{' '}
                        {filteredOrders.length > 1
                          ? 'résultats'
                          : 'résultat'}
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <MagnifyingGlassIcon
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 dark:text-slate-400 light:text-gray-500"
                    />

                    <input
                      type="search"
                      value={queueSearch}
                      onChange={event =>
                        setQueueSearch(event.target.value)
                      }
                      placeholder="N° commande, client ou téléphone"
                      className="w-full rounded-lg border py-2.5 pl-9 pr-9 text-sm outline-none transition-colors dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 focus:dark:border-blue-500 light:border-gray-300 light:bg-white light:text-gray-900 light:placeholder:text-gray-400 focus:light:border-blue-500"
                    />

                    {queueSearch && (
                      <button
                        type="button"
                        onClick={() => setQueueSearch('')}
                        title="Effacer la recherche"
                        aria-label="Effacer la recherche"
                        className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md transition-colors dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white light:text-gray-500 light:hover:bg-gray-100 light:hover:text-gray-900"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {loading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse p-3 rounded-lg dark:bg-slate-800 light:bg-gray-100 h-24" />
                    ))}
                  </div>
                ) : sortedOrders.length === 0 ? (
                  /* Empty queue state - Requirements: 5.6 */
                  <div className="text-center py-8">
                    <CheckCircleIcon className="h-12 w-12 mx-auto mb-2 text-green-500" />
                    <p className="text-lg font-medium mb-1">{"File d'attente vide"}</p>
                    <p className="text-sm dark:text-slate-400 light:text-gray-600">
                      Aucune commande en attente à traiter
                    </p>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="py-8 text-center">
                    <MagnifyingGlassIcon className="mx-auto mb-2 h-10 w-10 dark:text-slate-600 light:text-gray-400" />
                    <p className="mb-1 font-medium">
                      Aucune commande trouvée
                    </p>
                    <p className="text-sm dark:text-slate-400 light:text-gray-600">
                      Essayez avec le numéro de commande,
                      le nom du client ou son téléphone.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                    {filteredOrders.map((order) => (
                      <div
                        key={order._id}
                        onClick={() => selectOrder(order)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedOrder?._id === order._id
                            ? 'bg-blue-500 text-white'
                            : 'dark:bg-slate-800 dark:hover:bg-slate-700 light:bg-gray-50 light:hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">#{order.confirmedId}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(order.priority)}`}>
                              {getPriorityLabel(order.priority)}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm font-medium">{order.clientInfo.name}</p>
                        <p className="text-xs opacity-75">{order.clientInfo.phone}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-semibold">{formatCurrency(order.totalAmount)}</span>
                          {getOrderAIScore(order) !== undefined && (
                            <span
                              className={`text-xs font-medium ${
                                selectedOrder?._id === order._id
                                  ? 'text-white'
                                  : getAIScoreColor(
                                      getOrderAIScore(order)
                                    )
                              }`}
                            >
                              Score IA : {getOrderAIScore(order)}%
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Call Interface */}
            <div className="lg:col-span-2">
              <div className="card p-6 min-h-96">
                {!selectedOrder ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <PhoneIcon className="h-16 w-16 mb-4 dark:text-slate-600 light:text-gray-400" />
                    <h3 className="text-xl font-semibold mb-2">Prêt à appeler</h3>
                    <p className="text-sm dark:text-slate-400 light:text-gray-600">{"Sélectionnez une commande dans la file pour commencer l'appel"}</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Order Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-semibold">{selectedOrder.clientInfo.name}</h2>
                        <p className="text-sm dark:text-slate-400 light:text-gray-600">
                          Commande #{selectedOrder.confirmedId}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm ${getPriorityColor(selectedOrder.priority)}`}>
                          {getPriorityLabel(selectedOrder.priority)}
                        </span>
                        {getOrderAIScore(selectedOrder) !== undefined && (
                          <span
                            className={`rounded-full bg-gray-100 px-3 py-1 text-sm dark:bg-slate-700 ${getAIScoreColor(
                              getOrderAIScore(selectedOrder)
                            )}`}
                          >
                            Score IA : {getOrderAIScore(selectedOrder)}%
                          </span>
                        )}

                        {selectedOrder.riskLevel && (
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm dark:bg-slate-700">
                            Risque : {getRiskLevelLabel(
                              selectedOrder.riskLevel
                            )}
                          </span>
                        )}

                        {selectedOrder.aiDecision && (
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm dark:bg-slate-700">
                            Décision : {getAIDecisionLabel(
                              selectedOrder.aiDecision
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Customer and Order Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Client */}
                      <div className="card p-4">
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <div>
                            <h3 className="font-semibold">
                              Client
                            </h3>
                            <p className="mt-1 text-xs dark:text-slate-400 light:text-gray-500">
                              {"Informations modifiables pendant l'appel"}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={saveClientDetails}
                            disabled={
                              savingClient ||
                              !clientDraft
                            }
                            className="rounded-lg bg-[#ADFF2F] px-3 py-2 text-sm font-semibold text-gray-900 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {savingClient
                              ? 'Enregistrement...'
                              : 'Enregistrer'}
                          </button>
                        </div>

                        {!clientDraft ? (
                          <div className="animate-pulse space-y-3">
                            <div className="h-10 rounded-lg dark:bg-slate-800 light:bg-gray-100" />
                            <div className="h-10 rounded-lg dark:bg-slate-800 light:bg-gray-100" />
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {/* Identité */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-xs font-medium dark:text-slate-400 light:text-gray-600">
                                  Nom du client
                                </label>
                                <input
                                  type="text"
                                  value={clientDraft.name}
                                  onChange={event =>
                                    setClientDraft(current =>
                                      current
                                        ? {
                                            ...current,
                                            name: event.target.value,
                                          }
                                        : current
                                    )
                                  }
                                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-[#ADFF2F]/40 dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white"
                                />
                              </div>

                              <div>
                                <label className="mb-1 block text-xs font-medium dark:text-slate-400 light:text-gray-600">
                                  Téléphone principal
                                </label>
                                <input
                                  type="tel"
                                  value={clientDraft.phone}
                                  onChange={event =>
                                    setClientDraft(current =>
                                      current
                                        ? {
                                            ...current,
                                            phone: event.target.value,
                                          }
                                        : current
                                    )
                                  }
                                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-[#ADFF2F]/40 dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white"
                                />
                              </div>
                            </div>

                            {/* Téléphones supplémentaires */}
                            <div>
                              <div className="mb-2 flex items-center justify-between gap-3">
                                <label className="text-xs font-medium dark:text-slate-400 light:text-gray-600">
                                  Téléphones supplémentaires
                                </label>

                                <button
                                  type="button"
                                  onClick={addAdditionalPhone}
                                  disabled={
                                    clientDraft.additionalPhones.length >= 10
                                  }
                                  className="text-xs font-semibold text-blue-500 hover:text-blue-400 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  + Ajouter un numéro
                                </button>
                              </div>

                              {clientDraft.additionalPhones.length === 0 ? (
                                <p className="rounded-lg border border-dashed px-3 py-2 text-xs dark:border-slate-700 dark:text-slate-500 light:border-gray-300 light:text-gray-500">
                                  Aucun numéro supplémentaire
                                </p>
                              ) : (
                                <div className="space-y-2">
                                  {clientDraft.additionalPhones.map(
                                    (phone, index) => (
                                      <div
                                        key={`${clientDraft.orderId}-phone-${index}`}
                                        className="flex items-center gap-2"
                                      >
                                        <input
                                          type="tel"
                                          value={phone}
                                          placeholder={`Téléphone ${index + 2}`}
                                          onChange={event =>
                                            updateAdditionalPhone(
                                              index,
                                              event.target.value
                                            )
                                          }
                                          className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-[#ADFF2F]/40 dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white"
                                        />

                                        <button
                                          type="button"
                                          onClick={() =>
                                            removeAdditionalPhone(index)
                                          }
                                          className="rounded-lg border px-3 py-2 text-xs font-medium text-red-500 transition hover:bg-red-500/10 dark:border-slate-700 light:border-gray-300"
                                        >
                                          Supprimer
                                        </button>
                                      </div>
                                    )
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Livraison */}
                            <div className="border-t pt-4 dark:border-slate-700 light:border-gray-200">
                              <p className="mb-3 text-sm font-semibold">
                                Livraison
                              </p>

                              <div className="space-y-3">
                                <div>
                                  <label className="mb-1 block text-xs font-medium dark:text-slate-400 light:text-gray-600">
                                    Adresse
                                  </label>
                                  <input
                                    type="text"
                                    value={clientDraft.street}
                                    onChange={event =>
                                      setClientDraft(current =>
                                        current
                                          ? {
                                              ...current,
                                              street: event.target.value,
                                            }
                                          : current
                                      )
                                    }
                                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-[#ADFF2F]/40 dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white"
                                  />
                                </div>

                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                  <div>
                                    <label className="mb-1 block text-xs font-medium dark:text-slate-400 light:text-gray-600">
                                      Ville
                                    </label>
                                    <input
                                      type="text"
                                      value={clientDraft.city}
                                      onChange={event =>
                                        setClientDraft(current =>
                                          current
                                            ? {
                                                ...current,
                                                city: event.target.value,
                                              }
                                            : current
                                        )
                                      }
                                      className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-[#ADFF2F]/40 dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white"
                                    />
                                  </div>

                                  <div>
                                    <label className="mb-1 block text-xs font-medium dark:text-slate-400 light:text-gray-600">
                                      Gouvernorat
                                    </label>

                                    <select
                                      value={clientDraft.governorate}
                                      onChange={event =>
                                        setClientDraft(current =>
                                          current
                                            ? {
                                                ...current,
                                                governorate:
                                                  event.target.value,
                                              }
                                            : current
                                        )
                                      }
                                      className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-[#ADFF2F]/40 dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white"
                                    >
                                      <option value="">
                                        Sélectionner
                                      </option>

                                      {clientDraft.governorate &&
                                        !TUNISIA_GOVERNORATES.includes(
                                          clientDraft.governorate as typeof TUNISIA_GOVERNORATES[number]
                                        ) && (
                                          <option
                                            value={clientDraft.governorate}
                                          >
                                            {clientDraft.governorate}
                                          </option>
                                        )}

                                      {TUNISIA_GOVERNORATES.map(
                                        governorate => (
                                          <option
                                            key={governorate}
                                            value={governorate}
                                          >
                                            {governorate}
                                          </option>
                                        )
                                      )}
                                    </select>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {selectedOrder.clientInfo.email && (
                              <div className="border-t pt-3 text-xs dark:border-slate-700 light:border-gray-200">
                                <span className="dark:text-slate-400 light:text-gray-500">
                                  E-mail :
                                </span>{' '}
                                <span className="font-medium">
                                  {selectedOrder.clientInfo.email}
                                </span>
                              </div>
                            )}

                            {clientSaveError && (
                              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                                {clientSaveError}
                              </p>
                            )}

                            {clientSaveMessage && (
                              <p className="rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-500">
                                {clientSaveMessage}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Commande */}
                      <div className="card p-4">
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <div>
                            <h3 className="font-semibold">
                              Commande
                            </h3>
                            <p className="mt-1 text-xs dark:text-slate-400 light:text-gray-500">
                              Quantité, prix et livraison
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={saveOrderDetails}
                            disabled={
                              savingOrder ||
                              !orderDraft
                            }
                            className="rounded-lg bg-[#ADFF2F] px-3 py-2 text-sm font-semibold text-gray-900 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {savingOrder
                              ? 'Enregistrement...'
                              : 'Enregistrer'}
                          </button>
                        </div>

                        {!orderDraft ? (
                          <div className="animate-pulse space-y-3">
                            <div className="h-20 rounded-lg dark:bg-slate-800 light:bg-gray-100" />
                            <div className="h-10 rounded-lg dark:bg-slate-800 light:bg-gray-100" />
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {loadingShopProducts && (
                              <p className="rounded-lg bg-blue-500/10 px-3 py-2 text-xs text-blue-400">
                                Chargement du catalogue produits...
                              </p>
                            )}

                            {shopProductsError && (
                              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
                                {shopProductsError}
                              </p>
                            )}

                            {orderDraft.items.map(
                              (draftItem, index) => {
                                const sourceItem =
                                  selectedOrder.items.find(
                                    item =>
                                      item._id === draftItem.id
                                  ) ||
                                  selectedOrder.items[index]

                                const sourceProduct =
                                  sourceItem &&
                                  typeof sourceItem.productId === 'object'
                                    ? sourceItem.productId
                                    : null

                                const selectedCatalogProduct =
                                  draftItem.productId
                                    ? shopProducts.find(
                                        catalogProduct =>
                                          catalogProduct._id ===
                                          draftItem.productId
                                      ) || null
                                    : null

                                const product =
                                  draftItem.productId
                                    ? selectedCatalogProduct ||
                                      sourceProduct
                                    : null

                                const quantity =
                                  Number(draftItem.quantity)

                                const price =
                                  Number(draftItem.price)

                                const lineTotal =
                                  Number.isFinite(quantity) &&
                                  Number.isFinite(price)
                                    ? quantity * price
                                    : 0

                                return (
                                  <div
                                    key={
                                      draftItem.id ||
                                      `${selectedOrder._id}-${index}`
                                    }
                                    className="rounded-xl border p-3 dark:border-slate-700 light:border-gray-200"
                                  >
                                    <div className="mb-3 flex gap-3">
                                      <ProductImagePreview
                                        src={product?.imageUrl}
                                        alt={
                                          draftItem.name ||
                                          'Produit'
                                        }
                                      />

                                      <div className="min-w-0 flex-1">
                                        <label className="mb-1 block text-xs font-medium dark:text-slate-400 light:text-gray-600">
                                          Produit
                                        </label>

                                        <select
                                          value={draftItem.productId}
                                          onChange={event =>
                                            changeOrderItemProduct(
                                              index,
                                              event.target.value
                                            )
                                          }
                                          disabled={loadingShopProducts}
                                          className="mb-2 w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 light:border-gray-300 light:bg-white"
                                        >
                                          <option value="" disabled>
                                            Sélectionner un produit
                                          </option>

                                          {draftItem.productId &&
                                            !shopProducts.some(
                                              catalogProduct =>
                                                catalogProduct._id ===
                                                draftItem.productId
                                            ) && (
                                              <option
                                                value={draftItem.productId}
                                              >
                                                {draftItem.name} — produit actuel
                                              </option>
                                            )}

                                          {shopProducts.map(
                                            catalogProduct => (
                                              <option
                                                key={catalogProduct._id}
                                                value={catalogProduct._id}
                                              >
                                                {catalogProduct.name}
                                                {' — '}
                                                {formatCurrency(
                                                  catalogProduct.price ?? 0
                                                )}
                                              </option>
                                            )
                                          )}
                                        </select>

                                        <p className="text-sm font-semibold">
                                          {draftItem.name ||
                                            'Produit sans nom'}
                                        </p>

                                        {product?.productLink && (
                                          <a
                                            href={product.productLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-1 inline-block text-xs font-medium text-blue-500 hover:underline"
                                          >
                                            Ouvrir la page produit
                                          </a>
                                        )}
                                      </div>
                                    </div>

                                    {product?.description && (
                                      <div className="mb-3 rounded-lg bg-slate-800/50 px-3 py-2">
                                        <p className="mb-1 text-xs font-semibold dark:text-slate-300 light:text-gray-700">
                                          Description du produit
                                        </p>
                                        <p className="text-xs leading-relaxed dark:text-slate-400 light:text-gray-600">
                                          {product.description}
                                        </p>
                                      </div>
                                    )}

                                    <div className="mb-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                                      <p className="mb-1 text-xs font-semibold text-amber-400">
                                        Notes du propriétaire
                                      </p>

                                      <p className="text-xs leading-relaxed dark:text-slate-300 light:text-gray-700">
                                        {product?.sellerNotes?.trim()
                                          ? product.sellerNotes
                                          : 'Aucune note du propriétaire pour ce produit.'}
                                      </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="mb-1 block text-xs font-medium dark:text-slate-400 light:text-gray-600">
                                          Quantité
                                        </label>

                                        <input
                                          type="number"
                                          min="1"
                                          step="1"
                                          value={draftItem.quantity}
                                          onChange={event =>
                                            updateOrderItemDraft(
                                              index,
                                              'quantity',
                                              event.target.value
                                            )
                                          }
                                          className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-[#ADFF2F]/40 dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white"
                                        />
                                      </div>

                                      <div>
                                        <label className="mb-1 block text-xs font-medium dark:text-slate-400 light:text-gray-600">
                                          Prix unitaire
                                        </label>

                                        <input
                                          type="number"
                                          min="0"
                                          step="0.001"
                                          value={draftItem.price}
                                          onChange={event =>
                                            updateOrderItemDraft(
                                              index,
                                              'price',
                                              event.target.value
                                            )
                                          }
                                          className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-[#ADFF2F]/40 dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white"
                                        />
                                      </div>
                                    </div>

                                    <div className="mt-3 flex justify-between border-t pt-2 text-xs dark:border-slate-700 light:border-gray-200">
                                      <span className="dark:text-slate-400 light:text-gray-500">
                                        Sous-total
                                      </span>
                                      <span className="font-semibold">
                                        {formatCurrency(lineTotal)}
                                      </span>
                                    </div>
                                  </div>
                                )
                              }
                            )}

                            <div className="border-t pt-4 dark:border-slate-700 light:border-gray-200">
                              <label className="mb-1 block text-xs font-medium dark:text-slate-400 light:text-gray-600">
                                Frais de livraison
                              </label>

                              <input
                                type="number"
                                min="0"
                                step="0.001"
                                value={orderDraft.deliveryFee}
                                onChange={event =>
                                  setOrderDraft(current =>
                                    current
                                      ? {
                                          ...current,
                                          deliveryFee:
                                            event.target.value,
                                        }
                                      : current
                                  )
                                }
                                className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-[#ADFF2F]/40 dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white"
                              />
                            </div>

                            <div className="flex items-center justify-between rounded-lg bg-green-500/10 px-3 py-3">
                              <span className="font-semibold">
                                Total
                              </span>

                              <span className="text-lg font-bold text-green-500">
                                {formatCurrency(
                                  calculateOrderDraftTotal(
                                    orderDraft
                                  )
                                )}
                              </span>
                            </div>

                            {orderSaveError && (
                              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                                {orderSaveError}
                              </p>
                            )}

                            {orderSaveMessage && (
                              <p className="rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-500">
                                {orderSaveMessage}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                    </div>


                    {/* Tentatives de contact */}
                    <div className="card p-4">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <h3 className="font-semibold">
                            {"Tentatives d'appel"}
                          </h3>
                          <p className="mt-1 text-xs dark:text-slate-400 light:text-gray-500">
                            {recordedAttempts.length} / 3 enregistrées
                          </p>
                        </div>

                        {recordedAttempts.length === 3 && (
                          <button
                            type="button"
                            onClick={() =>
                              setShowThirdAttemptCancelModal(true)
                            }
                            className="rounded-lg border border-red-500/40 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/10"
                          >
                            {"Finaliser l'annulation"}
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {([1, 2, 3] as const).map(number => {
                          const completed =
                            recordedAttempts.includes(number)

                          const active =
                            nextAttemptNumber === number

                          return (
                            <button
                              key={number}
                              type="button"
                              disabled={
                                completed ||
                                !active ||
                                processing ||
                                savingAttempt
                              }
                              onClick={() =>
                                openAttemptModal(number)
                              }
                              className={`rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                                completed
                                  ? 'border-green-500/30 bg-green-500/10 text-green-500'
                                  : active
                                    ? 'border-blue-500 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
                                    : 'cursor-not-allowed border-slate-700 text-slate-500 opacity-50'
                              }`}
                            >
                              {completed
                                ? `Tentative ${number} enregistrée`
                                : `Tentative ${number}`}
                            </button>
                          )
                        })}
                      </div>

                      <p className="mt-3 text-xs dark:text-slate-500 light:text-gray-500">
                        Les tentatives 1 et 2 conservent la commande dans la file. Après la tentative 3, une confirmation est demandée avant annulation.
                      </p>

                      {attemptSaveMessage && (
                        <p className="mt-3 rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-500">
                          {attemptSaveMessage}
                        </p>
                      )}

                      {attemptError &&
                        !showAttemptModal &&
                        !showThirdAttemptCancelModal && (
                          <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                            {attemptError}
                          </p>
                        )}
                    </div>

                    {/* Chronomètre de l'appel */}
                    <div className="rounded-xl border border-blue-500/20 bg-blue-500/[0.05] p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold">
                            Durée de l&apos;appel
                          </p>

                          <p className="mt-1 font-mono text-2xl font-bold tracking-wider text-blue-400">
                            {formatCallTimer(
                              callElapsedSeconds
                            )}
                          </p>

                          <p className="mt-1 text-xs dark:text-slate-400 light:text-gray-500">
                            Cette durée sera enregistrée dans le retour d&apos;appel.
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {!callTimerActive ? (
                            <button
                              type="button"
                              onClick={startCallTimer}
                              disabled={processing}
                              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-50"
                            >
                              <PhoneIcon className="h-5 w-5" />

                              {callElapsedSeconds > 0
                                ? "Reprendre l'appel"
                                : "Démarrer l'appel"}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={finishCallTimer}
                              className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-400 transition hover:bg-amber-500/20"
                            >
                              Terminer l&apos;appel
                            </button>
                          )}

                          {callElapsedSeconds > 0 &&
                            !callTimerActive && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCallStartedAt(null)
                                  setCallElapsedSeconds(0)
                                }}
                                className="rounded-lg border px-4 py-2.5 text-sm font-medium dark:border-slate-700 light:border-gray-300"
                              >
                                Réinitialiser
                              </button>
                            )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <button
                        type="button"
                        onClick={openConfirmationModal}
                        disabled={
                          processing ||
                          (
                            !callTimerActive &&
                            callElapsedSeconds <= 0
                          )
                        }
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        <CheckCircleIcon className="h-5 w-5" />
                        {processing ? 'Traitement...' : 'Confirmer'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPostponeDate('')
                          setPostponeTime('')
                          setPostponeNote('')
                          setPostponeError('')
                          setShowPostponeModal(true)
                        }}
                        disabled={processing}
                        className="flex items-center justify-center px-6 py-3 border border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        Reporter
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCancellationReason('')
                          setCancellationComment('')
                          setCancellationError('')
                          setShowCancellationModal(true)
                        }}
                        disabled={processing}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        <XCircleIcon className="h-5 w-5" />
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Retour opérateur */}
        {showConfirmationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="card max-h-[90vh] w-full max-w-3xl overflow-y-auto p-6">
              <div className="mb-6">
                <h3 className="flex items-center gap-2 text-xl font-semibold">
                  <PhoneIcon className="h-6 w-6 text-green-500" />
                  Retour opérateur
                </h3>

                <p className="mt-1 text-sm dark:text-slate-400 light:text-gray-600">
                  {"Renseignez les principales observations effectuées pendant l'appel."}
                </p>
              </div>

              <div className="space-y-6">
                {loadingFeedbackForm ? (
                  <div className="rounded-xl border p-5 text-sm dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300 light:border-gray-200 light:bg-gray-50 light:text-gray-600">
                    Chargement du formulaire de retour...
                  </div>
                ) : feedbackFormConfig ? (
                  feedbackFormConfig.enabled ? (
                    <div className="space-y-6">
                      {feedbackFormConfig.categories.map(
                        category => {
                          const categoryQuestions =
                            feedbackFormConfig.questions.filter(
                              question =>
                                question.categoryKey ===
                                category.key
                            )

                          if (
                            categoryQuestions.length === 0
                          ) {
                            return null
                          }

                          return (
                            <section
                              key={category.key}
                              className="space-y-4"
                            >
                              <div className="border-b pb-2 dark:border-slate-700 light:border-gray-200">
                                <h4 className="font-semibold">
                                  {category.label}
                                </h4>
                              </div>

                              {categoryQuestions.map(
                                question => {
                                  const selectedAnswers =
                                    feedbackResponses[
                                      question.key
                                    ] || []

                                  const maxSelections =
                                    question.type ===
                                      'single_choice'
                                      ? 1
                                      : (
                                          typeof question.maxSelections ===
                                            'number' &&
                                          question.maxSelections > 0
                                            ? question.maxSelections
                                            : question.answers.length
                                        )

                                  return (
                                    <div
                                      key={question.key}
                                      className="rounded-xl border p-4 dark:border-slate-700 dark:bg-slate-900/40 light:border-gray-200 light:bg-gray-50/70"
                                    >
                                      <div className="mb-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                          <label className="text-sm font-semibold">
                                            {question.title}

                                            {question.required && (
                                              <span className="ml-2 text-xs font-normal text-red-400">
                                                obligatoire
                                              </span>
                                            )}
                                          </label>

                                          <span className="text-xs dark:text-slate-400 light:text-gray-500">
                                            {question.type ===
                                            'multiple_choice'
                                              ? `${selectedAnswers.length} / ${maxSelections}`
                                              : 'Choix unique'}
                                          </span>
                                        </div>

                                        {question.prompt && (
                                          <p className="mt-1 text-xs dark:text-slate-400 light:text-gray-600">
                                            {question.prompt}
                                          </p>
                                        )}
                                      </div>

                                      <div className="flex flex-wrap gap-2">
                                        {question.answers.map(
                                          answer => {
                                            const selected =
                                              selectedAnswers.includes(
                                                answer.key
                                              )

                                            const disabled =
                                              question.type ===
                                                'multiple_choice' &&
                                              !selected &&
                                              selectedAnswers.length >=
                                                maxSelections

                                            return (
                                              <button
                                                key={answer.key}
                                                type="button"
                                                aria-pressed={
                                                  selected
                                                }
                                                disabled={
                                                  disabled
                                                }
                                                onClick={() =>
                                                  toggleFeedbackAnswer(
                                                    question,
                                                    answer.key
                                                  )
                                                }
                                                className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                                                  selected
                                                    ? 'border-green-500 bg-green-500/15 text-green-400'
                                                    : disabled
                                                      ? 'cursor-not-allowed border-slate-700 opacity-40'
                                                      : 'border-slate-600 hover:border-green-500/60'
                                                }`}
                                              >
                                                {answer.label}
                                              </button>
                                            )
                                          }
                                        )}
                                      </div>
                                    </div>
                                  )
                                }
                              )}
                            </section>
                          )
                        }
                      )}

                      {feedbackFormConfig.questions.length ===
                        0 && (
                        <p className="rounded-xl border p-4 text-sm dark:border-slate-700 dark:text-slate-300 light:border-gray-200 light:text-gray-600">
                          Aucune question active n’est configurée.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="rounded-xl border p-4 text-sm dark:border-slate-700 dark:text-slate-300 light:border-gray-200 light:text-gray-600">
                      Le retour opérateur est actuellement désactivé. Vous pouvez confirmer la commande sans questionnaire.
                    </p>
                  )
                ) : (
                  <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
                    Le formulaire de retour n’est pas disponible.
                  </p>
                )}

                {/* Note */}
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Note opérateur
                    <span className="ml-2 text-xs font-normal dark:text-slate-500 light:text-gray-500">
                      facultative
                    </span>
                  </label>

                  <textarea
                    rows={3}
                    maxLength={1500}
                    value={confirmationNotes}
                    onChange={event =>
                      setConfirmationNotes(
                        event.target.value
                      )
                    }
                    placeholder="Ajouter une information importante concernant l'appel..."
                    className="w-full rounded-lg border p-3 dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white"
                  />
                </div>

                {confirmationError && (
                  <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                    {confirmationError}
                  </p>
                )}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => {
                    setShowConfirmationModal(false)
                    setConfirmationError('')
                  }}
                  className="flex-1 rounded-lg border px-4 py-3 dark:border-slate-700 light:border-gray-300"
                >
                  Annuler
                </button>

                <button
                  type="button"
                  disabled={
                    processing ||
                    loadingFeedbackForm ||
                    !feedbackFormConfig
                  }
                  onClick={confirmOrder}
                  className="flex-1 rounded-lg bg-green-500 px-4 py-3 font-semibold text-white transition hover:bg-green-600 disabled:opacity-50"
                >
                  {loadingFeedbackForm
                    ? 'Chargement...'
                    : processing
                      ? 'Enregistrement...'
                      : 'Enregistrer le retour et confirmer'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Reportée */}
        {showPostponeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="card mx-4 w-full max-w-md p-6">
              <div className="mb-5">
                <h3 className="text-lg font-semibold">
                  Reporter la commande
                </h3>

                <p className="mt-1 text-sm dark:text-slate-400 light:text-gray-600">
                  {"Le client a confirmé la commande mais souhaite être rappelé à une date ultérieure."}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Date de disponibilité du client
                    <span className="ml-2 text-xs text-red-400">
                      obligatoire
                    </span>
                  </label>

                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="JJ/MM/AAAA"
                    value={postponeDate}
                    onChange={event => {
                      setPostponeDate(
                        formatFrenchDateInput(
                          event.target.value
                        )
                      )
                      setPostponeError('')
                    }}
                    className="w-full rounded-lg border p-3 outline-none dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Heure de disponibilité
                    <span className="ml-2 text-xs font-normal dark:text-slate-500 light:text-gray-500">
                      facultative
                    </span>
                  </label>

                  <input
                    type="time"
                    value={postponeTime}
                    onChange={event => {
                      setPostponeTime(event.target.value)
                      setPostponeError('')
                    }}
                    className="w-full rounded-lg border p-3 outline-none dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Note pour le propriétaire
                    <span className="ml-2 text-xs font-normal dark:text-slate-500 light:text-gray-500">
                      facultative
                    </span>
                  </label>

                  <textarea
                    value={postponeNote}
                    onChange={event =>
                      setPostponeNote(event.target.value)
                    }
                    rows={3}
                    maxLength={1000}
                    placeholder="Ajouter une information utile pour le propriétaire..."
                    className="w-full rounded-lg border p-3 outline-none dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white"
                  />
                </div>

                {postponeError && (
                  <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                    {postponeError}
                  </p>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPostponeModal(false)
                    setPostponeDate('')
                    setPostponeTime('')
                    setPostponeNote('')
                    setPostponeError('')
                  }}
                  disabled={savingPostpone}
                  className="flex-1 rounded-lg border px-4 py-2 dark:border-slate-700 light:border-gray-300"
                >
                  Annuler
                </button>

                <button
                  type="button"
                  onClick={postponeOrder}
                  disabled={savingPostpone}
                  className="flex-1 rounded-lg bg-amber-500 px-4 py-2 font-medium text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
                >
                  {savingPostpone
                    ? 'Enregistrement...'
                    : 'Enregistrer et reporter'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Tentative */}
        {showAttemptModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="card mx-4 w-full max-w-md p-6">
              <div className="mb-5">
                <h3 className="text-lg font-semibold">
                  Tentative {attemptNumber}
                </h3>

                <p className="mt-1 text-sm dark:text-slate-400 light:text-gray-600">
                  Enregistrer le résultat de cette tentative de contact.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Motif
                    <span className="ml-2 text-xs font-normal dark:text-slate-500 light:text-gray-500">
                      facultatif
                    </span>
                  </label>

                  <select
                    value={attemptReason}
                    onChange={event =>
                      setAttemptReason(
                        event.target.value as
                          | OperatorCallAttemptReason
                          | ''
                      )
                    }
                    className="w-full rounded-lg border p-3 outline-none dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white"
                  >
                    {CALL_ATTEMPT_REASONS.map(reason => (
                      <option
                        key={reason.value || 'none'}
                        value={reason.value}
                      >
                        {reason.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Note
                    <span className="ml-2 text-xs font-normal dark:text-slate-500 light:text-gray-500">
                      facultative
                    </span>
                  </label>

                  <textarea
                    value={attemptNotes}
                    onChange={event =>
                      setAttemptNotes(
                        event.target.value
                      )
                    }
                    rows={3}
                    placeholder="Ajouter une note..."
                    className="w-full rounded-lg border p-3 outline-none dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white"
                  />
                </div>

                {attemptError && (
                  <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                    {attemptError}
                  </p>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAttemptModal(false)
                    setAttemptError('')
                  }}
                  disabled={savingAttempt}
                  className="flex-1 rounded-lg border px-4 py-2 dark:border-slate-700 light:border-gray-300"
                >
                  Retour
                </button>

                <button
                  type="button"
                  onClick={saveCallAttempt}
                  disabled={savingAttempt}
                  className="flex-1 rounded-lg bg-blue-500 px-4 py-2 font-medium text-white transition hover:bg-blue-600 disabled:opacity-50"
                >
                  {savingAttempt
                    ? 'Enregistrement...'
                    : 'Enregistrer la tentative'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation après Tentative 3 */}
        {showThirdAttemptCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="card mx-4 w-full max-w-md p-6">
              <h3 className="text-lg font-semibold">
                Troisième tentative enregistrée
              </h3>

              <p className="mt-3 text-sm leading-relaxed dark:text-slate-300 light:text-gray-700">
                {"Les trois tentatives de contact ont été enregistrées. Confirmez-vous l'annulation de cette commande ?"}
              </p>

              <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-3">
                <p className="text-xs dark:text-slate-400 light:text-gray-600">
                  Motif automatique
                </p>
                <p className="mt-1 text-sm font-semibold text-red-400">
                  Client injoignable après 3 tentatives
                </p>
              </div>

              {attemptError && (
                <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  {attemptError}
                </p>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowThirdAttemptCancelModal(false)
                    setAttemptError('')
                  }}
                  disabled={confirmingThirdAttemptCancel}
                  className="flex-1 rounded-lg border px-4 py-2 dark:border-slate-700 light:border-gray-300"
                >
                  Retour
                </button>

                <button
                  type="button"
                  onClick={confirmThirdAttemptCancellation}
                  disabled={confirmingThirdAttemptCancel}
                  className="flex-1 rounded-lg bg-red-500 px-4 py-2 font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
                >
                  {confirmingThirdAttemptCancel
                    ? 'Annulation...'
                    : "Confirmer l'annulation"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Annulation */}
        {showCancellationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="card mx-4 w-full max-w-md p-6">
              <div className="mb-5 flex items-start gap-3">
                <ExclamationTriangleIcon className="mt-0.5 h-6 w-6 flex-none text-red-500" />

                <div>
                  <h3 className="text-lg font-semibold">
                    Annuler cette commande ?
                  </h3>

                  <p className="mt-1 text-sm dark:text-slate-400 light:text-gray-600">
                    Le motif et le commentaire sont facultatifs.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Motif
                    <span className="ml-2 text-xs font-normal dark:text-slate-500 light:text-gray-500">
                      facultatif
                    </span>
                  </label>

                  <select
                    value={cancellationReason}
                    onChange={event =>
                      setCancellationReason(
                        event.target.value as
                          | OperatorCancellationReason
                          | ''
                      )
                    }
                    className="w-full rounded-lg border p-3 outline-none dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white"
                  >
                    {OPERATOR_CANCELLATION_REASONS.map(reason => (
                      <option
                        key={reason.value || 'none'}
                        value={reason.value}
                      >
                        {reason.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Commentaire
                    <span className="ml-2 text-xs font-normal dark:text-slate-500 light:text-gray-500">
                      facultatif
                    </span>
                  </label>

                  <textarea
                    value={cancellationComment}
                    onChange={event =>
                      setCancellationComment(event.target.value)
                    }
                    rows={3}
                    maxLength={1000}
                    placeholder="Ajouter un commentaire..."
                    className="w-full rounded-lg border p-3 outline-none dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white"
                  />
                </div>

                {cancellationError && (
                  <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                    {cancellationError}
                  </p>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCancellationModal(false)
                    setCancellationReason('')
                    setCancellationComment('')
                    setCancellationError('')
                  }}
                  disabled={processing}
                  className="flex-1 rounded-lg border px-4 py-2 dark:border-slate-700 light:border-gray-300"
                >
                  Retour
                </button>

                <button
                  type="button"
                  onClick={cancelOrder}
                  disabled={processing}
                  className="flex-1 rounded-lg bg-red-500 px-4 py-2 font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
                >
                  {processing
                    ? 'Annulation...'
                    : "Confirmer l'annulation"}
                </button>
              </div>
            </div>
          </div>
        )}

      </DashboardLayout>
    </ProtectedRoute>
  )
}
