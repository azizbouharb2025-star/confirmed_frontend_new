import api from '@/lib/api'

export interface ColissimoCapabilities {
  success: boolean
  provider: 'colissimo'
  liveDispatchEnabled: boolean
  requiresExplicitConfirmation: boolean
  maxLiveOrdersPerDispatch: number
  trackingImplemented: boolean
  remoteCallPerformed?: boolean
}

export interface ColissimoPreviewItem {
  orderId?: string
  confirmedId?: number
  correlationId?: string
  status?: 'READY' | 'REVIEW' | 'INVALID'
  state?: string
  externalId?: string | null
  warnings?: string[]
  errors?: string[]

  payload?: {
    prix?: string
    gouvernerat?: string
    ville?: string
    adresse?: string
    tel?: string
    tel2?: string
    designation?: string
    nb_article?: number
    msg?: string
    echange?: string
    article?: string
    nb_echange?: number
    ouvrir?: number
    fragile?: number
    type_colis?: number
  }
}

export interface ColissimoPreviewResult {
  success: boolean
  provider: 'colissimo'

  selected: number
  ready: number
  review: number
  invalid: number

  remoteCallPerformed?: boolean

  items: ColissimoPreviewItem[]
}

export interface ColissimoReservationItem {
  shipmentId?: string
  orderId?: string
  confirmedId?: number
  correlationId?: string
  state?: string
  externalId?: string | null
  warnings?: string[]
  errors?: string[]
}

export interface ColissimoReservationResult {
  success: boolean
  provider: 'colissimo'
  reservationOnly?: boolean
  reservationId: string
  reservationExpiresAt?: string | null
  remoteCallPerformed?: boolean

  summary?: {
    selected?: number
    ready?: number
    review?: number
    reserved?: number
    invalid?: number
    duplicate?: number
  }

  reserved?: ColissimoReservationItem[]
  duplicate?: ColissimoReservationItem[]
  invalid?: ColissimoReservationItem[]
}

export interface ColissimoActiveReservation {
  success: boolean
  provider: 'colissimo'
  orderId: string
  state: 'preparing'
  correlationId?: string | null
  reservationId: string
  reservedAt?: string | null
  reservationExpiresAt?: string | null
  externalId?: string | null

  metadata?: {
    typeColis?: number
    ouvrir?: boolean
    fragile?: boolean
    governorate?: string
    city?: string
  }

  remoteCallPerformed?: boolean
  databaseMutationPerformed?: boolean
}

export interface ColissimoDispatchPreviewItem {
  shipmentId?: string
  orderId?: string
  confirmedId?: number
  correlationId?: string
  payloadHash?: string

  destination?: {
    governorate?: string | null
    city?: string | null
  }

  parcel?: {
    articleCount?: number
    typeColis?: number
    ouvrir?: number
    fragile?: number
    exchange?: string
  }

  amount?: string
}

export interface ColissimoDispatchPreview {
  success: boolean
  provider: 'colissimo'
  reservationId: string
  reservationExpiresAt?: string | null

  integration?: {
    configured?: boolean
    active?: boolean
    addTokenConfigured?: boolean
    trackingTokenConfigured?: boolean
    readyForLiveCreate?: boolean
  }

  endpoint?: string
  method?: string

  summary?: {
    reserved?: number
    wouldPost?: number
    invalid?: number
  }

  wouldPost?: ColissimoDispatchPreviewItem[]
  invalid?: ColissimoPreviewItem[]

  remoteCallPerformed?: boolean
  databaseMutationPerformed?: boolean
}

export interface ColissimoDispatchResult {
  success: boolean
  provider: 'colissimo'
  remoteCallPerformed: boolean

  shipmentId?: string
  orderId?: string
  confirmedId?: number
  correlationId?: string

  state?: string

  externalId: string
  trackingNumber?: string

  labelUrl?: string | null
  zebraLabelUrl?: string | null

  payloadHash?: string
  orderSyncWarning?: string | null
}

export interface ColissimoOptions {
  typeColis: 1 | 2 | 3
  ouvrir: boolean
  fragile: boolean
}

/**
 * Flux API Colissimo.
 *
 * previewOrders:
 *   analyse uniquement.
 *
 * reserveOrders:
 *   crée uniquement une réservation locale Confirmed.
 *
 * previewReservation:
 *   dernier contrôle avant envoi.
 *
 * dispatchReservation:
 *   endpoint LIVE réel.
 *
 * Le backend garde toujours le verrou
 * COLISSIMO_LIVE_DISPATCH_ENABLED.
 */
export const colissimoDeliveryService = {
  async getCapabilities(): Promise<ColissimoCapabilities> {
    const response =
      await api.get(
        '/api/delivery/colissimo/capabilities'
      )

    return response.data as ColissimoCapabilities
  },

  async previewOrders(
    orderIds: string[],
    options: ColissimoOptions
  ): Promise<ColissimoPreviewResult> {
    const response =
      await api.post(
        '/api/delivery/colissimo/preview',
        {
          orderIds,

          typeColis:
            options.typeColis,

          ouvrir:
            options.ouvrir,

          fragile:
            options.fragile,
        }
      )

    return response.data as ColissimoPreviewResult
  },

  async reserveOrders(
    orderIds: string[],
    options: ColissimoOptions,
    allowReview = false
  ): Promise<ColissimoReservationResult> {
    const response =
      await api.post(
        '/api/delivery/colissimo/reservations',
        {
          orderIds,

          typeColis:
            options.typeColis,

          ouvrir:
            options.ouvrir,

          fragile:
            options.fragile,

          allowReview,
        }
      )

    return response.data as ColissimoReservationResult
  },

  async getActiveReservation(
    orderId: string
  ): Promise<ColissimoActiveReservation> {
    const response =
      await api.get(
        `/api/delivery/colissimo/reservations/${orderId}`
      )

    return response.data as ColissimoActiveReservation
  },

  async previewReservation(
    reservationId: string
  ): Promise<ColissimoDispatchPreview> {
    const response =
      await api.post(
        '/api/delivery/colissimo/dispatch-preview',
        {
          reservationId,
        }
      )

    return response.data as ColissimoDispatchPreview
  },

  async dispatchReservation(params: {
    reservationId: string
    expectedCorrelationId: string
    expectedPayloadHash: string
  }): Promise<ColissimoDispatchResult> {
    const response =
      await api.post(
        '/api/delivery/colissimo/dispatch',
        {
          reservationId:
            params.reservationId,

          expectedCorrelationId:
            params.expectedCorrelationId,

          expectedPayloadHash:
            params.expectedPayloadHash,

          confirm:
            true,
        }
      )

    return response.data as ColissimoDispatchResult
  },
}

export default colissimoDeliveryService
