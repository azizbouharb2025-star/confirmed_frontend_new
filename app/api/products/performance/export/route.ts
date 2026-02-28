/**
 * Product Performance Export API Route
 * POST /api/products/performance/export - Export product performance data
 * Requirements: 10.10
 */

import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/logger'
import type { ProductPerformanceExportData } from '@/types/productPerformance'

/**
 * POST /api/products/performance/export
 * Export product performance data as CSV
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { products, timeRange } = body

    if (!products || !Array.isArray(products)) {
      return NextResponse.json(
        { error: 'Products data is required' },
        { status: 400 }
      )
    }

    // Calculate summary statistics
    const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0)
    const averageReturnRate =
      products.reduce((sum, p) => sum + p.returnRate, 0) / products.length

    const exportData: ProductPerformanceExportData = {
      products,
      generatedAt: new Date().toISOString(),
      timeRange,
      totalProducts: products.length,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      averageReturnRate: parseFloat(averageReturnRate.toFixed(2)),
    }

    // Generate CSV content
    const csvHeaders = [
      'Product ID',
      'Product Name',
      'Sales Volume',
      'Revenue',
      'Return Count',
      'Return Rate (%)',
      'Avg AI Score',
      'Trend',
      'Top Performer',
      'Underperforming',
    ]

    const csvRows = products.map(p => [
      p.productId,
      `"${p.productName}"`, // Quote to handle commas in names
      p.salesVolume,
      p.revenue.toFixed(2),
      p.returnCount,
      p.returnRate.toFixed(2),
      p.avgAIScore || 'N/A',
      p.trend,
      p.isTopPerformer ? 'Yes' : 'No',
      p.isUnderperforming ? 'Yes' : 'No',
    ])

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.join(',')),
      '', // Empty line
      `Total Products,${exportData.totalProducts}`,
      `Total Revenue,${exportData.totalRevenue}`,
      `Average Return Rate,${exportData.averageReturnRate.toFixed(2)}%`,
      `Generated At,${new Date(exportData.generatedAt).toLocaleString()}`,
    ].join('\n')

    logger.info(
      `Exported performance data for ${products.length} products`,
      'ProductPerformance'
    )

    // Return CSV as downloadable file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="product-performance-${Date.now()}.csv"`,
      },
    })
  } catch (error) {
    logger.error('Failed to export product performance:', error, 'ProductPerformance')
    return NextResponse.json(
      { error: 'Failed to export product performance' },
      { status: 500 }
    )
  }
}
