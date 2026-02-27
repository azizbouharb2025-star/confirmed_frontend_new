# Quick Reference: Mock AI Services

## 📋 All Mock Endpoints

### Client Dashboard APIs

| Endpoint | Returns | Tier |
|----------|---------|------|
| `GET /api/analytics/risk-score-distribution` | Order distribution by AI score | Pro+ |
| `GET /api/analytics/operator-feedback` | Ratings and feedback tags | Pro+ |
| `GET /api/analytics/complaints` | Complaint trends & categories | Business+ |
| `GET /api/analytics/courier-performance` | Courier success rates | Business+ |
| `GET /api/analytics/predictive` | Order forecasts | Enterprise |
| `GET /api/analytics/automation-recommendations` | AI workflow suggestions | Enterprise |

### Admin Dashboard APIs

| Endpoint | Returns |
|----------|---------|
| `GET /api/admin/kpis` | System-wide metrics |
| `GET /api/admin/charts/orders?period=daily` | Order trend data |
| `GET /api/admin/charts/revenue?viewMode=daily` | Revenue trend data |
| `GET /api/admin/system-health` | Service health status |
| `GET /api/admin/activity-feed` | Recent activities |

---

## 🧪 Quick Test Commands

```bash
# Start dev server
npm run dev

# Test risk score
curl http://localhost:3000/api/analytics/risk-score-distribution

# Test predictive analytics
curl http://localhost:3000/api/analytics/predictive

# Test admin KPIs
curl http://localhost:3000/api/admin/kpis

# Test with query params
curl "http://localhost:3000/api/admin/charts/orders?period=weekly"
```

---

## 📝 Mock Data Examples

### Risk Score
```json
{ "high": 45, "medium": 30, "low": 15 }
```

### Operator Feedback
```json
{
  "averageRating": 4.3,
  "totalFeedback": 87,
  "topTags": [
    { "tag": "Professional", "count": 32 }
  ]
}
```

### Courier Performance
```json
{
  "couriers": [
    {
      "name": "Express Delivery",
      "successRate": 92.3,
      "avgDeliveryTime": 36,
      "totalDeliveries": 980,
      "returnRate": 2.1
    }
  ]
}
```

### Predictive Analytics
```json
{
  "forecastedOrders": [
    {
      "date": "2024-01-15",
      "predicted": 65,
      "actual": 62,
      "confidenceLow": 55,
      "confidenceHigh": 75
    }
  ],
  "forecastedConfirmationRate": 82.5,
  "confidence": 87
}
```

### Recommendations
```json
{
  "recommendations": [
    {
      "id": "1",
      "title": "Switch to Express Delivery",
      "description": "92% success rate vs 78%",
      "impact": "high",
      "category": "Courier Optimization"
    }
  ]
}
```

---

## 🔧 Customizing Mock Data

Edit `services/mockAIService.ts`:

```typescript
// Change order count range
export function getMockRiskScoreData(): RiskScoreData {
  return {
    high: Math.floor(Math.random() * 100) + 50,  // 50-150 instead of 30-80
    medium: Math.floor(Math.random() * 80) + 40,
    low: Math.floor(Math.random() * 40) + 10,
  };
}

// Change rating range
export function getMockOperatorFeedback() {
  return {
    averageRating: parseFloat((Math.random() * 0.5 + 4.5).toFixed(1)), // 4.5-5.0 instead of 3.5-5.0
    // ...
  };
}
```

---

## 🚀 Replacing with Real AI

### Step 1: Create Python Service

```python
# main.py
from fastapi import FastAPI

app = FastAPI()

@app.get("/api/ml/risk-distribution")
async def get_risk_distribution():
    # Your real logic here
    return {"high": 45, "medium": 30, "low": 15}
```

### Step 2: Update Next.js Route

```typescript
// app/api/analytics/risk-score-distribution/route.ts
const AI_SERVICE_URL = process.env.AI_SERVICE_URL;

export async function GET() {
  const response = await fetch(`${AI_SERVICE_URL}/api/ml/risk-distribution`);
  const data = await response.json();
  return NextResponse.json(data);
}
```

### Step 3: Environment Variables

```bash
# .env.local
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_TOKEN=your_secret_token
```

---

## 📚 Documentation Files

- **`MOCK_AI_SERVICE_README.md`** - Complete documentation
- **`AI_SERVICE_IMPLEMENTATION_GUIDE.md`** - How to build real AI
- **`MOCK_AI_SETUP_COMPLETE.md`** - Setup summary
- **`BACKEND_CHANGES_REQUIRED.md`** - Backend requirements

---

## ✅ Checklist

- [x] Mock service created (`services/mockAIService.ts`)
- [x] Client dashboard APIs created
- [x] Admin dashboard APIs created
- [x] Build passes successfully
- [x] Documentation complete
- [ ] Test all endpoints
- [ ] Demo to stakeholders
- [ ] Plan real AI implementation

---

## 🆘 Quick Fixes

### No data showing?
```bash
# Check if server is running
npm run dev

# Check browser console for errors
# Open DevTools > Console
```

### TypeScript errors?
```bash
# Check types
npm run build

# If errors, check import paths in API routes
```

### Want to disable mocks?
```typescript
// Add to API route
if (process.env.ENABLE_MOCK_AI === 'false') {
  // Call real service
}
```

---

## 🎯 Key Points

1. **All dashboards work** with mock data
2. **No AI backend needed** to start
3. **Easy to replace** with real service later
4. **Realistic data** for demos and testing
5. **Subscription tiers** work correctly

---

**You're all set! Start testing your dashboards now.** 🚀
