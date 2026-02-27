# Mock AI/Analytics Service Documentation

## Overview

This document describes the mock AI and analytics services that provide realistic data for all dashboard features. These mock services allow the frontend to work immediately while you build the real AI backend.

## Architecture

```
Frontend (Next.js)
    ↓
API Routes (/app/api/*)
    ↓
Mock AI Service (services/mockAIService.ts)
    ↓
Returns realistic mock data
```

## Mock Services Implemented

### 1. Client Dashboard Services

#### Risk Score Distribution
- **Endpoint**: `GET /api/analytics/risk-score-distribution`
- **Returns**: Distribution of orders by AI confidence level
- **Data Structure**:
```typescript
{
  high: number,    // Orders with AI score > 80%
  medium: number,  // Orders with AI score 50-80%
  low: number      // Orders with AI score < 50%
}
```

#### Operator Feedback
- **Endpoint**: `GET /api/analytics/operator-feedback`
- **Returns**: Average ratings and top feedback tags
- **Data Structure**:
```typescript
{
  averageRating: number,      // 3.5-5.0
  totalFeedback: number,      // Total feedback count
  topTags: Array<{
    tag: string,
    count: number
  }>
}
```

#### Complaints Analytics
- **Endpoint**: `GET /api/analytics/complaints`
- **Returns**: Complaint trends and categories
- **Data Structure**:
```typescript
{
  totalComplaints: number,
  resolutionRate: number,     // Percentage
  trendData: Array<{
    date: string,
    count: number
  }>,
  categories: Array<{
    category: string,
    count: number
  }>
}
```

#### Courier Performance
- **Endpoint**: `GET /api/analytics/courier-performance`
- **Returns**: Delivery success rates by courier
- **Data Structure**:
```typescript
{
  couriers: Array<{
    name: string,
    successRate: number,        // Percentage
    avgDeliveryTime: number,    // Hours
    totalDeliveries: number,
    returnRate: number          // Percentage
  }>
}
```

#### Predictive Analytics
- **Endpoint**: `GET /api/analytics/predictive`
- **Returns**: Forecasted order volumes with confidence bands
- **Data Structure**:
```typescript
{
  forecastedOrders: Array<{
    date: string,
    predicted: number,
    actual?: number,
    confidenceLow: number,
    confidenceHigh: number
  }>,
  forecastedConfirmationRate: number,
  confidence: number              // AI confidence 0-100
}
```

#### Automation Recommendations
- **Endpoint**: `GET /api/analytics/automation-recommendations`
- **Returns**: AI-powered workflow optimization suggestions
- **Data Structure**:
```typescript
{
  recommendations: Array<{
    id: string,
    title: string,
    description: string,
    impact: 'high' | 'medium' | 'low',
    category: string
  }>
}
```

---

### 2. Admin Dashboard Services

#### System Health
- **Endpoint**: `GET /api/admin/system-health`
- **Returns**: Health status of all system services
- **Data Structure**:
```typescript
{
  services: Array<{
    name: string,
    status: 'healthy' | 'degraded' | 'down',
    responseTime: number,       // Milliseconds
    uptime: number,             // Percentage
    lastChecked: string         // ISO timestamp
  }>
}
```

#### Activity Feed
- **Endpoint**: `GET /api/admin/activity-feed`
- **Returns**: Recent system activities
- **Data Structure**:
```typescript
{
  activities: Array<{
    id: string,
    type: 'order' | 'user' | 'shop' | 'system',
    message: string,
    timestamp: string,
    user?: string
  }>
}
```

#### Admin KPIs
- **Endpoint**: `GET /api/admin/kpis`
- **Returns**: System-wide metrics
- **Data Structure**:
```typescript
{
  totalUsers: number,
  totalUsersChange: number,       // Percentage
  totalOrders: number,
  totalOrdersChange: number,      // Percentage
  revenue: number,
  revenueChange: number,          // Percentage
  activeShops: number,
  activeShopsChange: number       // Percentage
}
```

#### Orders Chart
- **Endpoint**: `GET /api/admin/charts/orders?period=daily`
- **Query Params**: `period` (daily|weekly|monthly)
- **Returns**: Order trend data
- **Data Structure**:
```typescript
{
  data: Array<{
    date: string,
    orders: number
  }>,
  totalOrders: number,
  changePercent: number
}
```

#### Revenue Chart
- **Endpoint**: `GET /api/admin/charts/revenue?viewMode=daily`
- **Query Params**: `viewMode` (daily|cumulative)
- **Returns**: Revenue trend data
- **Data Structure**:
```typescript
{
  data: Array<{
    date: string,
    revenue: number,
    cumulative?: number
  }>,
  totalRevenue: number,
  growthPercent: number
}
```

---

### 3. AI Analysis Services

#### Order AI Scoring
- **Function**: `mockAIService.getOrderAIScore(orderData)`
- **Purpose**: Calculate AI confidence score for an order
- **Input**:
```typescript
{
  customerPhone?: string,
  orderValue?: number,
  region?: string,
  isReturningCustomer?: boolean
}
```
- **Output**:
```typescript
{
  aiScore: number,                    // 0-100
  riskLevel: 'high' | 'medium' | 'low',
  deliverySuccessProbability: number, // 0-100
  factors: Array<{
    factor: string,
    impact: number,
    description: string
  }>
}
```

#### Complaint AI Analysis
- **Function**: `mockAIService.getComplaintAIAnalysis(complaintText)`
- **Purpose**: Analyze complaint text using NLP
- **Input**: Complaint description text
- **Output**:
```typescript
{
  aiTags: Array<{
    tag: string,
    confidence: number
  }>,
  aiPrimaryCategory: string,
  requiresManualReview: boolean,
  sentiment: 'positive' | 'neutral' | 'negative',
  urgency: 'low' | 'medium' | 'high'
}
```

---

## How to Use

### In Your Frontend Components

The mock services are already integrated. Your components will automatically receive mock data:

```typescript
// Example: Client Dashboard
const { data } = await api.get('/api/analytics/risk-score-distribution');
// Returns mock data: { high: 45, medium: 30, low: 15 }
```

### Testing the APIs

Use curl or Postman to test:

```bash
# Test risk score distribution
curl http://localhost:3000/api/analytics/risk-score-distribution

# Test admin KPIs
curl http://localhost:3000/api/admin/kpis

# Test orders chart with period
curl "http://localhost:3000/api/admin/charts/orders?period=weekly"
```

---

## Replacing with Real AI Service

When you're ready to implement the real AI backend, follow these steps:

### Step 1: Build Your AI Service

Create a Python FastAPI service (or similar):

```python
# ai_service.py
from fastapi import FastAPI

app = FastAPI()

@app.post("/api/ml/score-order")
async def score_order(order_data: dict):
    # Your ML model here
    score = ml_model.predict(order_data)
    return {
        "aiScore": score,
        "riskLevel": calculate_risk_level(score),
        "deliverySuccessProbability": predict_delivery_success(order_data)
    }
```

### Step 2: Update API Routes

Replace mock calls with real service calls:

```typescript
// app/api/analytics/risk-score-distribution/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // BEFORE (mock):
    // const data = mockAIService.getRiskScoreData();
    
    // AFTER (real):
    const response = await fetch('http://ai-service:8000/api/ml/risk-distribution', {
      headers: { 'Authorization': `Bearer ${process.env.AI_SERVICE_TOKEN}` }
    });
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Risk score error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
```

### Step 3: Environment Variables

Add to `.env`:

```bash
# AI/ML Service Configuration
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_TOKEN=your_secret_token_here
ENABLE_MOCK_AI=false
```

### Step 4: Gradual Migration

You can migrate one feature at a time:

```typescript
// Hybrid approach
const USE_MOCK = process.env.ENABLE_MOCK_AI === 'true';

export async function GET() {
  if (USE_MOCK) {
    return NextResponse.json(mockAIService.getRiskScoreData());
  }
  
  // Real AI service call
  const data = await aiService.getRiskScoreData();
  return NextResponse.json(data);
}
```

---

## Mock Data Characteristics

### Realistic Ranges

All mock data uses realistic ranges based on typical e-commerce metrics:

- **AI Scores**: 0-100 (weighted toward 50-80 range)
- **Success Rates**: 70-95%
- **Delivery Times**: 24-48 hours
- **Complaint Rates**: 2-15%
- **Confirmation Rates**: 75-90%

### Randomization

Data includes controlled randomness to simulate real-world variability:

```typescript
// Example: Orders vary between 50-150 per day
orders: Math.floor(Math.random() * 100) + 50
```

### Time-Based Data

Trend data uses proper date sequences:

```typescript
// Last 7 days
Array.from({ length: 7 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (6 - i));
  return date.toISOString().split('T')[0];
});
```

---

## Benefits of Mock Service

1. **Immediate Development**: Frontend works without waiting for AI backend
2. **Realistic Testing**: Mock data mimics real patterns
3. **Easy Replacement**: Simple to swap with real service later
4. **Consistent Interface**: Same API contract for mock and real
5. **Demo Ready**: Can demo features to stakeholders immediately

---

## Next Steps

### Phase 1: Use Mocks (Current)
✅ All dashboard features work with mock data
✅ Can demo and test UI/UX
✅ Can develop frontend features independently

### Phase 2: Build Simple Rules
- Replace mock scoring with rule-based logic
- Use MongoDB aggregations for analytics
- Implement basic calculations

### Phase 3: Add ML Models
- Train models on historical data
- Implement Python ML service
- Deploy predictive analytics

### Phase 4: Advanced AI
- NLP for complaint analysis
- Deep learning for predictions
- Real-time scoring

---

## Troubleshooting

### Mock data not showing?

Check that API routes are created:
```bash
ls -la app/api/analytics/
ls -la app/api/admin/
```

### TypeScript errors?

Ensure types match between mock service and components:
```typescript
import type { RiskScoreData } from '@/components/dashboard/widgets/RiskScoreWidget';
```

### Need different mock data?

Edit `services/mockAIService.ts` and adjust ranges:
```typescript
// Change order count range
orders: Math.floor(Math.random() * 200) + 100  // 100-300 instead of 50-150
```

---

## Support

For questions about:
- **Mock Service**: Check `services/mockAIService.ts`
- **API Routes**: Check `app/api/analytics/*` and `app/api/admin/*`
- **Real AI Implementation**: See main documentation

---

## Summary

You now have a complete mock AI/analytics service that:
- ✅ Provides data for all client dashboard widgets
- ✅ Provides data for all admin dashboard features
- ✅ Returns realistic, time-based data
- ✅ Can be easily replaced with real AI service
- ✅ Allows immediate frontend development and testing

Your dashboards will work perfectly with this mock data while you build the real AI backend!
