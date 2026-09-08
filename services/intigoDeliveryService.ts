import api from '@/lib/api'

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

/**
 * Analyse des commandes avant envoi Intigo.
 *
 * IMPORTANT :
 * - dryRun=true obligatoire
 * - aucune création de colis
 * - aucune réservation
 * - aucun dispatch réel
 */
export const intigoDeliveryService = {
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
}

export default intigoDeliveryService
