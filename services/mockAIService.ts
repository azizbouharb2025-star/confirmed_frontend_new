/**
 * Mock AI/Analytics Service
 * Provides realistic mock data for all AI-powered features
 * Replace with real AI backend when ready
 */

import type { RiskScoreData } from '@/components/dashboard/widgets/RiskScoreWidget';
import type { FeedbackTag } from '@/components/dashboard/widgets/OperatorFeedbackWidget';
import type { ComplaintTrendData, ComplaintCategory as WidgetComplaintCategory } from '@/components/dashboard/widgets/ComplaintsAnalyticsWidget';
import type { CourierData } from '@/components/dashboard/widgets/CourierPerformanceWidget';
import type { ForecastDataPoint } from '@/components/dashboard/widgets/PredictiveAnalyticsWidget';
import type { Recommendation } from '@/components/dashboard/widgets/AutomationRecommendationsWidget';

// ============================================================================
// Client Dashboard Mock Data
// ============================================================================

/**
 * Mock Risk Score Distribution
 * Shows distribution of orders by AI confidence level
 */
export function getMockRiskScoreData(): RiskScoreData {
  return {
    high: 142,  // High confidence orders (85-100% AI score)
    medium: 67, // Medium confidence orders (50-84% AI score)
    low: 18,    // Low confidence orders (0-49% AI score)
  };
}

/**
 * Mock Operator Feedback Data
 * Shows average ratings and common feedback tags
 */
export function getMockOperatorFeedback(): {
  averageRating: number;
  totalFeedback: number;
  topTags: FeedbackTag[];
} {
  const tags: FeedbackTag[] = [
    { tag: 'Professional', count: 48 },
    { tag: 'Clear Communication', count: 42 },
    { tag: 'Fast Response', count: 38 },
    { tag: 'Helpful', count: 35 },
    { tag: 'Polite', count: 31 },
  ];

  return {
    averageRating: 4.6,
    totalFeedback: 227,
    topTags: tags,
  };
}

/**
 * Mock Complaints Analytics Data
 * Shows complaint trends and categories
 */
export function getMockComplaintsAnalytics(): {
  totalComplaints: number;
  resolutionRate: number;
  trendData: ComplaintTrendData[];
  categories: WidgetComplaintCategory[];
} {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const trendData: ComplaintTrendData[] = [
    { date: last7Days[0], count: 8 },
    { date: last7Days[1], count: 12 },
    { date: last7Days[2], count: 6 },
    { date: last7Days[3], count: 9 },
    { date: last7Days[4], count: 11 },
    { date: last7Days[5], count: 7 },
    { date: last7Days[6], count: 5 },
  ];

  const categories: WidgetComplaintCategory[] = [
    { category: 'Delivery Issue', count: 24 },
    { category: 'Product Quality', count: 18 },
    { category: 'Wrong Item', count: 9 },
    { category: 'Damaged Product', count: 6 },
    { category: 'Other', count: 1 },
  ];

  const totalComplaints = 58;

  return {
    totalComplaints,
    resolutionRate: 86.2,
    trendData,
    categories,
  };
}

/**
 * Mock Courier Performance Data
 * Shows delivery success rates by courier
 */
export function getMockCourierPerformance(): CourierData[] {
  return [
    { name: 'Aramex Tunisia', successRate: 94.3, avgDeliveryTime: 26, totalDeliveries: 542, returnRate: 2.8 },
    { name: 'Rapid Express', successRate: 91.7, avgDeliveryTime: 28, totalDeliveries: 387, returnRate: 3.5 },
    { name: 'Tunisia Post', successRate: 88.2, avgDeliveryTime: 35, totalDeliveries: 621, returnRate: 4.9 },
    { name: 'Swift Delivery', successRate: 85.6, avgDeliveryTime: 32, totalDeliveries: 298, returnRate: 5.7 },
    { name: 'Local Courier', successRate: 79.4, avgDeliveryTime: 41, totalDeliveries: 156, returnRate: 8.2 },
  ];
}

/**
 * Mock Predictive Analytics Data
 * Shows forecasted order volumes with confidence bands
 */
export function getMockPredictiveAnalytics(): {
  forecastedOrders: ForecastDataPoint[];
  forecastedConfirmationRate: number;
  confidence: number;
} {
  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date.toISOString().split('T')[0];
  });

  const predictions = [58, 62, 65, 71, 68, 74, 79];
  const actuals = [56, 64, undefined, undefined, undefined, undefined, undefined];

  const forecastedOrders: ForecastDataPoint[] = next7Days.map((date, i) => ({
    date,
    predicted: predictions[i],
    actual: actuals[i],
    confidenceLow: Math.floor(predictions[i] * 0.88),
    confidenceHigh: Math.floor(predictions[i] * 1.12),
  }));

  return {
    forecastedOrders,
    forecastedConfirmationRate: 87.3,
    confidence: 89,
  };
}

/**
 * Mock Automation Recommendations
 * Shows AI-powered workflow optimization suggestions
 */
export function getMockAutomationRecommendations(): Recommendation[] {
  return [
    {
      id: '1',
      title: 'Switch to Aramex Tunisia for Tunis deliveries',
      description: 'Aramex has 94.3% success rate vs 79.4% for current courier in Tunis region. Potential 15% improvement.',
      impact: 'high',
      category: 'Courier Optimization',
    },
    {
      id: '2',
      title: 'Enable auto-confirmation for high-score orders',
      description: 'Orders with AI score >85% have 96% confirmation rate. Auto-confirm to save 2.5 hours daily.',
      impact: 'high',
      category: 'Workflow Automation',
    },
    {
      id: '3',
      title: 'Schedule deliveries for afternoon slots',
      description: 'Afternoon deliveries (14:00-18:00) have 18% higher success rate in your regions.',
      impact: 'medium',
      category: 'Delivery Optimization',
    },
  ];
}

// ============================================================================
// Admin Dashboard Mock Data
// ============================================================================

/**
 * Mock System Health Data
 * Shows status of various system services
 */
export function getMockSystemHealth(): Array<{
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  uptime: number;
  lastChecked: string;
}> {
  const services = [
    { name: 'API Server', baseUptime: 99.9 },
    { name: 'Database', baseUptime: 99.8 },
    { name: 'Redis Cache', baseUptime: 99.5 },
    { name: 'File Storage', baseUptime: 99.7 },
    { name: 'Email Service', baseUptime: 98.5 },
    { name: 'SMS Gateway', baseUptime: 97.8 },
  ];

  return services.map(service => {
    const rand = Math.random();
    let status: 'healthy' | 'degraded' | 'down';
    
    if (rand > 0.95) status = 'degraded';
    else if (rand > 0.98) status = 'down';
    else status = 'healthy';

    return {
      name: service.name,
      status,
      responseTime: Math.floor(Math.random() * 200) + 50, // 50-250ms
      uptime: parseFloat((service.baseUptime + Math.random() * 0.5 - 0.2).toFixed(2)),
      lastChecked: new Date().toISOString(),
    };
  });
}

/**
 * Mock Activity Feed Data
 * Shows recent system activities
 */
export function getMockActivityFeed(): Array<{
  id: string;
  type: 'order' | 'user' | 'shop' | 'system';
  message: string;
  timestamp: string;
  user?: string;
}> {
  const activities = [
    { type: 'order' as const, message: 'New order #ORD-1234 created', user: 'Shop A' },
    { type: 'user' as const, message: 'New user registered: john@example.com', user: 'System' },
    { type: 'shop' as const, message: 'Shop "Electronics Store" upgraded to Pro plan', user: 'Admin' },
    { type: 'order' as const, message: 'Order #ORD-1233 confirmed', user: 'Operator 5' },
    { type: 'system' as const, message: 'Database backup completed successfully', user: 'System' },
    { type: 'order' as const, message: 'Order #ORD-1232 shipped', user: 'Shop B' },
    { type: 'user' as const, message: 'User sarah@example.com updated profile', user: 'Sarah' },
    { type: 'shop' as const, message: 'New shop "Fashion Boutique" created', user: 'Admin' },
  ];

  return activities.map((activity, i) => ({
    id: `activity-${i}`,
    type: activity.type,
    message: activity.message,
    timestamp: new Date(Date.now() - i * 15 * 60 * 1000).toISOString(), // 15 min intervals
    user: activity.user,
  }));
}

/**
 * Mock Admin KPIs
 * Shows system-wide metrics
 */
export function getMockAdminKPIs(): {
  totalUsers: number;
  totalUsersChange: number;
  totalOrders: number;
  totalOrdersChange: number;
  revenue: number;
  revenueChange: number;
  activeShops: number;
  activeShopsChange: number;
} {
  return {
    totalUsers: 487,
    totalUsersChange: 12.3,
    totalOrders: 2847,
    totalOrdersChange: 18.7,
    revenue: 68450,
    revenueChange: 15.2,
    activeShops: 43,
    activeShopsChange: 8.6,
  };
}

/**
 * Mock Orders Chart Data
 * Shows order trends over time
 */
export function getMockOrdersChartData(period: 'daily' | 'weekly' | 'monthly' = 'daily'): Array<{
  date: string;
  orders: number;
}> {
  const days = period === 'daily' ? 7 : period === 'weekly' ? 12 : 12;
  const dailyOrders = [52, 68, 71, 65, 78, 82, 89];
  const weeklyOrders = [385, 412, 398, 445, 467, 489, 512, 538, 556, 582, 601, 627];
  const monthlyOrders = [1842, 1956, 2103, 2187, 2345, 2421, 2598, 2687, 2789, 2856, 2934, 3012];
  
  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    if (period === 'daily') {
      date.setDate(date.getDate() - (days - 1 - i));
    } else if (period === 'weekly') {
      date.setDate(date.getDate() - (days - 1 - i) * 7);
    } else {
      date.setMonth(date.getMonth() - (days - 1 - i));
    }
    
    const orders = period === 'daily' ? dailyOrders[i] : period === 'weekly' ? weeklyOrders[i] : monthlyOrders[i];
    
    return {
      date: date.toISOString().split('T')[0],
      orders,
    };
  });
}

/**
 * Mock Revenue Chart Data
 * Shows revenue trends over time
 */
export function getMockRevenueChartData(viewMode: 'daily' | 'cumulative' = 'daily'): Array<{
  date: string;
  revenue: number;
  cumulative?: number;
}> {
  const days = 30;
  const dailyRevenues = [
    1850, 2120, 2340, 1980, 2450, 2680, 2890,
    2150, 2420, 2580, 2210, 2750, 2920, 3100,
    2380, 2640, 2810, 2450, 2890, 3050, 3280,
    2520, 2780, 2950, 2590, 3020, 3180, 3420,
    2680, 2940
  ];
  let cumulative = 0;
  
  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    
    const dailyRevenue = dailyRevenues[i];
    cumulative += dailyRevenue;
    
    return {
      date: date.toISOString().split('T')[0],
      revenue: dailyRevenue,
      cumulative: viewMode === 'cumulative' ? cumulative : undefined,
    };
  });
}

// ============================================================================
// Order AI Scoring
// ============================================================================

/**
 * Mock AI Score for an order
 * In production, this would call ML service with order details
 */
export function getMockOrderAIScore(orderData?: {
  customerPhone?: string;
  orderValue?: number;
  region?: string;
  isReturningCustomer?: boolean;
}): {
  aiScore: number;
  riskLevel: 'high' | 'medium' | 'low';
  deliverySuccessProbability: number;
  factors: Array<{ factor: string; impact: number; description: string }>;
} {
  // Simple rule-based scoring for demo
  let score = 50; // Base score
  const factors: Array<{ factor: string; impact: number; description: string }> = [];

  if (orderData?.isReturningCustomer) {
    score += 25;
    factors.push({
      factor: 'Returning Customer',
      impact: 25,
      description: 'Customer has successful order history',
    });
  }

  if (orderData?.orderValue && orderData.orderValue > 100) {
    score += 10;
    factors.push({
      factor: 'High Order Value',
      impact: 10,
      description: 'Order value indicates serious buyer',
    });
  }

  if (orderData?.region === 'Tunis' || orderData?.region === 'Ariana') {
    score += 10;
    factors.push({
      factor: 'High-Performance Region',
      impact: 10,
      description: 'Region has high delivery success rate',
    });
  }

  // Add some randomness
  score += Math.floor(Math.random() * 10) - 5;
  score = Math.max(0, Math.min(100, score)); // Clamp to 0-100

  const riskLevel: 'high' | 'medium' | 'low' = 
    score > 80 ? 'high' : score >= 50 ? 'medium' : 'low';

  const deliverySuccessProbability = Math.min(95, score + Math.floor(Math.random() * 10));

  return {
    aiScore: score,
    riskLevel,
    deliverySuccessProbability,
    factors,
  };
}

// ============================================================================
// Complaint AI Analysis
// ============================================================================

/**
 * Mock AI analysis for a complaint
 * In production, this would use NLP to analyze complaint text
 */
export function getMockComplaintAIAnalysis(complaintText: string): {
  aiTags: Array<{ tag: string; confidence: number }>;
  aiPrimaryCategory: string;
  requiresManualReview: boolean;
  sentiment: 'positive' | 'neutral' | 'negative';
  urgency: 'low' | 'medium' | 'high';
} {
  // Simple keyword-based analysis for demo
  const text = complaintText.toLowerCase();
  const tags: Array<{ tag: string; confidence: number }> = [];

  if (text.includes('damaged') || text.includes('broken')) {
    tags.push({ tag: 'Product Damage', confidence: 0.92 });
  }
  if (text.includes('late') || text.includes('delay')) {
    tags.push({ tag: 'Delivery Delay', confidence: 0.88 });
  }
  if (text.includes('wrong') || text.includes('incorrect')) {
    tags.push({ tag: 'Wrong Item', confidence: 0.85 });
  }
  if (text.includes('quality') || text.includes('poor')) {
    tags.push({ tag: 'Quality Issue', confidence: 0.80 });
  }
  if (text.includes('missing') || text.includes('incomplete')) {
    tags.push({ tag: 'Missing Item', confidence: 0.87 });
  }

  // Default tag if no matches
  if (tags.length === 0) {
    tags.push({ tag: 'General Complaint', confidence: 0.65 });
  }

  const primaryCategory = tags[0]?.tag || 'Other';
  const requiresManualReview = tags.length === 0 || tags[0].confidence < 0.7;

  // Sentiment analysis
  const negativeWords = ['bad', 'terrible', 'awful', 'worst', 'horrible', 'disappointed'];
  const positiveWords = ['good', 'great', 'excellent', 'satisfied', 'happy'];
  
  const hasNegative = negativeWords.some(word => text.includes(word));
  const hasPositive = positiveWords.some(word => text.includes(word));
  
  const sentiment: 'positive' | 'neutral' | 'negative' = 
    hasNegative ? 'negative' : hasPositive ? 'positive' : 'neutral';

  // Urgency based on keywords
  const urgentWords = ['urgent', 'immediately', 'asap', 'emergency'];
  const urgency: 'low' | 'medium' | 'high' = 
    urgentWords.some(word => text.includes(word)) ? 'high' : 
    hasNegative ? 'medium' : 'low';

  return {
    aiTags: tags,
    aiPrimaryCategory: primaryCategory,
    requiresManualReview,
    sentiment,
    urgency,
  };
}

// ============================================================================
// Export all mock functions
// ============================================================================

export const mockAIService = {
  // Client Dashboard
  getRiskScoreData: getMockRiskScoreData,
  getOperatorFeedback: getMockOperatorFeedback,
  getComplaintsAnalytics: getMockComplaintsAnalytics,
  getCourierPerformance: getMockCourierPerformance,
  getPredictiveAnalytics: getMockPredictiveAnalytics,
  getAutomationRecommendations: getMockAutomationRecommendations,
  
  // Admin Dashboard
  getSystemHealth: getMockSystemHealth,
  getActivityFeed: getMockActivityFeed,
  getAdminKPIs: getMockAdminKPIs,
  getOrdersChartData: getMockOrdersChartData,
  getRevenueChartData: getMockRevenueChartData,
  
  // AI Analysis
  getOrderAIScore: getMockOrderAIScore,
  getComplaintAIAnalysis: getMockComplaintAIAnalysis,
};

export default mockAIService;
