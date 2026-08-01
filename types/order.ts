/**
 * Order Management System - Order Types and Interfaces
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

// Order Status Types
export type OrderStatus = 'pending' | 'assigned' | 'in_progress' | 'confirmed' | 'rejected' | 'cancelled' | 'shipped' | 'delivered' | 'failed_delivery';
export type OrderPriority = 'low' | 'normal' | 'high' | 'urgent';

// NEW: Cancellation reason types
export type CancellationReason = 
  | 'customer_refused'
  | 'price_too_high'
  | 'quality_doubts'
  | 'duplicate_order'
  | 'fake_number'
  | 'not_available'
  | 'courier_failed'
  | 'customer_rejected_at_door';

// NEW: Risk level types
export type RiskLevel = 'high' | 'medium' | 'low';

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
 * NEW: Courier reference
 */
export interface CourierRef {
  _id: string;
  name: string;
}

/**
 * NEW: Delivery attempt record
 */
export interface DeliveryAttempt {
  attemptNumber: number;
  attemptDate: string;
  status: 'failed' | 'customer_not_home' | 'refused' | 'successful';
  notes?: string;
}

/**
 * NEW: Operator feedback on order
 */
export interface OperatorFeedbackData {
  confidence: 'strong' | 'doubtful' | 'neutral';
  notes?: string;
  operatorId: string;
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
  
  // NEW: AI and Risk Assessment
  aiScore?: number;                              // AI confidence score (0-100%)
  riskLevel?: RiskLevel;                         // Risk level: high/medium/low
  deliverySuccessProbability?: number;           // Probability of successful delivery (0-100%)
  
  // NEW: Cancellation tracking
  cancellationReason?: CancellationReason;
  cancellationReasonDetails?: string;
  cancelledBy?: 'customer' | 'operator' | 'system' | 'courier';
  
  // NEW: Delivery tracking
  deliveryAttempts?: DeliveryAttempt[];
  courier?: string | CourierRef;
  region?: string;
  
  // NEW: Complaint tracking
  hasComplaint?: boolean;
  
  // NEW: Operator feedback
  operatorFeedback?: OperatorFeedbackData;
  
  // Pro+ tier fields (legacy - kept for compatibility)
  aiRiskScore?: number;
  
  // Business+ tier fields (legacy - kept for compatibility)
  courierAssignment?: string;
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
  shippedAt?: string;
  deliveredAt?: string;
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
  hasComplaint?: boolean;                        // Business+ - NEW
  riskLevel?: RiskLevel | 'all';                 // Pro+ - NEW
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

// ─── Import History ───────────────────────────────────────────────────────────

/** Status values for an import operation */
export type ImportHistoryStatus = 'completed' | 'partial' | 'failed' | 'processing' | 'pending'

/** Populated user reference returned by the history endpoint */
export interface ImportHistoryUser {
  _id: string
  firstName: string
  lastName: string
  email: string
}

/** A single import history record as returned by the backend */
export interface ImportHistoryRecord {
  _id: string
  shopId: string
  userId: ImportHistoryUser | string   // may be populated or just an ID
  fileName: string
  fileType: 'xlsx' | 'csv'
  fileSize: number | null              // null on older records
  totalDetected: number
  totalImported: number
  totalRejected: number
  totalDuplicates: number
  errorsDetected: number
  status: ImportHistoryStatus
  createdAt: string
  updatedAt: string
}

/** Pagination object from the backend */
export interface ImportHistoryPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

/** Full response shape from GET /api/orders/import/history */
export interface ImportHistoryResponse {
  success: boolean
  history: ImportHistoryRecord[]
  pagination: ImportHistoryPagination
}
