/**
 * Delivery Company Integration - Types and Interfaces
 * Requirements: 2.1, 2.2, 2.4, 2.5, 2.7
 */

// Delivery Provider Types
export type DeliveryProviderType = 'aramex' | 'dhl' | 'fedex' | 'custom';

export type DeliveryStatus = 
  | 'pending_pickup'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed'
  | 'returned';

export type SyncStatus = 'success' | 'failed';

/**
 * Delivery provider configuration
 */
export interface DeliveryProviderConfig {
  webhookUrl?: string;
  autoSync: boolean;
  syncInterval: number; // minutes
  supportedRegions: string[];
  customFields?: Record<string, any>;
}

/**
 * Delivery provider interface
 */
export interface DeliveryProvider {
  _id: string;
  shopId: string;
  name: string;
  type: DeliveryProviderType;
  apiEndpoint: string;
  apiKey: string; // Encrypted
  apiSecret?: string; // Encrypted
  isActive: boolean;
  lastSyncAt?: string;
  lastSyncStatus?: SyncStatus;
  lastSyncError?: string;
  config: DeliveryProviderConfig;
  createdAt: string;
  updatedAt: string;
}

/**
 * Delivery status update from external provider
 */
export interface DeliveryStatusUpdate {
  orderId: string;
  trackingNumber: string;
  status: DeliveryStatus;
  location?: string;
  timestamp: string;
  notes?: string;
  providerId: string;
}

/**
 * Request body for creating a delivery provider
 */
export interface CreateDeliveryProviderRequest {
  name: string;
  type: DeliveryProviderType;
  apiEndpoint: string;
  apiKey: string;
  apiSecret?: string;
  config: DeliveryProviderConfig;
}

/**
 * Request body for updating a delivery provider
 */
export interface UpdateDeliveryProviderRequest {
  name?: string;
  apiEndpoint?: string;
  apiKey?: string;
  apiSecret?: string;
  isActive?: boolean;
  config?: Partial<DeliveryProviderConfig>;
}

/**
 * Response for delivery provider operations
 */
export interface DeliveryProviderResponse {
  success: boolean;
  message: string;
  provider?: DeliveryProvider;
}

/**
 * Response for delivery providers list
 */
export interface DeliveryProvidersResponse {
  success: boolean;
  providers: DeliveryProvider[];
}

/**
 * Response for delivery sync operation
 */
export interface DeliverySyncResponse {
  success: boolean;
  message: string;
  syncedOrders: number;
  failedOrders: number;
  errors?: Array<{ orderId: string; error: string }>;
}

/**
 * Delivery API interaction log
 */
export interface DeliveryAPILog {
  _id: string;
  providerId: string;
  providerName: string;
  action: 'sync' | 'status_update' | 'webhook' | 'test_connection';
  status: 'success' | 'failed';
  requestData?: any;
  responseData?: any;
  errorMessage?: string;
  timestamp: string;
  duration?: number; // milliseconds
}
