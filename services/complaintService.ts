/**
 * Complaint Service - API methods for complaint management
 * Requirements: 1.1, 1.8, 2.1, 2.3, 3.5, 3.6, 5.1, 5.4
 */

import api from '@/lib/api';
import {
  Complaint,
  ComplaintStatus,
  ComplaintFilters,
  ComplaintSummary,
  PaginatedComplaints,
  ComplaintAnalytics,
  TokenValidationResponse,
  ComplaintSubmission,
  ComplaintCategory,
} from '@/types/complaint';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.confirmed.tn';
const FILE_SERVER_URL = process.env.NEXT_PUBLIC_FILE_SERVER_URL || 'https://api.confirmed.tn';

/**
 * Typed error class for complaint service errors
 */
export class ComplaintServiceError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ComplaintServiceError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Build query string from complaint filters and pagination
 */
function buildComplaintQueryString(params: {
  page: number;
  limit: number;
  filters: ComplaintFilters;
}): string {
  const queryParts: string[] = [];

  // Pagination
  queryParts.push(`page=${params.page}`);
  queryParts.push(`limit=${params.limit}`);

  // Filters
  const { filters } = params;

  if (filters.status) {
    queryParts.push(`status=${filters.status}`);
  }

  if (filters.category) {
    queryParts.push(`category=${filters.category}`);
  }

  if (filters.startDate) {
    queryParts.push(`startDate=${encodeURIComponent(filters.startDate)}`);
  }

  if (filters.endDate) {
    queryParts.push(`endDate=${encodeURIComponent(filters.endDate)}`);
  }

  if (filters.productId) {
    queryParts.push(`productId=${encodeURIComponent(filters.productId)}`);
  }

  if (filters.region) {
    queryParts.push(`region=${encodeURIComponent(filters.region)}`);
  }

  if (filters.search) {
    queryParts.push(`search=${encodeURIComponent(filters.search)}`);
  }

  return queryParts.join('&');
}


/**
 * API response wrapper type
 */
interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  complaints?: Complaint[];
  total?: number;
  totalCount?: number;
  page?: number;
  currentPage?: number;
  limit?: number;
  pageSize?: number;
  totalPages?: number;
}

/**
 * Raw complaint from API
 */
interface RawComplaint {
  _id?: string;
  orderId?: string | { _id?: string; orderId?: string; clientInfo?: { name?: string; phone?: string; email?: string } };
  shopId?: string | { _id?: string; name?: string };
  customerInfo?: { name: string; phone: string; email?: string };
  productIds?: string[];
  mediaAttachments?: Array<{
    url?: string;
    path?: string;
    filename?: string;
    type?: string;
    mimeType?: string;
    size?: number;
    uploadedAt?: string;
    createdAt?: string;
  }>;
  aiTags?: string[];
  resolutionHistory?: Array<{
    userId?: string | { _id?: string; email?: string };
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

/**
 * Transform API response to PaginatedComplaints format
 */
function transformPaginatedResponse(response: ApiResponse<{ complaints?: RawComplaint[]; data?: RawComplaint[] } & ApiResponse<unknown>>): PaginatedComplaints {
  // Handle { success, data } wrapper from backend
  const data = response.data || response;

  const rawComplaints = (data as { complaints?: RawComplaint[]; data?: RawComplaint[] }).complaints || 
                        (data as { data?: RawComplaint[] }).data || 
                        [];

  return {
    complaints: rawComplaints.map(transformComplaint),
    total: (data as ApiResponse<unknown>).total || (data as ApiResponse<unknown>).totalCount || 0,
    page: (data as ApiResponse<unknown>).page || (data as ApiResponse<unknown>).currentPage || 1,
    limit: (data as ApiResponse<unknown>).limit || (data as ApiResponse<unknown>).pageSize || 10,
    totalPages:
      (data as ApiResponse<unknown>).totalPages || Math.ceil(((data as ApiResponse<unknown>).total || 0) / ((data as ApiResponse<unknown>).limit || 10)),
  };
}

/**
 * Transform a single complaint from backend format to frontend format
 * Handles populated references (orderId, shopId as objects) and field name differences (clientInfo vs customerInfo)
 */
function transformComplaint(complaint: RawComplaint): Complaint {
  if (!complaint) return complaint as unknown as Complaint;

  // Handle orderId being a populated object
  let orderId: string = typeof complaint.orderId === 'string' ? complaint.orderId : '';
  let customerInfo = complaint.customerInfo;

  if (typeof complaint.orderId === 'object' && complaint.orderId !== null) {
    const orderObj = complaint.orderId as { _id?: string; orderId?: string; clientInfo?: { name?: string; phone?: string; email?: string } };
    orderId = orderObj._id || orderObj.orderId || '';

    // Extract customerInfo from populated order's clientInfo if not already set
    if (!customerInfo && orderObj.clientInfo) {
      customerInfo = {
        name: orderObj.clientInfo.name || '',
        phone: orderObj.clientInfo.phone || '',
        email: orderObj.clientInfo.email,
      };
    }
  }

  // Handle shopId being a populated object
  let shopId: string = typeof complaint.shopId === 'string' ? complaint.shopId : '';
  if (typeof complaint.shopId === 'object' && complaint.shopId !== null) {
    const shopObj = complaint.shopId as { _id?: string; name?: string };
    shopId = shopObj._id || shopObj.name || '';
  }

  // Transform media attachments to have full URLs
  const mediaAttachments = (complaint.mediaAttachments || []).map(
    (attachment) => {
      // Get the raw URL/path value
      let url = attachment.url || attachment.path || attachment.filename || '';

      // If URL is not absolute, build the full URL
      if (url && !url.startsWith('http')) {
        // Remove any leading slashes for consistent handling
        const cleanPath = url.replace(/^\/+/, '');

        // Check if path already includes 'uploads/complaints'
        // Use FILE_SERVER_URL (port 8000) for serving file attachments
        if (cleanPath.startsWith('uploads/complaints/')) {
          url = `${FILE_SERVER_URL}/${cleanPath}`;
        } else if (cleanPath.startsWith('uploads/')) {
          url = `${FILE_SERVER_URL}/${cleanPath}`;
        } else {
          // Just a filename - add the full path
          url = `${FILE_SERVER_URL}/uploads/complaints/${cleanPath}`;
        }
      }

      return {
        ...attachment,
        url,
        type: (
          attachment.type ||
          (attachment.mimeType?.startsWith('video') ? 'video' : 'image')
        ) as 'image' | 'video',
        mimeType: attachment.mimeType || '',
        size: attachment.size || 0,
        uploadedAt: attachment.uploadedAt || attachment.createdAt || '',
      };
    }
  );

  // Transform resolutionHistory to handle populated userId objects
  const resolutionHistory = (complaint.resolutionHistory || []).map(
    (entry) => {
      let userId: string = typeof entry.userId === 'string' ? entry.userId : '';
      // Handle userId being a populated user object {_id, email}
      if (typeof entry.userId === 'object' && entry.userId !== null) {
        const userObj = entry.userId as { _id?: string; email?: string };
        userId = userObj.email || userObj._id || 'Unknown';
      }
      return {
        status: ((entry as { status?: string }).status || 'open') as 'open' | 'in_progress' | 'resolved' | 'closed' | 'escalated',
        note: (entry as { note?: string }).note,
        userId,
        timestamp: (entry as { timestamp?: string }).timestamp || new Date().toISOString(),
      };
    }
  );

  return {
    ...complaint,
    _id: complaint._id || '',
    referenceNumber: (complaint as { referenceNumber?: string }).referenceNumber || '',
    orderId,
    shopId,
    customerInfo: customerInfo || { name: '', phone: '' },
    category: ((complaint as { category?: string }).category || 'other') as ComplaintCategory,
    description: (complaint as { description?: string }).description || '',
    productIds: complaint.productIds || [],
    mediaAttachments,
    aiTags: (complaint.aiTags || []).map(tag => 
      typeof tag === 'string' ? { tag, confidence: 1 } : tag
    ),
    aiPrimaryCategory: (complaint as { aiPrimaryCategory?: string }).aiPrimaryCategory || '',
    requiresManualReview: (complaint as { requiresManualReview?: boolean }).requiresManualReview || false,
    status: ((complaint as { status?: string }).status || 'open') as ComplaintStatus,
    resolutionHistory,
    region: (complaint as { region?: string }).region || '',
    createdAt: (complaint as { createdAt?: string }).createdAt || new Date().toISOString(),
    updatedAt: (complaint as { updatedAt?: string }).updatedAt || new Date().toISOString(),
  } as Complaint;
}

/**
 * Complaint Service
 * Handles all complaint-related API calls
 */
export const complaintService = {
  // ============================================================================
  // Public Endpoints (No Authentication Required)
  // ============================================================================

  /**
   * Validate a support card token
   * Requirements: 1.1
   * 
   * @param token - The token from the QR code URL
   * @returns Token validation response with order data
   * @throws Error with code TOKEN_EXPIRED (410), TOKEN_INVALID (404), or TOKEN_USED (400)
   */
  async validateToken(token: string): Promise<TokenValidationResponse> {
    const response = await fetch(`${API_BASE_URL}/api/complaints/validate-token/${token}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ComplaintServiceError(
        errorData.error || 'Token validation failed',
        response.status,
        errorData.code
      );
    }

    const result = await response.json();
    // Handle { success, data } wrapper from backend
    const data = result.data || result;
    return {
      valid: true,
      order: data.order,
      shopId: data.shopId,
    };
  },

  /**
   * Submit a complaint from the public form
   * Requirements: 1.8
   * 
   * @param data - Complaint submission data including token, category, description, and media
   * @returns Object containing the complaint reference number
   */
  async submitComplaint(data: ComplaintSubmission): Promise<{ referenceNumber: string }> {
    let response: Response;

    if (data.mediaAttachments && data.mediaAttachments.length > 0) {
      // Use FormData when there are file attachments
      const formData = new FormData();
      formData.append('token', data.token);
      formData.append('category', data.category);
      formData.append('description', data.description);

      for (const file of data.mediaAttachments) {
        formData.append('media', file);
      }

      response = await fetch(`${API_BASE_URL}/api/complaints/submit`, {
        method: 'POST',
        body: formData,
      });
    } else {
      // Use JSON when no file attachments
      response = await fetch(`${API_BASE_URL}/api/complaints/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: data.token,
          category: data.category,
          description: data.description,
        }),
      });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ComplaintServiceError(
        errorData.error || errorData.message || 'Complaint submission failed',
        response.status,
        errorData.code
      );
    }

    const result = await response.json();
    // Handle { success, data } wrapper
    return result.data || result;
  },


  // ============================================================================
  // Authenticated Endpoints (Pro+ Tier Required)
  // ============================================================================

  /**
   * Get paginated complaints with filtering
   * Requirements: 2.1, 2.3
   * 
   * @param params - Pagination and filter parameters
   * @returns Paginated complaints response
   */
  async getComplaints(params: {
    page: number;
    limit: number;
    filters: ComplaintFilters;
  }): Promise<PaginatedComplaints> {
    const queryString = buildComplaintQueryString(params);
    const response = await api.get(`/api/complaints?${queryString}`);
    return transformPaginatedResponse(response.data);
  },

  /**
   * Get complaint summary counts by status
   * Requirements: 2.1
   * 
   * @returns Summary object with counts for each status
   */
  async getSummary(): Promise<ComplaintSummary> {
    const response = await api.get('/api/complaints/summary');
    // Handle { success, data } wrapper
    return response.data.data || response.data;
  },

  /**
   * Get a single complaint by ID
   * Requirements: 3.1
   * 
   * @param id - Complaint ID
   * @returns Full complaint object
   */
  async getComplaint(id: string): Promise<Complaint> {
    const response = await api.get(`/api/complaints/${id}`);
    // Handle { success, data } wrapper from backend and transform
    const data = response.data.data || response.data;
    return transformComplaint(data);
  },

  /**
   * Update complaint status with optional note
   * Requirements: 3.5, 3.6
   * 
   * @param id - Complaint ID
   * @param status - New status
   * @param note - Optional resolution note
   * @returns Updated complaint object
   */
  async updateStatus(
    id: string,
    status: ComplaintStatus,
    note?: string
  ): Promise<Complaint> {
    const response = await api.patch(`/api/complaints/${id}/status`, {
      status,
      note,
    });
    // Handle { success, data } wrapper from backend and transform
    const data = response.data.data || response.data;
    return transformComplaint(data);
  },

  /**
   * Add a resolution note to a complaint
   * Requirements: 3.6
   * 
   * @param id - Complaint ID
   * @param content - Note content
   * @returns Updated complaint object
   */
  async addNote(id: string, content: string): Promise<Complaint> {
    const response = await api.post(`/api/complaints/${id}/notes`, {
      content,
    });
    // Handle { success, data } wrapper from backend and transform
    const data = response.data.data || response.data;
    return transformComplaint(data);
  },


  /**
   * Export complaints as CSV with applied filters
   * Requirements: 5.4
   * 
   * @param filters - Filter criteria for export
   * @returns CSV file as Blob
   */
  async exportComplaints(filters: ComplaintFilters): Promise<Blob> {
    const queryParts: string[] = [];

    if (filters.status) {
      queryParts.push(`status=${filters.status}`);
    }
    if (filters.category) {
      queryParts.push(`category=${filters.category}`);
    }
    if (filters.startDate) {
      queryParts.push(`startDate=${encodeURIComponent(filters.startDate)}`);
    }
    if (filters.endDate) {
      queryParts.push(`endDate=${encodeURIComponent(filters.endDate)}`);
    }
    if (filters.productId) {
      queryParts.push(`productId=${encodeURIComponent(filters.productId)}`);
    }
    if (filters.region) {
      queryParts.push(`region=${encodeURIComponent(filters.region)}`);
    }
    if (filters.search) {
      queryParts.push(`search=${encodeURIComponent(filters.search)}`);
    }

    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    const response = await api.get(`/api/complaints/export${queryString}`);

    // If the API returns CSV data directly as Blob
    if (response.data instanceof Blob) {
      return response.data;
    }

    // If the API returns complaint data, convert to CSV
    const complaints: Complaint[] = response.data.complaints || response.data;
    return generateComplaintCSV(complaints);
  },

  // ============================================================================
  // Business+ Tier Endpoints
  // ============================================================================

  /**
   * Get complaint analytics data
   * Requirements: 5.1
   * 
   * @param params - Optional date range parameters
   * @returns Analytics data with charts and metrics
   */
  async getAnalytics(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ComplaintAnalytics> {
    const queryParts: string[] = [];

    if (params?.startDate) {
      queryParts.push(`startDate=${encodeURIComponent(params.startDate)}`);
    }
    if (params?.endDate) {
      queryParts.push(`endDate=${encodeURIComponent(params.endDate)}`);
    }

    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    const response = await api.get(`/api/complaints/analytics${queryString}`);
    return response.data;
  },
};


// ============================================================================
// CSV Generation Utilities
// ============================================================================

/**
 * Escape a value for CSV format
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Generate CSV string from complaints array
 */
function generateComplaintCSVString(complaints: Complaint[]): string {
  if (complaints.length === 0) {
    return '';
  }

  // CSV headers
  const headers = [
    'Reference Number',
    'Order ID',
    'Customer Name',
    'Customer Phone',
    'Customer Email',
    'Category',
    'Status',
    'Description',
    'Region',
    'AI Primary Category',
    'Requires Manual Review',
    'Created At',
    'Updated At',
    'Resolved At',
  ];

  // Build CSV rows
  const rows = complaints.map((complaint) => [
    complaint.referenceNumber,
    complaint.orderId,
    complaint.customerInfo.name,
    complaint.customerInfo.phone,
    complaint.customerInfo.email || '',
    complaint.category,
    complaint.status,
    complaint.description,
    complaint.region,
    complaint.aiPrimaryCategory,
    complaint.requiresManualReview ? 'Yes' : 'No',
    complaint.createdAt,
    complaint.updatedAt,
    complaint.resolvedAt || '',
  ]);

  // Build CSV content
  return [
    headers.map(escapeCSV).join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ].join('\n');
}

/**
 * Generate CSV Blob from complaints array
 */
function generateComplaintCSV(complaints: Complaint[]): Blob {
  const csvContent = generateComplaintCSVString(complaints);
  return new Blob([csvContent], { type: 'text/csv' });
}

/**
 * Helper to trigger CSV download in browser
 */
export function downloadComplaintCSV(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export utilities for testing
export {
  buildComplaintQueryString,
  transformPaginatedResponse,
  generateComplaintCSV,
  generateComplaintCSVString,
  escapeCSV,
};

export default complaintService;
