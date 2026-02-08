/**
 * Complaint & After-Sales Management - Types and Interfaces
 * Requirements: 3.7, 3.8
 */

// Complaint Status Types
export type ComplaintStatus = 'open' | 'in_progress' | 'resolved' | 'closed' | 'escalated';

// Complaint Category Types
export type ComplaintCategory =
  | 'damaged_product'
  | 'wrong_item'
  | 'missing_item'
  | 'quality_issue'
  | 'delivery_problem'
  | 'other';

/**
 * Media attachment for complaint evidence
 */
export interface MediaAttachment {
  url: string;
  type: 'image' | 'video';
  mimeType: string;
  size: number;
  uploadedAt: string;
}

/**
 * AI-generated tag with confidence score
 */
export interface AITag {
  tag: string;
  confidence: number;
}

/**
 * Entry in the resolution history timeline
 */
export interface ResolutionHistoryEntry {
  status: ComplaintStatus;
  note?: string;
  userId: string;
  timestamp: string;
}

/**
 * Customer information for complaint
 */
export interface CustomerInfo {
  name: string;
  phone: string;
  email?: string;
}


/**
 * Main Complaint interface
 * Contains all complaint data with resolution tracking
 */
export interface Complaint {
  _id: string;
  referenceNumber: string;
  orderId: string;
  shopId: string;
  customerInfo: CustomerInfo;
  category: ComplaintCategory;
  description: string;
  mediaAttachments: MediaAttachment[];
  aiTags: AITag[];
  aiPrimaryCategory: string;
  requiresManualReview: boolean;
  status: ComplaintStatus;
  resolutionHistory: ResolutionHistoryEntry[];
  resolvedAt?: string;
  resolvedBy?: string;
  region: string;
  productIds: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Summary counts for complaints dashboard
 */
export interface ComplaintSummary {
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
  escalated: number;
  total: number;
}

/**
 * Filter options for complaint queries
 */
export interface ComplaintFilters {
  status?: ComplaintStatus;
  category?: ComplaintCategory;
  startDate?: string;
  endDate?: string;
  productId?: string;
  region?: string;
  search?: string;
}

/**
 * Paginated complaints response
 */
export interface PaginatedComplaints {
  complaints: Complaint[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}


/**
 * Analytics data for Business+ tier
 */
export interface ComplaintAnalytics {
  byProduct: Array<{ productId: string; productName: string; count: number }>;
  byRegion: Array<{ region: string; count: number }>;
  byCategory: Array<{ category: ComplaintCategory; count: number }>;
  resolutionRate: number;
  averageResolutionTime: number;
  totalComplaints: number;
}

/**
 * Order item from backend (for complaint context)
 */
export interface ComplaintOrderItem {
  productId: {
    _id: string;
    name: string;
    [key: string]: unknown;
  };
  quantity: number;
  price: number;
}

/**
 * Order data from token validation
 */
export interface OrderData {
  _id: string;
  orderId: string;
  clientInfo: {
    name: string;
    phone: string;
    address: string;
  };
  items: ComplaintOrderItem[];
  totalAmount: number;
  status: string;
  region: string;
  shop: {
    _id: string;
    name: string;
    domain: string;
  };
  createdAt: string;
}

/**
 * Token validation response for public complaint form
 */
export interface TokenValidationResponse {
  valid: boolean;
  order: OrderData;
  shopId: string;
}

/**
 * Complaint submission data from public form
 */
export interface ComplaintSubmission {
  token: string;
  category: ComplaintCategory;
  description: string;
  mediaAttachments: File[];
}

/**
 * Support card with QR code for order
 */
export interface SupportCard {
  orderId: string;
  orderNumber?: string;
  shopId?: string;
  qrCodeUrl: string;
  qrCodeBase64: string;
  token: string;
  expiresAt: string;
  createdAt?: string;
}


// ============================================================================
// Utility Functions for Complaint Data Validation
// ============================================================================

/**
 * All valid complaint statuses
 */
export const ALL_COMPLAINT_STATUSES: ComplaintStatus[] = [
  'open',
  'in_progress',
  'resolved',
  'closed',
  'escalated',
];

/**
 * All valid complaint categories
 */
export const ALL_COMPLAINT_CATEGORIES: ComplaintCategory[] = [
  'damaged_product',
  'wrong_item',
  'missing_item',
  'quality_issue',
  'delivery_problem',
  'other',
];

/**
 * Allowed media file types for complaint attachments
 */
export const ALLOWED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'video/mp4', 'video/quicktime'];

/**
 * Maximum total size for media attachments (50MB)
 */
export const MAX_MEDIA_SIZE_BYTES = 50 * 1024 * 1024;

/**
 * Minimum description length
 */
export const MIN_DESCRIPTION_LENGTH = 10;

/**
 * Reference number format regex: CMP-YYYYMMDD-XXXX
 */
export const REFERENCE_NUMBER_REGEX = /^CMP-\d{8}-[A-Z0-9]{4}$/;

/**
 * Check if a value is a valid complaint status
 */
export function isValidComplaintStatus(status: string): status is ComplaintStatus {
  return ALL_COMPLAINT_STATUSES.includes(status as ComplaintStatus);
}

/**
 * Check if a value is a valid complaint category
 */
export function isValidComplaintCategory(category: string): category is ComplaintCategory {
  return ALL_COMPLAINT_CATEGORIES.includes(category as ComplaintCategory);
}


/**
 * Validate description meets minimum length requirement
 */
export function isValidDescription(description: string): boolean {
  return description.trim().length >= MIN_DESCRIPTION_LENGTH;
}

/**
 * Validate media file type is allowed
 */
export function isValidMediaType(mimeType: string): boolean {
  return ALLOWED_MEDIA_TYPES.includes(mimeType);
}

/**
 * Validate total media size is within limit
 */
export function isValidMediaSize(files: Array<{ size: number }>): boolean {
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  return totalSize <= MAX_MEDIA_SIZE_BYTES;
}

/**
 * Calculate total size of media files
 */
export function calculateTotalMediaSize(files: Array<{ size: number }>): number {
  return files.reduce((sum, file) => sum + file.size, 0);
}

/**
 * Validate reference number format
 */
export function isValidReferenceNumber(referenceNumber: string): boolean {
  return REFERENCE_NUMBER_REGEX.test(referenceNumber);
}

/**
 * Validate complaint summary counts are consistent
 * The sum of status counts should equal the total
 */
export function isValidComplaintSummary(summary: ComplaintSummary): boolean {
  const statusSum =
    summary.open +
    summary.in_progress +
    summary.resolved +
    summary.closed +
    summary.escalated;
  return statusSum === summary.total;
}


/**
 * Serialize a Complaint object to JSON string
 */
export function serializeComplaint(complaint: Complaint): string {
  return JSON.stringify(complaint);
}

/**
 * Deserialize a JSON string to a Complaint object
 * Returns null if parsing fails or data is invalid
 */
export function deserializeComplaint(json: string): Complaint | null {
  try {
    const parsed = JSON.parse(json);
    if (!isValidComplaintData(parsed)) {
      return null;
    }
    return parsed as Complaint;
  } catch {
    return null;
  }
}

/**
 * Validate that an object has all required Complaint fields
 */
export function isValidComplaintData(data: unknown): boolean {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const complaint = data as Record<string, unknown>;

  // Check required string fields
  const requiredStringFields = [
    '_id',
    'referenceNumber',
    'orderId',
    'shopId',
    'description',
    'aiPrimaryCategory',
    'region',
    'createdAt',
    'updatedAt',
  ];

  for (const field of requiredStringFields) {
    if (typeof complaint[field] !== 'string') {
      return false;
    }
  }

  // Check status is valid
  if (!isValidComplaintStatus(complaint.status as string)) {
    return false;
  }

  // Check category is valid
  if (!isValidComplaintCategory(complaint.category as string)) {
    return false;
  }

  // Check boolean field
  if (typeof complaint.requiresManualReview !== 'boolean') {
    return false;
  }

  // Check arrays exist
  if (!Array.isArray(complaint.mediaAttachments)) {
    return false;
  }
  if (!Array.isArray(complaint.aiTags)) {
    return false;
  }
  if (!Array.isArray(complaint.resolutionHistory)) {
    return false;
  }
  if (!Array.isArray(complaint.productIds)) {
    return false;
  }

  // Check customerInfo object
  if (!complaint.customerInfo || typeof complaint.customerInfo !== 'object') {
    return false;
  }
  const customerInfo = complaint.customerInfo as Record<string, unknown>;
  if (typeof customerInfo.name !== 'string' || typeof customerInfo.phone !== 'string') {
    return false;
  }

  return true;
}


/**
 * Get display name for complaint status
 */
export function getStatusDisplayName(status: ComplaintStatus): string {
  const displayNames: Record<ComplaintStatus, string> = {
    open: 'Open',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    closed: 'Closed',
    escalated: 'Escalated',
  };
  return displayNames[status];
}

/**
 * Get display name for complaint category
 */
export function getCategoryDisplayName(category: ComplaintCategory): string {
  const displayNames: Record<ComplaintCategory, string> = {
    damaged_product: 'Damaged Product',
    wrong_item: 'Wrong Item',
    missing_item: 'Missing Item',
    quality_issue: 'Quality Issue',
    delivery_problem: 'Delivery Problem',
    other: 'Other',
  };
  return displayNames[category];
}

/**
 * Default filter values for complaints
 */
export const DEFAULT_COMPLAINT_FILTERS: ComplaintFilters = {};

/**
 * Check if any filters are applied
 */
export function hasActiveFilters(filters: ComplaintFilters): boolean {
  return !!(
    filters.status ||
    filters.category ||
    filters.startDate ||
    filters.endDate ||
    filters.productId ||
    filters.region ||
    filters.search
  );
}
