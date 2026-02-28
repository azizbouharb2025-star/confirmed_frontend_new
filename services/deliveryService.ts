/**
 * Delivery Service
 * Handles delivery provider management, encryption, and status synchronization
 * Requirements: 2.1, 2.2, 2.4, 2.5, 2.7
 */

import {
  DeliveryProvider,
  DeliveryProviderConfig,
  DeliveryProviderType,
  DeliveryStatus,
  DeliveryStatusUpdate,
  CreateDeliveryProviderRequest,
  DeliveryAPILog,
} from '@/types/delivery';
import { OrderStatus } from '@/types/order';
import logger from '@/lib/logger';

/**
 * Simple encryption utility for API credentials
 * In production, use a proper encryption library like crypto-js or node:crypto
 * Requirements: 2.2 - Secure credential storage
 */
export function encryptCredential(credential: string): string {
  // TODO: Implement proper encryption in production
  // For now, use base64 encoding as a placeholder
  if (!credential) return '';
  return Buffer.from(credential).toString('base64');
}

/**
 * Simple decryption utility for API credentials
 * Requirements: 2.2 - Secure credential storage
 */
export function decryptCredential(encryptedCredential: string): string {
  // TODO: Implement proper decryption in production
  if (!encryptedCredential) return '';
  return Buffer.from(encryptedCredential, 'base64').toString('utf-8');
}

/**
 * Map external delivery status to internal order status
 * Requirements: 2.4 - Automatic status synchronization
 */
export function mapDeliveryStatusToOrderStatus(
  deliveryStatus: DeliveryStatus
): OrderStatus {
  const statusMap: Record<DeliveryStatus, OrderStatus> = {
    pending_pickup: 'confirmed',
    picked_up: 'shipped',
    in_transit: 'shipped',
    out_for_delivery: 'shipped',
    delivered: 'delivered',
    failed: 'failed_delivery',
    returned: 'cancelled',
  };

  return statusMap[deliveryStatus] || 'in_progress';
}

/**
 * Map internal order status to external delivery status
 */
export function mapOrderStatusToDeliveryStatus(
  orderStatus: OrderStatus
): DeliveryStatus {
  const statusMap: Record<OrderStatus, DeliveryStatus> = {
    pending: 'pending_pickup',
    assigned: 'pending_pickup',
    in_progress: 'pending_pickup',
    confirmed: 'pending_pickup',
    rejected: 'failed',
    cancelled: 'returned',
    shipped: 'in_transit',
    delivered: 'delivered',
    failed_delivery: 'failed',
  };

  return statusMap[orderStatus] || 'pending_pickup';
}

/**
 * Validate delivery provider configuration
 */
export function validateProviderConfig(
  config: DeliveryProviderConfig
): { valid: boolean; error?: string } {
  if (config.syncInterval < 1) {
    return { valid: false, error: 'Sync interval must be at least 1 minute' };
  }

  if (config.syncInterval > 1440) {
    return { valid: false, error: 'Sync interval cannot exceed 24 hours (1440 minutes)' };
  }

  if (!Array.isArray(config.supportedRegions)) {
    return { valid: false, error: 'Supported regions must be an array' };
  }

  return { valid: true };
}

/**
 * Validate delivery provider request
 */
export function validateProviderRequest(
  request: CreateDeliveryProviderRequest
): { valid: boolean; error?: string } {
  if (!request.name || request.name.trim().length === 0) {
    return { valid: false, error: 'Provider name is required' };
  }

  if (!request.type || !['aramex', 'dhl', 'fedex', 'custom'].includes(request.type)) {
    return { valid: false, error: 'Invalid provider type' };
  }

  if (!request.apiEndpoint || !isValidUrl(request.apiEndpoint)) {
    return { valid: false, error: 'Valid API endpoint URL is required' };
  }

  if (!request.apiKey || request.apiKey.trim().length === 0) {
    return { valid: false, error: 'API key is required' };
  }

  const configValidation = validateProviderConfig(request.config);
  if (!configValidation.valid) {
    return configValidation;
  }

  return { valid: true };
}

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Create a delivery provider
 * Requirements: 2.1, 2.2
 */
export function createDeliveryProvider(
  shopId: string,
  request: CreateDeliveryProviderRequest
): DeliveryProvider {
  const now = new Date().toISOString();

  return {
    _id: `provider_${Date.now()}`,
    shopId,
    name: request.name,
    type: request.type,
    apiEndpoint: request.apiEndpoint,
    apiKey: encryptCredential(request.apiKey),
    apiSecret: request.apiSecret ? encryptCredential(request.apiSecret) : undefined,
    isActive: true,
    config: request.config,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Create a delivery API log entry
 * Requirements: 2.7 - Log all delivery API interactions
 */
export function createDeliveryAPILog(
  providerId: string,
  providerName: string,
  action: DeliveryAPILog['action'],
  status: 'success' | 'failed',
  options?: {
    requestData?: any;
    responseData?: any;
    errorMessage?: string;
    duration?: number;
  }
): DeliveryAPILog {
  return {
    _id: `log_${Date.now()}`,
    providerId,
    providerName,
    action,
    status,
    requestData: options?.requestData,
    responseData: options?.responseData,
    errorMessage: options?.errorMessage,
    timestamp: new Date().toISOString(),
    duration: options?.duration,
  };
}

/**
 * Test connection to delivery provider API
 * This is a mock implementation - actual implementation would make real API calls
 */
export async function testProviderConnection(
  provider: DeliveryProvider
): Promise<{ success: boolean; message: string; latency?: number }> {
  const startTime = Date.now();

  try {
    // TODO: Implement actual API connection test
    // For now, simulate a connection test
    await new Promise((resolve) => setTimeout(resolve, 500));

    const latency = Date.now() - startTime;

    // Log the test
    const log = createDeliveryAPILog(
      provider._id,
      provider.name,
      'test_connection',
      'success',
      { duration: latency }
    );

    logger.info('Delivery provider connection test successful', log, 'DeliveryService');

    return {
      success: true,
      message: 'Connection successful',
      latency,
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Log the failure
    const log = createDeliveryAPILog(
      provider._id,
      provider.name,
      'test_connection',
      'failed',
      { errorMessage, duration: latency }
    );

    logger.error('Delivery provider connection test failed', log, 'DeliveryService');

    return {
      success: false,
      message: errorMessage,
      latency,
    };
  }
}

/**
 * Sync delivery statuses from external provider
 * Requirements: 2.4 - Automatic status synchronization
 * This is a mock implementation - actual implementation would make real API calls
 */
export async function syncDeliveryStatuses(
  provider: DeliveryProvider,
  orderIds?: string[]
): Promise<{
  success: boolean;
  syncedOrders: number;
  failedOrders: number;
  errors: Array<{ orderId: string; error: string }>;
}> {
  const startTime = Date.now();
  const result = {
    success: true,
    syncedOrders: 0,
    failedOrders: 0,
    errors: [] as Array<{ orderId: string; error: string }>,
  };

  try {
    // TODO: Implement actual API sync
    // For now, simulate a sync operation
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock: Assume we synced some orders
    result.syncedOrders = orderIds?.length || 0;

    const duration = Date.now() - startTime;

    // Log the sync
    const log = createDeliveryAPILog(
      provider._id,
      provider.name,
      'sync',
      'success',
      {
        requestData: { orderIds },
        responseData: result,
        duration,
      }
    );

    logger.info('Delivery status sync completed', log, 'DeliveryService');

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    result.success = false;
    result.failedOrders = orderIds?.length || 0;

    // Log the failure
    const log = createDeliveryAPILog(
      provider._id,
      provider.name,
      'sync',
      'failed',
      { errorMessage, duration }
    );

    logger.error('Delivery status sync failed', log, 'DeliveryService');

    return result;
  }
}

/**
 * Process a delivery status update from webhook or sync
 * Requirements: 2.4 - Automatic status synchronization
 */
export function processDeliveryStatusUpdate(
  update: DeliveryStatusUpdate
): {
  orderId: string;
  newStatus: OrderStatus;
  deliveryInfo: {
    trackingNumber: string;
    status: DeliveryStatus;
    location?: string;
    timestamp: string;
    notes?: string;
  };
} {
  return {
    orderId: update.orderId,
    newStatus: mapDeliveryStatusToOrderStatus(update.status),
    deliveryInfo: {
      trackingNumber: update.trackingNumber,
      status: update.status,
      location: update.location,
      timestamp: update.timestamp,
      notes: update.notes,
    },
  };
}

/**
 * Mock data for development
 * Requirements: 2.6 - Function with mock data when APIs unavailable
 */
export function getMockDeliveryProviders(shopId: string): DeliveryProvider[] {
  const now = new Date().toISOString();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  return [
    {
      _id: 'provider_1',
      shopId,
      name: 'Aramex Morocco',
      type: 'aramex',
      apiEndpoint: 'https://api.aramex.com/v1',
      apiKey: encryptCredential('mock_aramex_key_123'),
      apiSecret: encryptCredential('mock_aramex_secret_456'),
      isActive: true,
      lastSyncAt: yesterday,
      lastSyncStatus: 'success',
      config: {
        autoSync: true,
        syncInterval: 30,
        supportedRegions: ['Casablanca', 'Rabat', 'Marrakech', 'Tangier'],
      },
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: yesterday,
    },
    {
      _id: 'provider_2',
      shopId,
      name: 'DHL Express',
      type: 'dhl',
      apiEndpoint: 'https://api.dhl.com/v2',
      apiKey: encryptCredential('mock_dhl_key_789'),
      isActive: false,
      config: {
        autoSync: false,
        syncInterval: 60,
        supportedRegions: ['All'],
      },
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}
