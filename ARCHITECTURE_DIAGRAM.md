# Architecture Diagram: Mock AI Services

## Current Setup (With Mocks)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                          │
│                                                                     │
│  ┌──────────────────────┐         ┌──────────────────────┐        │
│  │  Client Dashboard    │         │   Admin Dashboard    │        │
│  │                      │         │                      │        │
│  │  • Risk Score Widget │         │  • System KPIs       │        │
│  │  • Operator Feedback │         │  • Order Charts      │        │
│  │  • Complaints        │         │  • Revenue Charts    │        │
│  │  • Courier Perf      │         │  • Activity Feed     │        │
│  │  • Predictive        │         │  • System Health     │        │
│  │  • Recommendations   │         │                      │        │
│  └──────────┬───────────┘         └──────────┬───────────┘        │
│             │                                 │                     │
│             └─────────────┬───────────────────┘                     │
│                           │                                         │
│                           ▼                                         │
│              ┌────────────────────────┐                            │
│              │   API Routes (Next.js) │                            │
│              │                        │                            │
│              │  /api/analytics/*      │                            │
│              │  /api/admin/*          │                            │
│              └────────────┬───────────┘                            │
│                           │                                         │
└───────────────────────────┼─────────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │   Mock AI Service       │
              │   (TypeScript)          │
              │                         │
              │  • getRiskScoreData()   │
              │  • getOperatorFeedback()│
              │  • getPredictiveData()  │
              │  • getRecommendations() │
              │  • getAdminKPIs()       │
              │  • getSystemHealth()    │
              └─────────────────────────┘
                            │
                            ▼
                  Returns Mock Data
              (Realistic, Dynamic Values)
```

---

## Future Setup (With Real AI)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                          │
│                                                                     │
│  ┌──────────────────────┐         ┌──────────────────────┐        │
│  │  Client Dashboard    │         │   Admin Dashboard    │        │
│  └──────────┬───────────┘         └──────────┬───────────┘        │
│             │                                 │                     │
│             └─────────────┬───────────────────┘                     │
│                           │                                         │
│                           ▼                                         │
│              ┌────────────────────────┐                            │
│              │   API Routes (Next.js) │                            │
│              └────────────┬───────────┘                            │
└───────────────────────────┼─────────────────────────────────────────┘
                            │
                            │ HTTP/REST
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    AI/ML SERVICE (Python/FastAPI)                   │
│                                                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐ │
│  │  Order Scoring   │  │  Predictive      │  │  Recommendations│ │
│  │                  │  │  Analytics       │  │  Engine         │ │
│  │  • AI Score      │  │                  │  │                 │ │
│  │  • Risk Level    │  │  • Forecasting   │  │  • Pattern      │ │
│  │  • Delivery Prob │  │  • Trends        │  │    Detection    │ │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬────────┘ │
│           │                     │                      │          │
│           └─────────────────────┼──────────────────────┘          │
│                                 │                                  │
│                                 ▼                                  │
│                    ┌────────────────────────┐                     │
│                    │   ML Models & NLP      │                     │
│                    │                        │                     │
│                    │  • scikit-learn        │                     │
│                    │  • Prophet (forecast)  │                     │
│                    │  • Transformers (NLP)  │                     │
│                    └────────────────────────┘                     │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │   Database (MongoDB)     │
                    │                          │
                    │  • Orders                │
                    │  • Complaints            │
                    │  • Couriers              │
                    │  • Historical Data       │
                    └──────────────────────────┘
```

---

## Data Flow: Client Dashboard

### Current (Mock)

```
User Opens Dashboard
        ↓
Component Loads
        ↓
Calls API: GET /api/analytics/risk-score-distribution
        ↓
API Route Handler
        ↓
mockAIService.getRiskScoreData()
        ↓
Returns: { high: 45, medium: 30, low: 15 }
        ↓
Widget Displays Data
```

### Future (Real AI)

```
User Opens Dashboard
        ↓
Component Loads
        ↓
Calls API: GET /api/analytics/risk-score-distribution
        ↓
Next.js API Route
        ↓
HTTP Request to AI Service: GET http://ai-service:8000/api/ml/risk-distribution
        ↓
AI Service Queries MongoDB
        ↓
Calculates Distribution from Real Orders
        ↓
Returns: { high: 45, medium: 30, low: 15 }
        ↓
Next.js Returns to Frontend
        ↓
Widget Displays Data
```

---

## Migration Path

### Phase 1: Mock Only (Current) ✅

```
Frontend → Next.js API → Mock Service → Mock Data
```

**Status**: Complete
**Time**: 0 weeks (done!)
**Effort**: None needed

---

### Phase 2: Hybrid (Transition)

```
Frontend → Next.js API → {
    if (ENABLE_MOCK) → Mock Service
    else → Real AI Service
}
```

**Status**: Not started
**Time**: 1-2 weeks
**Effort**: Set up Python service, basic endpoints

---

### Phase 3: Real AI with Fallback

```
Frontend → Next.js API → Real AI Service
                              ↓ (on error)
                         Mock Service (fallback)
```

**Status**: Not started
**Time**: 3-4 weeks
**Effort**: ML models, database integration

---

### Phase 4: Full Production

```
Frontend → Next.js API → Real AI Service → ML Models → Database
```

**Status**: Not started
**Time**: 5-8 weeks
**Effort**: Advanced ML, NLP, optimization

---

## Component Dependencies

### Client Dashboard Widgets

```
RiskScoreWidget
    ↓ depends on
GET /api/analytics/risk-score-distribution
    ↓ uses
mockAIService.getRiskScoreData()
    ↓ returns
{ high: number, medium: number, low: number }
```

```
PredictiveAnalyticsWidget
    ↓ depends on
GET /api/analytics/predictive
    ↓ uses
mockAIService.getPredictiveAnalytics()
    ↓ returns
{
  forecastedOrders: ForecastDataPoint[],
  forecastedConfirmationRate: number,
  confidence: number
}
```

```
AutomationRecommendationsWidget
    ↓ depends on
GET /api/analytics/automation-recommendations
    ↓ uses
mockAIService.getAutomationRecommendations()
    ↓ returns
{ recommendations: Recommendation[] }
```

---

## File Structure

```
confirmed_frontend/
│
├── services/
│   └── mockAIService.ts          ← Mock AI functions
│
├── app/
│   ├── api/
│   │   ├── analytics/
│   │   │   ├── risk-score-distribution/
│   │   │   │   └── route.ts      ← Client API
│   │   │   ├── operator-feedback/
│   │   │   │   └── route.ts
│   │   │   ├── complaints/
│   │   │   │   └── route.ts
│   │   │   ├── courier-performance/
│   │   │   │   └── route.ts
│   │   │   ├── predictive/
│   │   │   │   └── route.ts
│   │   │   └── automation-recommendations/
│   │   │       └── route.ts
│   │   │
│   │   └── admin/
│   │       ├── kpis/
│   │       │   └── route.ts      ← Admin API
│   │       ├── charts/
│   │       │   ├── orders/
│   │       │   │   └── route.ts
│   │       │   └── revenue/
│   │       │       └── route.ts
│   │       ├── system-health/
│   │       │   └── route.ts
│   │       └── activity-feed/
│   │           └── route.ts
│   │
│   └── panel/
│       ├── client/
│       │   └── page.tsx          ← Client Dashboard
│       └── admin/
│           └── page.tsx          ← Admin Dashboard
│
├── components/
│   └── dashboard/
│       └── widgets/
│           ├── RiskScoreWidget.tsx
│           ├── PredictiveAnalyticsWidget.tsx
│           ├── AutomationRecommendationsWidget.tsx
│           └── ...
│
└── Documentation/
    ├── MOCK_AI_SERVICE_README.md
    ├── AI_SERVICE_IMPLEMENTATION_GUIDE.md
    ├── MOCK_AI_SETUP_COMPLETE.md
    └── ARCHITECTURE_DIAGRAM.md (this file)
```

---

## Technology Stack

### Current (Mock)

- **Frontend**: Next.js 14, React, TypeScript
- **Mock Service**: TypeScript functions
- **Data**: In-memory, generated on-demand
- **Deployment**: Single Next.js app

### Future (Real AI)

- **Frontend**: Next.js 14, React, TypeScript
- **AI Service**: Python, FastAPI
- **ML Libraries**: scikit-learn, Prophet, Transformers
- **Database**: MongoDB
- **Caching**: Redis
- **Deployment**: Docker, separate services

---

## Deployment Architecture

### Current

```
┌─────────────────────────┐
│   Vercel / Server       │
│                         │
│   Next.js App           │
│   (includes mock data)  │
└─────────────────────────┘
```

### Future

```
┌─────────────────────────┐
│   Vercel / Server       │
│   Next.js Frontend      │
└───────────┬─────────────┘
            │
            │ HTTP
            │
            ▼
┌─────────────────────────┐
│   AI Service Server     │
│   Python FastAPI        │
└───────────┬─────────────┘
            │
            │ MongoDB
            │
            ▼
┌─────────────────────────┐
│   Database Server       │
│   MongoDB               │
└─────────────────────────┘
```

---

## Summary

**Current State**: ✅ Fully functional with mocks
- All dashboards work
- No external dependencies
- Easy to demo and test

**Future State**: 🚀 Real AI capabilities
- ML-powered predictions
- Real-time analytics
- Advanced NLP

**Migration**: 📈 Gradual, one feature at a time
- No downtime
- Fallback to mocks if needed
- Test in production safely

---

**You can start using the dashboards immediately with mock data, then upgrade to real AI when ready!**
