# AI Service Implementation Guide

## When You're Ready to Build the Real AI Backend

This guide shows you exactly what to build when replacing the mock service with real AI/ML capabilities.

---

## Quick Start: Minimum Viable AI Service

### Option 1: Simple Python FastAPI Service (Recommended)

Create a basic Python service that can be enhanced over time:

```python
# main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import random

app = FastAPI()

class OrderData(BaseModel):
    customerPhone: str
    orderValue: float
    region: str
    isReturningCustomer: bool = False

@app.post("/api/ml/score-order")
async def score_order(order: OrderData):
    """Calculate AI score for an order"""
    
    # Start with simple rule-based scoring
    score = 50  # Base score
    
    # Returning customer bonus
    if order.isReturningCustomer:
        score += 25
    
    # High value order bonus
    if order.orderValue > 100:
        score += 10
    
    # Region-based adjustment
    high_performance_regions = ['Tunis', 'Ariana', 'Sfax']
    if order.region in high_performance_regions:
        score += 10
    
    # Clamp to 0-100
    score = max(0, min(100, score))
    
    # Determine risk level
    if score > 80:
        risk_level = 'high'
    elif score >= 50:
        risk_level = 'medium'
    else:
        risk_level = 'low'
    
    return {
        "aiScore": score,
        "riskLevel": risk_level,
        "deliverySuccessProbability": min(95, score + random.randint(0, 10))
    }

@app.get("/api/ml/risk-distribution")
async def get_risk_distribution():
    """Get distribution of orders by risk level"""
    # TODO: Query your database for real order counts
    # For now, return mock data
    return {
        "high": 45,
        "medium": 30,
        "low": 15
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

**Install dependencies:**
```bash
pip install fastapi uvicorn pydantic
```

**Run the service:**
```bash
python main.py
```

---

## Full AI Service Architecture

### Services You Need to Build

```
┌─────────────────────────────────────────────────────────────┐
│                    AI/ML Service (Python)                    │
│                                                              │
│  ┌────────────────────┐  ┌────────────────────────────┐    │
│  │  Order Scoring     │  │  Predictive Analytics      │    │
│  │  - Risk score      │  │  - Order forecasting       │    │
│  │  - Delivery prob   │  │  - Confirmation rate       │    │
│  └────────────────────┘  └────────────────────────────┘    │
│                                                              │
│  ┌────────────────────┐  ┌────────────────────────────┐    │
│  │  NLP Analysis      │  │  Recommendations           │    │
│  │  - Complaint tags  │  │  - Workflow optimization   │    │
│  │  - Sentiment       │  │  - Courier suggestions     │    │
│  └────────────────────┘  └────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Rule-Based Service (Week 1)

**Goal**: Replace mocks with simple logic

**What to Build**:
1. FastAPI service with basic endpoints
2. Rule-based order scoring
3. Simple aggregations for analytics
4. Keyword-based complaint classification

**Endpoints**:
```
POST /api/ml/score-order
POST /api/ml/analyze-complaint
GET  /api/ml/risk-distribution
GET  /api/analytics/courier-performance
```

**Example Rule-Based Scoring**:
```python
def calculate_order_score(order):
    score = 50
    
    # Customer history
    if order.previous_orders > 0:
        score += min(30, order.previous_orders * 5)
    
    # Phone validation
    if is_valid_phone(order.phone):
        score += 10
    
    # Order value
    if order.value > 100:
        score += 10
    elif order.value < 20:
        score -= 10
    
    # Time of day (orders at 3am are suspicious)
    hour = datetime.now().hour
    if 2 <= hour <= 5:
        score -= 15
    
    return max(0, min(100, score))
```

---

### Phase 2: Database Integration (Week 2)

**Goal**: Use real data for analytics

**What to Build**:
1. Connect to MongoDB
2. Aggregate real order data
3. Calculate actual courier performance
4. Generate real trend data

**Example MongoDB Aggregation**:
```python
from motor.motor_asyncio import AsyncIOMotorClient

async def get_courier_performance(shop_id):
    pipeline = [
        {"$match": {"shopId": shop_id}},
        {"$group": {
            "_id": "$courier",
            "total": {"$sum": 1},
            "successful": {
                "$sum": {"$cond": [{"$eq": ["$status", "delivered"]}, 1, 0]}
            }
        }},
        {"$project": {
            "courier": "$_id",
            "successRate": {
                "$multiply": [
                    {"$divide": ["$successful", "$total"]},
                    100
                ]
            }
        }}
    ]
    
    results = await db.orders.aggregate(pipeline).to_list(None)
    return results
```

---

### Phase 3: Machine Learning Models (Week 3-4)

**Goal**: Add predictive capabilities

**What to Build**:
1. Train ML models on historical data
2. Implement time series forecasting
3. Add churn prediction
4. Improve order scoring with ML

**Example: Order Scoring with scikit-learn**:
```python
from sklearn.ensemble import RandomForestClassifier
import joblib

# Train model (do this once)
def train_order_model(historical_orders):
    X = []  # Features
    y = []  # Labels (1 = confirmed, 0 = cancelled)
    
    for order in historical_orders:
        features = [
            order.value,
            order.previous_orders,
            order.region_success_rate,
            order.hour_of_day,
            order.day_of_week,
        ]
        X.append(features)
        y.append(1 if order.status == 'confirmed' else 0)
    
    model = RandomForestClassifier(n_estimators=100)
    model.fit(X, y)
    
    joblib.dump(model, 'order_model.pkl')
    return model

# Use model for predictions
def predict_order_score(order):
    model = joblib.load('order_model.pkl')
    
    features = [
        order.value,
        order.previous_orders,
        get_region_success_rate(order.region),
        datetime.now().hour,
        datetime.now().weekday(),
    ]
    
    probability = model.predict_proba([features])[0][1]
    score = int(probability * 100)
    
    return score
```

**Example: Time Series Forecasting with Prophet**:
```python
from prophet import Prophet
import pandas as pd

def forecast_orders(historical_data, days=7):
    # Prepare data
    df = pd.DataFrame({
        'ds': [order.date for order in historical_data],
        'y': [order.count for order in historical_data]
    })
    
    # Train model
    model = Prophet()
    model.fit(df)
    
    # Make forecast
    future = model.make_future_dataframe(periods=days)
    forecast = model.predict(future)
    
    return forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(days)
```

---

### Phase 4: NLP for Complaints (Week 5)

**Goal**: Intelligent complaint analysis

**What to Build**:
1. Text classification for complaints
2. Sentiment analysis
3. Auto-tagging with confidence scores
4. Urgency detection

**Example: Using Hugging Face Transformers**:
```python
from transformers import pipeline

# Load pre-trained models
classifier = pipeline("text-classification", model="distilbert-base-uncased-finetuned-sst-2-english")
ner = pipeline("ner", model="dbmdz/bert-large-cased-finetuned-conll03-english")

def analyze_complaint(text):
    # Sentiment analysis
    sentiment_result = classifier(text)[0]
    sentiment = 'positive' if sentiment_result['label'] == 'POSITIVE' else 'negative'
    
    # Extract entities (products, issues)
    entities = ner(text)
    
    # Keyword-based tagging
    tags = []
    keywords = {
        'damaged': ('Product Damage', 0.9),
        'late': ('Delivery Delay', 0.85),
        'wrong': ('Wrong Item', 0.88),
        'quality': ('Quality Issue', 0.82),
    }
    
    text_lower = text.lower()
    for keyword, (tag, confidence) in keywords.items():
        if keyword in text_lower:
            tags.append({'tag': tag, 'confidence': confidence})
    
    # Determine urgency
    urgent_words = ['urgent', 'immediately', 'asap', 'emergency']
    urgency = 'high' if any(word in text_lower for word in urgent_words) else 'medium'
    
    return {
        'sentiment': sentiment,
        'tags': tags,
        'urgency': urgency,
        'requiresManualReview': len(tags) == 0 or sentiment == 'negative'
    }
```

---

## Connecting to Your Next.js Backend

### Update API Routes

Replace mock calls in your Next.js API routes:

```typescript
// app/api/analytics/risk-score-distribution/route.ts
import { NextResponse } from 'next/server';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export async function GET(request: Request) {
  try {
    // Get user's shop ID from session/token
    const shopId = await getShopIdFromSession(request);
    
    // Call AI service
    const response = await fetch(`${AI_SERVICE_URL}/api/ml/risk-distribution`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AI_SERVICE_TOKEN}`,
        'X-Shop-ID': shopId,
      },
    });
    
    if (!response.ok) {
      throw new Error('AI service request failed');
    }
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Risk score error:', error);
    
    // Fallback to mock data if AI service is down
    if (process.env.ENABLE_MOCK_FALLBACK === 'true') {
      const { mockAIService } = await import('@/services/mockAIService');
      return NextResponse.json(mockAIService.getRiskScoreData());
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch risk score distribution' },
      { status: 500 }
    );
  }
}
```

---

## Deployment

### Docker Setup

**Dockerfile for AI Service**:
```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  nextjs:
    build: .
    ports:
      - "3000:3000"
    environment:
      - AI_SERVICE_URL=http://ai-service:8000
    depends_on:
      - ai-service
  
  ai-service:
    build: ./ai-service
    ports:
      - "8000:8000"
    environment:
      - MONGODB_URL=mongodb://mongo:27017
    depends_on:
      - mongo
  
  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

volumes:
  mongo-data:
```

---

## Testing Your AI Service

### Unit Tests

```python
# test_ai_service.py
import pytest
from main import score_order, OrderData

def test_order_scoring():
    order = OrderData(
        customerPhone="+21612345678",
        orderValue=150.0,
        region="Tunis",
        isReturningCustomer=True
    )
    
    result = score_order(order)
    
    assert result['aiScore'] >= 50
    assert result['riskLevel'] in ['high', 'medium', 'low']
    assert 0 <= result['deliverySuccessProbability'] <= 100

def test_new_customer_low_value():
    order = OrderData(
        customerPhone="+21612345678",
        orderValue=15.0,
        region="Unknown",
        isReturningCustomer=False
    )
    
    result = score_order(order)
    
    # Should have lower score
    assert result['aiScore'] < 60
```

### Integration Tests

```bash
# Test endpoints
curl -X POST http://localhost:8000/api/ml/score-order \
  -H "Content-Type: application/json" \
  -d '{
    "customerPhone": "+21612345678",
    "orderValue": 150,
    "region": "Tunis",
    "isReturningCustomer": true
  }'
```

---

## Performance Optimization

### Caching

```python
from functools import lru_cache
import redis

redis_client = redis.Redis(host='localhost', port=6379, db=0)

@lru_cache(maxsize=1000)
def get_region_success_rate(region: str) -> float:
    """Cache region success rates"""
    cached = redis_client.get(f"region:{region}:success_rate")
    if cached:
        return float(cached)
    
    # Calculate from database
    rate = calculate_region_success_rate(region)
    redis_client.setex(f"region:{region}:success_rate", 3600, rate)
    return rate
```

### Batch Processing

```python
@app.post("/api/ml/score-orders-batch")
async def score_orders_batch(orders: List[OrderData]):
    """Score multiple orders at once for efficiency"""
    results = []
    for order in orders:
        score = await score_order(order)
        results.append(score)
    return results
```

---

## Monitoring & Logging

```python
import logging
from prometheus_client import Counter, Histogram

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Metrics
prediction_counter = Counter('predictions_total', 'Total predictions made')
prediction_duration = Histogram('prediction_duration_seconds', 'Prediction duration')

@app.post("/api/ml/score-order")
async def score_order(order: OrderData):
    with prediction_duration.time():
        try:
            result = calculate_score(order)
            prediction_counter.inc()
            logger.info(f"Scored order: {result['aiScore']}")
            return result
        except Exception as e:
            logger.error(f"Scoring failed: {e}")
            raise
```

---

## Cost Considerations

### Free/Low-Cost Options

1. **Self-Hosted**: Run on your own server (cheapest)
2. **Heroku**: Free tier for small services
3. **Railway**: $5/month for basic service
4. **DigitalOcean**: $5/month droplet

### Using Cloud AI Services

1. **AWS SageMaker**: Pay per prediction
2. **Google Cloud AI**: Free tier available
3. **Azure ML**: Pay-as-you-go

---

## Summary Checklist

When building your real AI service:

- [ ] Set up Python FastAPI project
- [ ] Implement basic order scoring endpoint
- [ ] Connect to MongoDB for real data
- [ ] Add caching layer (Redis)
- [ ] Implement complaint analysis
- [ ] Add time series forecasting
- [ ] Create recommendation engine
- [ ] Write unit tests
- [ ] Set up Docker deployment
- [ ] Add monitoring/logging
- [ ] Update Next.js API routes
- [ ] Test end-to-end
- [ ] Deploy to production

---

## Resources

- **FastAPI**: https://fastapi.tiangolo.com/
- **scikit-learn**: https://scikit-learn.org/
- **Prophet**: https://facebook.github.io/prophet/
- **Hugging Face**: https://huggingface.co/
- **MongoDB Motor**: https://motor.readthedocs.io/

---

Your mock service is working now. Build the real AI service when you're ready, one phase at a time!
