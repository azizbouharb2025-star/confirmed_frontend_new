/**
 * Analytics System - Analytics Types and Interfaces
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8
 */

/**
 * Time range for analytics queries
 */
export interface TimeRange {
  start: Date;
  end: Date;
  preset?: 'today' | 'yesterday' | '7days' | '30days' | 'custom';
}

/**
 * Global metrics for shop performance
 */
export interface GlobalMetrics {
  orderVolume: number;
  confirmationRate: number;
  averageOrderValue: number;
  totalRevenue: number;
  cancelledOrders: number;
  cancellationRate: number;
  deliverySuccessRate: number;
  averageDeliveryTime: number;
  timeRange: TimeRange;
}

/**
 * Trend data point for charts
 */
export interface TrendData {
  date: string;
  value: number;
  label?: string;
}

/**
 * Operator feedback summary data
 */
export interface OperatorFeedbackSummaryData {
  totalFeedback: number;
  averageRating: number;
  topTags: Array<{ tag: string; count: number }>;
  trendData: Array<{ date: string; averageRating: number; count: number }>;
  timeRange: TimeRange;
}

/**
 * Analytics export data
 */
export interface AnalyticsExportData {
  metrics: GlobalMetrics;
  operatorFeedback: OperatorFeedbackSummaryData;
  generatedAt: string;
  timeRange: TimeRange;
}

/**
 * Request parameters for analytics queries
 */
export interface AnalyticsQueryParams {
  shopId?: string;
  startDate: string;
  endDate: string;
  preset?: 'today' | 'yesterday' | '7days' | '30days' | 'custom';
}

/**
 * Response for global metrics API
 */
export interface GlobalMetricsResponse {
  success: boolean;
  metrics: GlobalMetrics;
}

/**
 * Response for operator feedback API
 */
export interface OperatorFeedbackResponse {
  success: boolean;
  data: OperatorFeedbackSummaryData;
}

/**
 * Response for analytics export API
 */
export interface AnalyticsExportResponse {
  success: boolean;
  data: AnalyticsExportData;
  downloadUrl?: string;
}
