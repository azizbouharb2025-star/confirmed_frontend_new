/**
 * Order Management System - Order Types and Interfaces
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

// Order Status Types
export type OrderStatus = 'pending' | 'assigned' | 'in_progress' | 'confirmed' | 'rejected' | 'cancelled' | 'postponed' | 'shipped' | 'delivered' | 'failed_delivery';
/**
 * Priorités backend actuelles : low / medium / high.
 * normal / urgent sont conservées temporairement pour
 * compatibilité avec d'anciennes commandes.
 */
export type OrderPriority =
  | 'low'
  | 'medium'
  | 'high'
  | 'normal'
  | 'urgent';

// NEW: Cancellation reason types
export type CancellationReason = 
  | 'customer_refused'
  | 'price_too_high'
  | 'quality_doubts'
  | 'duplicate_order'
  | 'fake_number'
  | 'not_available'
  | 'courier_failed'
  | 'customer_rejected_at_door'
  | 'unreachable_after_3_attempts';

// NEW: Risk level types
export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'very_low';

// Call-related Types
export type CallResult =
  | 'confirmed'
  | 'rejected'
  | 'no_answer'
  | 'busy'
  | 'unreachable'
  | 'callback_requested'
  | 'interrupted'
  | 'other'
  | 'voicemail';

export type CallAttemptReason =
  | 'no_answer'
  | 'busy'
  | 'unreachable'
  | 'callback_requested'
  | 'interrupted'
  | 'other';
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
  operatorId:
    | string
    | {
        _id: string;
        name?: string;
        firstName?: string;
        lastName?: string;
        email?: string;
      };
  operatorName?: string;
  callType: CallType;

  /**
   * Certaines tentatives peuvent être enregistrées
   * sans motif, donc result est optionnel.
   */
  result?: CallResult;

  attemptNumber?: 1 | 2 | 3;
  attemptReason?: CallAttemptReason;

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
  district?: string;
  zipCode: string;
  country: string;
}

/**
 * Customer/Client information for an order
 */
export interface ClientInfo {
  name: string;
  phone: string;

  /**
   * Numéros supplémentaires saisis ou corrigés
   * pendant le travail de confirmation.
   */
  additionalPhones?: string[];

  email?: string;
  address?: Address;
}


/**
 * Individual item in an order
 */
export interface PopulatedOrderProduct {
  _id: string;
  name?: string;

  // Valeurs catalogue
  price?: number;
  deliveryFee?: number;

  // Données nécessaires au poste opérateur
  imageUrl?: string;
  productLink?: string;
  description?: string;
  sellerNotes?: string;
}

export interface OrderItem {
  /**
   * Identifiant MongoDB du sous-document.
   * Optionnel dans le type pour conserver la compatibilité
   * avec certains anciens mocks/tests.
   */
  _id?: string;

  productId: string | PopulatedOrderProduct;
  name: string;
  quantity: number;
  price: number;

  sku?: string;
  url?: string;
  variant?: string;
}

/**
 * Delivery information for an order
 */
export interface DeliveryInfo {
  /**
   * Champ canonique utilisé par le backend.
   */
  carrier?: string;

  /**
   * Ancien champ conservé pour compatibilité.
   */
  courier?: string;

  trackingNumber?: string;
  estimatedDelivery?: string;
  address?: Address;

  // Colissimo-specific delivery fields
  secondaryPhone?: string;
  packageCount?: number;
  comment?: string;
  weight?: number;
  colissimoType?: 'VO' | 'VM' | 'GV' | 'EXP' | 'FIX' | 'ONP' | 'BLK' | 'SMD';
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
  confirmedId: number;
  orderId: string;
  externalOrderId?: string;
  shopId: string | ShopRef;
  clientInfo: ClientInfo;
  items: OrderItem[];

  /**
   * Frais de livraison propres à cette commande.
   */
  deliveryFee?: number;

  totalAmount: number;
  status: OrderStatus;
  priority: OrderPriority;
  
  // NEW: AI and Risk Assessment
  aiScore?: number;                              // AI confidence score (0-100%)
  riskLevel?: RiskLevel;                         // Risk level: high/medium/low
  aiDecision?: 'accept' | 'review' | 'reject';
  aiScoredAt?: string;
  aiScoreDetails?: {
    baseScore: number;
    finalScore: number;
    factors: Array<{
      _id?: string;
      key: string;
      label: string;
      value: string | number | boolean | null;
      impact: number;
      applied: boolean;
    }>;
  };
  customerHistory?: {
    totalOrders: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    successRate: number | null;
    isNewCustomer: boolean;
    isRepeatCustomer: boolean;
    customerSince: string | null;
    lastOrderAt: string | null;
    lastDeliveryAt: string | null;
  };
  aiSummary?: {
    introduction: string;
    positiveFactors: Array<{
      key: string;
      label: string;
      value: string | number | boolean | null;
      impact: number;
    }>;
    warningFactors: Array<{
      key: string;
      label: string;
      value: string | number | boolean | null;
      impact: number;
    }>;
    conclusion: string;
    recommendation: string;
  };
  addressFindings?: Array<{
    key: string;
    level: 'positive' | 'neutral' | 'alert';
    description: string;
    impact: 'positive' | 'neutral' | 'negative';
  }>;
  regionFindings?: Array<{
    key: string;
    level: 'positive' | 'neutral' | 'alert';
    description: string;
    impact: 'positive' | 'neutral' | 'negative';
  }>;
  customerFindings?: Array<{
    key: string;
    level: 'positive' | 'neutral' | 'alert';
    description: string;
    impact: 'positive' | 'neutral' | 'negative';
  }>;
  orderValueFindings?: Array<{
    key: string;
    level: 'positive' | 'neutral' | 'alert';
    description: string;
    impact: 'positive' | 'neutral' | 'negative';
  }>;
  orderTimeFindings?: Array<{
    key: string;
    level: 'positive' | 'neutral' | 'alert';
    description: string;
    impact: 'positive' | 'neutral' | 'negative';
  }>;
  deliverySuccessProbability?: number;           // Probability of successful delivery (0-100%)
  
  // NEW: Cancellation tracking
  postponement?: {
    date?: string;
    time?: string;
    scheduledFor?: string;
    note?: string;
    postponedAt?: string;
    postponedByOperatorId?:
      | string
      | {
          _id: string;
          firstName?: string;
          lastName?: string;
          email?: string;
        };
  };

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
  aiDecision?: 'accept' | 'review' | 'reject' | 'all';
  riskLevel?: RiskLevel | 'all';
  region?: string;                               // Business+
  courier?: string;                              // Business+
  hasComplaint?: boolean;                        // Business+ - NEW
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
