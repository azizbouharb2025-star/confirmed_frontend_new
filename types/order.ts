/**
 * Order Management System - Order Types and Interfaces
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

// Order Status Types
export type OrderStatus = 'pending' | 'assigned' | 'in_progress' | 'confirmed' | 'rejected' | 'cancelled';
export type OrderPriority = 'low' | 'normal' | 'high' | 'urgent';

// Call-related Types
export type CallResult = 'confirmed' | 'rejected' | 'no_answer' | 'busy' | 'voicemail';
export type CallType = 'human' | 'ai';
export type CustomerTone = 'positive' | 'neutral' | 'negative';
export type PriceSensitivity = 'low' | 'medium' | 'high';
export type ConfirmationStrength = 'strong' | 'moderate' | 'weak';

/**
 * Call feedback collected by operators during confirmation calls
 */
export interface CallFeedback {
  customerTone: CustomerTone;
  priceSensitivity: PriceSensitivity;
  qualityConcerns: boolean;
  deliveryIssues: boolean;
  confirmationStrength: ConfirmationStrength;
  riskTags: string[];
  notes: string;
}

/**
 * Record of a call attempt for an order
 */
export interface CallHistoryEntry {
  operatorId: string;
  operatorName?: string;
  callType: CallType;
  result: CallResult;
  notes?: string;
  feedback?: CallFeedback;
  timestamp: string;
  duration?: number;
}

/**
 * Customer address information
 */
export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

/**
 * Customer/Client information for an order
 */
export interface ClientInfo {
  name: string;
  phone: string;
  email?: string;
  address?: Address;
}


/**
 * Individual item in an order
 */
export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  variant?: string;
}

/**
 * Delivery information for an order
 */
export interface DeliveryInfo {
  courier?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  address: Address;
}

/**
 * Shop reference - can be populated or just an ID
 */
export interface ShopRef {
  _id: string;
  name: string;
}

/**
 * Operator reference - can be populated or just an ID
 */
export interface OperatorRef {
  _id: string;
  name: string;
}

/**
 * Main Order interface
 * Contains all order data with tier-specific optional fields
 */
export interface Order {
  _id: string;
  orderId: string;
  shopId: string | ShopRef;
  clientInfo: ClientInfo;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  priority: OrderPriority;
  
  // Pro+ tier fields
  aiRiskScore?: number;
  operatorFeedback?: string;
  
  // Business+ tier fields
  courierAssignment?: string;
  region?: string;
  complaintFlags?: string[];
  
  // Enterprise tier fields
  isRepeatBuyer?: boolean;
  customerLifetimeValue?: number;
  
  // Assignment and history
  assignedOperatorId?: string | OperatorRef;
  callHistory: CallHistoryEntry[];
  deliveryInfo?: DeliveryInfo;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Filter options for order queries
 */
export interface OrderFilters {
  search: string;
  status: OrderStatus | 'all';
  dateRange: { start: Date; end: Date } | null;
  aiScoreRange?: { min: number; max: number };  // Pro+
  region?: string;                               // Business+
  courier?: string;                              // Business+
  shopId?: string;                               // Admin only
}

/**
 * Default filter values
 */
export const DEFAULT_ORDER_FILTERS: OrderFilters = {
  search: '',
  status: 'all',
  dateRange: null,
};

/**
 * Paginated orders response
 */
export interface PaginatedOrders {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Parameters for fetching orders
 */
export interface GetOrdersParams {
  page: number;
  limit: number;
  filters: OrderFilters;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Result of a bulk operation
 */
export interface BulkResult {
  successful: number;
  failed: number;
  errors: Array<{ orderId: string; error: string }>;
}
