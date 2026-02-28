# Testing Mock AI Data

## Quick Start

### 1. Start Development Server

```bash
npm run dev
```

### 2. Set Subscription Plan

The subscription plan determines which widgets are visible:

**Edit**: `app/api/subscriptions/current/route.ts`

```typescript
return NextResponse.json({
  plan: 'enterprise', // Change this to test different tiers
  status: 'active',
});
```

**Available Plans:**
- `'starter'` - Basic KPIs + Recent Orders
- `'pro'` - Starter + Risk Score + Operator Feedback
- `'business'` - Pro + Complaints + Courier Performance
- `'enterprise'` - Business + Predictive + Recommendations

### 3. Visit Dashboards

**Client Dashboard**: http://localhost:3000/panel/client
- You should see all widgets based on your plan

**Admin Dashboard**: http://localhost:3000/panel/admin
- System KPIs, charts, activity feed, system health

### 4. Test API Endpoints Directly

```bash
# Test subscription
curl http://localhost:3000/api/subscriptions/current

# Test risk score
curl http://localhost:3000/api/analytics/risk-score-distribution

# Test operator feedback
curl http://localhost:3000/api/analytics/operator-feedback

# Test complaints analytics
curl http://localhost:3000/api/analytics/complaints

# Test courier performance
curl http://localhost:3000/api/analytics/courier-performance

# Test predictive analytics
curl http://localhost:3000/api/analytics/predictive

# Test recommendations
curl http://localhost:3000/api/analytics/automation-recommendations

# Test admin KPIs
curl http://localhost:3000/api/admin/kpis

# Test orders chart
curl "http://localhost:3000/api/admin/charts/orders?period=daily"

# Test revenue chart
curl "http://localhost:3000/api/admin/charts/revenue?viewMode=daily"

# Test system health
curl http://localhost:3000/api/admin/system-health

# Test activity feed
curl http://localhost:3000/api/admin/activity-feed
```

## Expected Results

### Client Dashboard (Enterprise Plan)

You should see:

1. **KPI Cards** (top row)
   - Orders Received
   - Orders Confirmed
   - Orders Shipped
   - Delivery Success Rate
   - Complaint Rate
   - Avg Resolution Time

2. **Recent Orders Widget**
   - List of recent orders

3. **Risk Score Widget** (Pro+)
   - Pie chart showing high/medium/low confidence orders
   - Numbers like: High: 45, Medium: 30, Low: 15

4. **Operator Feedback Widget** (Pro+)
   - Average rating (e.g., 4.3/5.0)
   - Top feedback tags with counts

5. **Complaints Analytics Widget** (Business+)
   - Total complaints count
   - Resolution rate percentage
   - Trend chart (last 7 days)
   - Category breakdown

6. **Courier Performance Widget** (Business+)
   - List of couriers with success rates
   - Sorted by performance

7. **Predictive Analytics Widget** (Enterprise)
   - Forecast chart for next 7 days
   - Predicted vs actual orders
   - Confidence bands
   - AI confidence percentage

8. **Automation Recommendations Widget** (Enterprise)
   - 2-4 recommendations
   - Impact levels (high/medium/low)
   - Categories (Courier Optimization, Pricing, etc.)

### Admin Dashboard

You should see:

1. **KPI Cards**
   - Total Users (200-700)
   - Total Orders (1000-3000)
   - Revenue (30k-80k TND)
   - Active Shops (20-70)

2. **Orders Chart**
   - Line chart showing order trends
   - Toggle: Daily/Weekly/Monthly

3. **Revenue Chart**
   - Line/Area chart showing revenue
   - Toggle: Daily/Cumulative

4. **Activity Feed**
   - Recent system activities
   - Order created, user registered, etc.

5. **System Health**
   - Service status (healthy/degraded/down)
   - API Server, Database, Redis, etc.
   - Response times and uptime percentages

## Troubleshooting

### Issue: Widgets show "No data available"

**Possible Causes:**

1. **Subscription Plan Too Low**
   - Solution: Set plan to 'enterprise' in `/api/subscriptions/current/route.ts`

2. **API Endpoint Not Found**
   - Check browser console for 404 errors
   - Verify API routes exist in `app/api/`

3. **JavaScript Errors**
   - Open browser DevTools > Console
   - Look for errors

4. **Server Not Running**
   - Make sure `npm run dev` is running
   - Check terminal for errors

### Issue: Data doesn't change

**This is expected!** Mock data is generated fresh on each API call, so:
- Refresh the page to see new data
- Each widget fetches independently

### Issue: TypeScript errors

```bash
# Check for type errors
npm run build

# If errors, check import paths
```

### Issue: Want different mock data ranges

Edit `services/mockAIService.ts`:

```typescript
// Example: Change risk score ranges
export function getMockRiskScoreData(): RiskScoreData {
  return {
    high: Math.floor(Math.random() * 100) + 50,  // 50-150 instead of 30-80
    medium: Math.floor(Math.random() * 80) + 40,
    low: Math.floor(Math.random() * 40) + 10,
  };
}
```

## Testing Different Subscription Tiers

### Test Starter Plan

```typescript
// app/api/subscriptions/current/route.ts
return NextResponse.json({ plan: 'starter' });
```

**Expected**: Only basic KPIs and Recent Orders widget

### Test Pro Plan

```typescript
return NextResponse.json({ plan: 'pro' });
```

**Expected**: Starter + Risk Score + Operator Feedback

### Test Business Plan

```typescript
return NextResponse.json({ plan: 'business' });
```

**Expected**: Pro + Complaints + Courier Performance

### Test Enterprise Plan

```typescript
return NextResponse.json({ plan: 'enterprise' });
```

**Expected**: All widgets visible

## Browser DevTools Tips

### Check API Calls

1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "Fetch/XHR"
4. Refresh page
5. Look for API calls to `/api/analytics/*` and `/api/admin/*`

### Check Console for Errors

1. Open DevTools (F12)
2. Go to Console tab
3. Look for red error messages
4. Common errors:
   - 404: API endpoint not found
   - 500: Server error
   - CORS: Cross-origin issue (shouldn't happen in dev)

### Check Component State

1. Install React DevTools extension
2. Open DevTools > Components tab
3. Select a widget component
4. Check props and state
5. Verify data is being received

## Sample API Responses

### Risk Score Distribution

```json
{
  "high": 45,
  "medium": 30,
  "low": 15
}
```

### Operator Feedback

```json
{
  "averageRating": 4.3,
  "totalFeedback": 87,
  "topTags": [
    { "tag": "Professional", "count": 32 },
    { "tag": "Clear Communication", "count": 28 }
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

### Automation Recommendations

```json
{
  "recommendations": [
    {
      "id": "1",
      "title": "Switch to Express Delivery in Tunis",
      "description": "Express Delivery has 92% success rate vs 78%",
      "impact": "high",
      "category": "Courier Optimization"
    }
  ]
}
```

## Success Checklist

- [ ] Dev server running (`npm run dev`)
- [ ] Subscription plan set to 'enterprise'
- [ ] Client dashboard shows all widgets
- [ ] Admin dashboard shows all sections
- [ ] No errors in browser console
- [ ] API endpoints return data (test with curl)
- [ ] Data changes on page refresh
- [ ] Charts render correctly

## Next Steps

Once everything is working:

1. ✅ Demo to stakeholders
2. ✅ Test subscription tier gating
3. ✅ Continue frontend development
4. 📅 Plan real AI backend implementation

---

**If you see data in the widgets, congratulations! Your mock AI service is working!** 🎉
