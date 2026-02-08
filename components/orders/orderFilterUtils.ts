/**
 * Order Filter Utility Functions
 * Shared filter functions for order management
 */

import type { Order, ShopRef } from '@/types/order'

/**
 * Filter orders by shop ID
 * Property 15: Admin shop filter returns shop-specific orders
 * Validates: Requirements 6.2
 */
export function filterByShop(orders: Order[], shopId: string | undefined): Order[] {
  if (!shopId || shopId === '') {
    return orders
  }
  
  return orders.filter((order) => {
    const orderShopId = typeof order.shopId === 'string' 
      ? order.shopId 
      : (order.shopId as ShopRef)?._id
    return orderShopId === shopId
  })
}
