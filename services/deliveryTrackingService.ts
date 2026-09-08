import api from '@/lib/api'

export interface DeliveryShipmentTracking {
  shipmentId: string
  provider: string
  state: string
  correlationId: string | null
  trackingNumber: string | null
  providerStatusCode: string | number | null
  providerStatusLabel: string | null
  lastSyncedAt: string | null
  createdAt?: string
  updatedAt?: string
}

interface DeliveryTrackingResponse {
  success: boolean
  orderId: string
  remoteCallPerformed: boolean
  tracking: DeliveryShipmentTracking[]
}

/**
 * Lit uniquement le dernier état enregistré dans Confirmed.
 *
 * Cet appel NE contacte PAS le transporteur.
 * L'auto-sync backend se charge de mettre ces données à jour.
 */

/**
 * Transforme le statut technique du transporteur
 * en libellé clair pour le commerçant.
 *
 * IMPORTANT :
 * chaque transporteur conserve son propre mapping.
 * Le statut brut reste stocké côté backend.
 */
export function getDeliveryStatusDisplayLabel(
  provider: string | null | undefined,
  statusCode: string | number | null | undefined,
  statusLabel: string | null | undefined
): string | null {
  const normalizedProvider =
    String(provider || '')
      .trim()
      .toLowerCase()

  const numericCode =
    statusCode == null
      ? null
      : Number(statusCode)

  if (
    normalizedProvider === 'intigo' &&
    Number.isInteger(numericCode)
  ) {
    const code =
      numericCode as number

    if (code === 99) {
      return 'Réacheminement en cours'
    }

    if (code === 1000) {
      return 'En attente de collecte'
    }

    if (code >= 1001 && code <= 1008) {
      return 'Collecte en cours'
    }

    if (code >= 1100 && code <= 1102) {
      return 'Collecte annulée'
    }

    if (
      code === 2000 ||
      code === 2001 ||
      code === 2004 ||
      code === 2100
    ) {
      return 'Au centre de tri'
    }

    if (code === 3100) {
      return 'En transfert vers livraison'
    }

    if (code === 3201) {
      return 'Retour en cours'
    }

    if (code === 4000) {
      return 'En cours de livraison'
    }

    if (code === 5000) {
      return 'Livré'
    }

    if (code === 6000) {
      return 'Retour en préparation'
    }

    if (code === 6001) {
      return 'Retour prêt'
    }

    if (code === 6500) {
      return 'Retour / échange en cours'
    }

    if (code === 6900) {
      return 'Retour reçu'
    }

    if (code >= 9000 && code <= 9004) {
      return 'Livraison annulée'
    }
  }

  /*
   * Pour les autres transporteurs :
   * on conserve leur libellé réel tant qu'un mapping
   * spécifique n'a pas encore été défini.
   */
  if (statusLabel) {
    return statusLabel
  }

  if (statusCode != null) {
    return `Statut ${String(statusCode)}`
  }

  return null
}

export const deliveryTrackingService = {
  async getOrderTracking(
    orderId: string
  ): Promise<DeliveryShipmentTracking[]> {
    const response =
      await api.get(
        `/api/delivery/shipments/${orderId}/tracking`
      )

    const payload =
      response.data as DeliveryTrackingResponse

    if (!Array.isArray(payload.tracking)) {
      return []
    }

    return payload.tracking
  },
}

export default deliveryTrackingService
