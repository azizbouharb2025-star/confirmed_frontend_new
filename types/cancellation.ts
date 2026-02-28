/**
 * Cancellation Analytics Types
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8
 */

import { CancellationReason } from './order';

/**
 * Time range for analytics queries
 */
export interface TimeRange {
  start: Date;
  end: Date;
  preset?: 'today' | 'yesterday' | '7days' | '30days' | 'custom';
}

/**
 * Cancellation reason data with statistics
 */
export interface CancellationReasonData {
  reason: CancellationReason;
  count: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

/**
 * Summary of cancellation reasons (for widget display)
 */
export interface CancellationReasonSummary {
  reason: CancellationReason;
  count: number;
  percentage: number;
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
 * Complete cancellation analysis data
 */
export interface CancellationAnalysisData {
  totalCancelled: number;
  cancellationRate: number;
  reasonBreakdown: CancellationReasonData[];
  trendData: TrendData[];
  topReasons: CancellationReasonSummary[];
  timeRange: TimeRange;
}

/**
 * Cancellation summary for dashboard widget
 */
export interface CancellationSummary {
  totalCancelled: number;
  topReasons: CancellationReasonSummary[];
  changeFromPrevious: number; // Percentage change
  trend: 'up' | 'down' | 'stable';
}
