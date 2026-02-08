/**
 * Support Card Service - API methods for QR code support card generation
 * Requirements: 4.1, 4.2
 */

import api from '@/lib/api';
import { SupportCard } from '@/types/complaint';

/**
 * Support Card Service
 * Handles QR code generation for order support cards
 */
export const supportCardService = {
  /**
   * Generate a support card QR code for a single order
   * Requirements: 4.1
   * 
   * @param orderId - The order ID to generate a support card for
   * @returns Support card with QR code URL, base64 image, and token
   */
  async generateSingle(orderId: string): Promise<SupportCard> {
    const response = await api.post('/api/support-cards/generate', {
      orderId,
    });
    // Handle response wrapped in { success, data } structure
    return response.data.data || response.data;
  },

  /**
   * Generate support cards for multiple orders in bulk
   * Requirements: 4.2
   * 
   * @param orderIds - Array of order IDs to generate support cards for
   * @returns Array of support cards with QR codes
   */
  async generateBulk(orderIds: string[]): Promise<SupportCard[]> {
    const response = await api.post('/api/support-cards/generate-bulk', {
      orderIds,
    });
    // Handle response wrapped in { success, data } structure
    const data = response.data.data || response.data;
    return data.supportCards || data;
  },
};

export default supportCardService;
