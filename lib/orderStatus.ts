import type { OrderStatus } from '@/types/order'

/**
 * AI information becomes visible only once the order
 * has reached a confirmed business state.
 */
export const AI_VISIBLE_ORDER_STATUSES: OrderStatus[] = [
  'confirmed',
  'shipped',
  'delivered',
  'failed_delivery',
]

export function canDisplayOrderAI(
  status: OrderStatus
): boolean {
  return AI_VISIBLE_ORDER_STATUSES.includes(status)
}
