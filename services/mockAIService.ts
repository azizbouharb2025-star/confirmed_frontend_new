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
    high: Math.floor(Math.random() * 50) + 30,  // 30-80 high confidence orders
    medium: Math.floor(Math.random() * 40) + 20, // 20-60 medium confidence
    low: Math.floor(Math.random() * 20) + 5,     // 5-25 low confidence
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
    { tag: 'Professional', count: Math.floor(Math.random() * 30) + 20 },
    { tag: 'Clear Communication', count: Math.floor(Math.random() * 25) + 15 },
    { tag: 'Fast Response', count: Math.floor(Math.random() * 20) + 10 },
    { tag: 'Helpful', count: Math.floor(Math.random() * 18) + 8 },
    { tag: 'Polite', count: Math.floor(Math.random() * 15) + 5 },
  ];

  return {
    averageRating: parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)), // 3.5-5.0
    totalFeedback: Math.floor(Math.random() * 100) + 50, // 50-150
    topTags: tags.sort((a, b) => b.count - a.count).slice(0, 5),
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

  const trendData: ComplaintTrendData[] = last7Days.map(date => ({
    date,
    count: Math.floor(Math.random() * 15) + 2, // 2-17 complaints per day
  }));

  const categories: WidgetComplaintCategory[] = [
    { category: 'Product Quality', count: Math.floor(Math.random() * 20) + 10 },
    { category: 'Delivery Issue', count: Math.floor(Math.random() * 15) + 8 },
    { category: 'Wrong Item', count: Math.floor(Math.random() * 12) + 5 },
    { category: 'Damaged Product', count: Math.floor(Math.random() * 10) + 3 },
    { category: 'Other', count: Math.floor(Math.random() * 8) + 2 },
  ];

  const totalComplaints = categories.reduce((sum, cat) => sum + cat.count, 0);

  return {
    totalComplaints,
    resolutionRate: parseFloat((Math.random() * 20 + 70).toFixed(1)), // 70-90%
    trendData,
    categories,
  };
}

/**
 * Mock Courier Performance Data
 * Shows delivery success rates by courier
 */
export function getMockCourierPerformance(): CourierData[] {
  const courierNames = ['Express Delivery', 'Fast Track', 'Quick Ship', 'Prime Courier', 'Swift Logistics'];
  
  return courierNames.map(name => ({
    name,
    successRate: parseFloat((Math.random() * 25 + 70).toFixed(1)), // 70-95%
    avgDeliveryTime: Math.floor(Math.random() * 24) + 24, // 24-48 hours
    totalDeliveries: Math.floor(Math.random() * 500) + 200, // 200-700
    returnRate: parseFloat((Math.random() * 8 + 2).toFixed(1)), // 2-10%
  })).sort((a, b) => b.successRate - a.successRate);
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

  const baseOrders = Math.floor(Math.random() * 30) + 40; // 40-70 base orders

  const forecastedOrders: ForecastDataPoint[] = next7Days.map((date, i) => {
    const predicted = baseOrders + Math.floor(Math.random() * 20) - 10 + i * 2;
    const actual = i < 2 ? predicted + Math.floor(Math.random() * 10) - 5 : undefined;
    
    return {
      date,
      predicted,
      actual,
      confidenceLow: Math.floor(predicted * 0.85),
      confidenceHigh: Math.floor(predicted * 1.15),
    };
  });

  return {
    forecastedOrders,
    forecastedConfirmationRate: parseFloat((Math.random() * 15 + 75).toFixed(1)), // 75-90%
    confidence: parseFloat((Math.random() * 20 + 75).toFixed(0)), // 75-95%
  };
}

/**
 * Mock Automation Recommendations
 * Shows AI-powered workflow optimization suggestions
 */
export function getMockAutomationRecommendations(): Recommendation[] {
  const recommendations: Recommendation[] = [
    {
      id: '1',
      title: 'Switch to Express Delivery in Tunis',
      description: 'Express Delivery has 92% success rate vs 78% for current courier in Tunis region',
      impact: 'high',
      category: 'Courier Optimization',
    },
    {
      id: '2',
      title: 'Adjust pricing for Product X in Sfax',
      description: 'Product X has 40% cancellation rate in Sfax. Consider 10% price reduction.',
      impact: 'high',
      category: 'Pricing Strategy',
    },
    {
      id: '3',
      title: 'Enable auto-confirmation for high-score orders',
      description: 'Orders with AI score >85% have 95% confirmation rate. Auto-confirm to save time.',
      impact: 'medium',
      category: 'Workflow Automation',
    },
    {
      id: '4',
      title: 'Schedule deliveries for afternoon',
      description: 'Afternoon deliveries have 15% higher success rate in your region.',
      impact: 'medium',
      category: 'Delivery Optimization',
    },
    {
      id: '5',
      title: 'Add product images to reduce complaints',
      description: 'Products without images have 3x more complaints. Add images to top 10 products.',
      impact: 'low',
      category: 'Product Quality',
    },
  ];

  // Randomly select 2-4 recommendations
  const count = Math.floor(Math.random() * 3) + 2;
  return recommendations
    .sort(() => Math.random() - 0.5)
    .slice(0, count);
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
    totalUsers: Math.floor(Math.random() * 500) + 200, // 200-700
    totalUsersChange: parseFloat((Math.random() * 20 - 5).toFixed(1)), // -5% to +15%
    totalOrders: Math.floor(Math.random() * 2000) + 1000, // 1000-3000
    totalOrdersChange: parseFloat((Math.random() * 25 - 5).toFixed(1)), // -5% to +20%
    revenue: Math.floor(Math.random() * 50000) + 30000, // 30k-80k
    revenueChange: parseFloat((Math.random() * 30 - 10).toFixed(1)), // -10% to +20%
    activeShops: Math.floor(Math.random() * 50) + 20, // 20-70
    activeShopsChange: parseFloat((Math.random() * 15 - 3).toFixed(1)), // -3% to +12%
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
  
  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    if (period === 'daily') {
      date.setDate(date.getDate() - (days - 1 - i));
    } else if (period === 'weekly') {
      date.setDate(date.getDate() - (days - 1 - i) * 7);
    } else {
      date.setMonth(date.getMonth() - (days - 1 - i));
    }
    
    return {
      date: date.toISOString().split('T')[0],
      orders: Math.floor(Math.random() * 100) + 50, // 50-150 orders
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
  let cumulative = 0;
  
  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    
    const dailyRevenue = Math.floor(Math.random() * 3000) + 1000; // 1k-4k per day
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
