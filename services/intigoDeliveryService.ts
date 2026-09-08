import api from '@/lib/api'

export interface IntigoCapabilities {
  success: boolean
  provider: 'intigo'
  liveDispatchEnabled: boolean
  requiresExplicitConfirmation: boolean
  maxLiveOrdersPerDispatch: number
  remoteCallPerformed?: boolean
}

export interface IntigoPreviewItem {
  orderId?: string
  confirmedId?: number
  cid?: string
  correlationId?: string
  state?: string
  externalId?: string | null
  warnings?: string[]
  errors?: string[]
}

export interface IntigoDryRunPreview {
  success: boolean
  provider: 'intigo'
  dryRun?: boolean
  remoteMutationPerformed?: boolean
  allowReview?: boolean

  integration?: {
    ready?: boolean
    pickupIndex?: number
  }

  summary?: {
    selected?: number
    ready?: number
    review?: number
    reviewBlocked?: number
    duplicate?: number
    invalid?: number
  }

  ready?: IntigoPreviewItem[]
  review?: IntigoPreviewItem[]
  reviewBlocked?: IntigoPreviewItem[]
  duplicate?: IntigoPreviewItem[]
  invalid?: IntigoPreviewItem[]
}

export interface IntigoReservationResult {
  success: boolean
  provider: 'intigo'
  reservationOnly: boolean
  reservationId: string
  reservationExpiresAt?: string | null
  allowReview: boolean

  summary?: {
    selected?: number
    ready?: number
    review?: number
    reserved?: number
    reviewBlocked?: number
    duplicate?: number
    invalid?: number
  }

  reserved?: IntigoPreviewItem[]
  reviewBlocked?: IntigoPreviewItem[]
  duplicate?: IntigoPreviewItem[]
  invalid?: IntigoPreviewItem[]
}

export interface IntigoDispatchPreviewItem {
  shipmentId?: string
  orderId?: string
  confirmedId?: number
  correlationId?: string

  currentState?: string
  proposedState?: string

  request?: {
    method?: string
    resource?: string
  }

  city_name?: string | null
  district_name?: string | null

  pickupIndex?: number
  price?: number

  payloadHash?: string
}

export interface IntigoDispatchPreview {
  success?: boolean
  provider?: 'intigo'
  reservationId?: string
  reservationExpiresAt?: string | null

  summary?: {
    reserved?: number
    wouldPost?: number
    invalid?: number
  }

  wouldPost?: IntigoDispatchPreviewItem[]
  invalid?: IntigoPreviewItem[]
}

/**
 * Toutes les fonctions ci-dessous restent AVANT le dispatch réel.
 *
 * previewOrders:
 *   analyse uniquement.
 *
 * reserveOrders:
 *   écrit une réservation LOCALE dans Confirmed.
 *   Aucun colis Intigo créé.
 *
 * previewReservation:
 *   dernier contrôle avant dispatch.
 *   Aucun colis Intigo créé.
 */
export const intigoDeliveryService = {
  async getCapabilities(): Promise<IntigoCapabilities> {
    const response =
      await api.get(
        '/api/delivery/intigo/capabilities'
      )

    return response.data as IntigoCapabilities
  },

  async previewOrders(
    orderIds: string[]
  ): Promise<IntigoDryRunPreview> {
    const response =
      await api.post(
        '/api/delivery/intigo/shipments',
        {
          orderIds,
          dryRun: true,
          allowReview: false,
        }
      )

    return response.data as IntigoDryRunPreview
  },

  async reserveOrders(
    orderIds: string[],
    allowReview: boolean
  ): Promise<IntigoReservationResult> {
    const response =
      await api.post(
        '/api/delivery/intigo/reservations',
        {
          orderIds,
          allowReview,
        }
      )

    return response.data as IntigoReservationResult
  },

  async previewReservation(
    reservationId: string
  ): Promise<IntigoDispatchPreview> {
    const response =
      await api.post(
        '/api/delivery/intigo/dispatch-preview',
        {
          reservationId,
        }
      )

    return response.data as IntigoDispatchPreview
  },
}

export default intigoDeliveryService
