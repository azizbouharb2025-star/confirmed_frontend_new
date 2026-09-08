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
