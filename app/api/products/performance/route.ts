/**
 * Product Performance API Route
 * GET /api/products/performance - Fetch product performance metrics
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 10.10
 */

import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/logger'
import type { ProductPerformance, TimeRange } from '@/types/productPerformance'

// Mark this route as dynamic
export const dynamic = 'force-dynamic';
/**
 * Calculate product performance metrics
 * This is a mock implementation that generates realistic data
 * In production, this would query actual order and product data
 */
function calculateProductPerformance(
  shopId: string,
  timeRange: TimeRange
): ProductPerformance[] {
  // Mock product data
  const mockProducts = [
    { id: '1', name: 'Wireless Headphones', imageUrl: '/assets/product1.jpg' },
    { id: '2', name: 'Smart Watch', imageUrl: '/assets/product2.jpg' },
    { id: '3', name: 'Laptop Stand', imageUrl: '/assets/product3.jpg' },
    { id: '4', name: 'USB-C Cable', imageUrl: '/assets/product4.jpg' },
    { id: '5', name: 'Phone Case', imageUrl: '/assets/product5.jpg' },
    { id: '6', name: 'Bluetooth Speaker', imageUrl: '/assets/product6.jpg' },
    { id: '7', name: 'Keyboard', imageUrl: '/assets/product7.jpg' },
    { id: '8', name: 'Mouse Pad', imageUrl: '/assets/product8.jpg' },
    { id: '9', name: 'Webcam', imageUrl: '/assets/product9.jpg' },
    { id: '10', name: 'Monitor', imageUrl: '/assets/product10.jpg' },
  ]

  const performances: ProductPerformance[] = mockProducts.map((product) => {
    // Generate realistic mock data
    const salesVolume = Math.floor(Math.random() * 500) + 50
    const revenue = salesVolume * (Math.random() * 100 + 20)
    const returnCount = Math.floor(salesVolume * (Math.random() * 0.25))
    const returnRate = salesVolume > 0 ? (returnCount / salesVolume) * 100 : 0
    const avgAIScore = Math.floor(Math.random() * 40) + 60 // 60-100 range
    
    // Determine trend (random for mock)
    const trends: ('up' | 'down' | 'stable')[] = ['up', 'down', 'stable']
    const trend = trends[Math.floor(Math.random() * trends.length)]

    return {
      productId: product.id,
      productName: product.name,
      imageUrl: product.imageUrl || '',
      salesVolume: salesVolume || 0,
      revenue: Number(revenue?.toFixed(2)) || 0,
      returnCount: returnCount || 0,
      returnRate: Number(returnRate?.toFixed(2)) || 0,
      avgAIScore: avgAIScore || 0,
      trend,
      isTopPerformer: false, // Will be calculated after sorting
      isUnderperforming: returnRate > 15 || (avgAIScore < 50),
      timeRange,
    }
  })

  // Sort by revenue to identify top performers
  const sortedByRevenue = [...performances].sort((a, b) => b.revenue - a.revenue)
  const topPerformerThreshold = Math.ceil(sortedByRevenue.length * 0.1) // Top 10%
  
  // Mark top performers
  sortedByRevenue.slice(0, topPerformerThreshold).forEach(perf => {
    const original = performances.find(p => p.productId === perf.productId)
    if (original) {
      original.isTopPerformer = true
    }
  })

  return performances
}

/**
 * GET /api/products/performance
 * Fetch product performance metrics for a shop
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const shopId = searchParams.get('shopId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const preset = searchParams.get('preset') as TimeRange['preset']

    if (!shopId) {
      return NextResponse.json(
        { error: 'Shop ID is required' },
        { status: 400 }
      )
    }

    // Parse time range
    let timeRange: TimeRange
    if (startDate && endDate) {
      timeRange = {
        start: new Date(startDate),
        end: new Date(endDate),
        preset: preset || 'custom',
      }
    } else {
      // Default to last 30 days
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 30)
      timeRange = {
        start,
        end,
        preset: '30days',
      }
    }

    // Calculate performance metrics
    const performances = calculateProductPerformance(shopId, timeRange)

    logger.info(
      `Fetched performance for ${performances.length} products`,
      'ProductPerformance'
    )

    return NextResponse.json({
      products: performances,
      timeRange,
      total: performances.length,
    })
  } catch (error) {
    logger.error('Failed to fetch product performance:', error, 'ProductPerformance')
    return NextResponse.json(
      { error: 'Failed to fetch product performance' },
      { status: 500 }
    )
  }
}
