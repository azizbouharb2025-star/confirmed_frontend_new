/**
 * Product Performance type definitions
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 10.10
 */

export interface TimeRange {
  start: Date
  end: Date
  preset?: 'today' | 'yesterday' | '7days' | '30days' | 'custom'
}

export interface ProductPerformance {
  productId: string
  productName: string
  imageUrl?: string
  salesVolume: number
  revenue: number
  returnCount: number
  returnRate: number // Calculated: (returnCount / salesVolume) * 100
  avgAIScore?: number // Average AI score of orders containing this product
  trend: 'up' | 'down' | 'stable'
  isTopPerformer: boolean // Top 10% by revenue
  isUnderperforming: boolean // High return rate (>15%) or low AI score (<50)
  timeRange: TimeRange
}

export interface ProductPerformanceExportData {
  products: ProductPerformance[]
  generatedAt: string
  timeRange: TimeRange
  totalProducts: number
  totalRevenue: number
  averageReturnRate: number
}
