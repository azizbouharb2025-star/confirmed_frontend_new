# Backend Data Flow & Architecture

## Overview

This document visualizes how data flows through the system for the new dashboard features.

---

## 1. Dashboard Metrics Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Request                         │
│                  GET /api/analytics/dashboard                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend Controller                          │
│  • Authenticate user                                             │
│  • Get user's shopId                                             │
│  • Check subscription plan                                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Database Queries (Parallel)                   │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │ Orders Collection│  │Complaints Collect│  │ Courier Data  │ │
│  │                  │  │                  │  │               │ │
│  │ • Count received │  │ • Count total    │  │ • Performance │ │
│  │ • Count confirmed│  │ • Count resolved │  │ • Success rate│ │
│  │ • Count pending  │  │ • Calc avg time  │  │               │ │
│  │ • Count shipped  │  │                  │  │               │ │
│  │ • Count delivered│  │                  │  │               │ │
│  └──────────────────┘  └──────────────────┘  └───────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Calculate Metrics                           │
│                                                                  │
│  confirmationRate = (confirmed / received) * 100                 │
│  deliverySuccessRate = (delivered / shipped) * 100 (last 7d)    │
│  complaintRate = (ordersWithComplaints / total) * 100           │
│  avgResolutionTime = AVG(resolvedAt - createdAt) in hours       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Filter by Plan                              │
│                                                                  │
│  Starter:    Basic metrics only                                 │
│  Pro:        + deliverySuccessRate                              │
│  Business:   + complaintRate                                    │
│  Enterprise: + avgResolutionTime                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      JSON Response                               │
│  {                                                               │
│    ordersReceived: 150,                                          │
│    ordersConfirmed: 120,                                         │
│    ordersPending: 30,                                            │
│    ordersShipped: 110,                                           │
│    deliverySuccessRate: 85.5,                                    │
│    complaintRate: 8.2,                                           │
│    avgResolutionTime: 24.5                                       │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Order Creation & AI Scoring Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    New Order Created                             │
│              POST /api/orders                                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Calculate AI Score                              │
│                                                                  │
│  Factors:                                                        │
│  • Customer history (if exists)                                  │
│  • Phone number validity                                         │
│  • Order value vs region average                                 │
│  • Time of day                                                   │
│  • Product popularity                                            │
│  • Duplicate detection                                           │
│                                                                  │
│  Result: aiScore (0-100)                                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Determine Risk Level                            │
│                                                                  │
│  if (aiScore > 80)  → riskLevel = 'high'                         │
│  if (aiScore 50-80) → riskLevel = 'medium'                       │
│  if (aiScore < 50)  → riskLevel = 'low'                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│            Calculate Delivery Success Probability                │
│                                                                  │
│  Factors:                                                        │
│  • Courier performance in region                                 │
│  • Historical delivery success in region                         │
│  • Product type                                                  │
│  • Delivery address completeness                                 │
│                                                                  │
│  Result: deliverySuccessProbability (0-100)                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Save Order to Database                        │
│  {                                                               │
│    orderId: "ORD-001",                                           │
│    status: "pending",                                            │
│    aiScore: 75,                                                  │
│    riskLevel: "medium",                                          │
│    deliverySuccessProbability: 82,                               │
│    region: "Tunis",                                              │
│    ...                                                           │
│  }                                                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Emit WebSocket Event                            │
│  socket.emit('order:created', orderData)                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Order Cancellation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                  Cancel Order Request                            │
│         PATCH /api/orders/:id/cancel                             │
│  Body: {                                                         │
│    reason: "price_too_high",                                     │
│    details: "Customer said 50 TND is too much",                  │
│    cancelledBy: "operator"                                       │
│  }                                                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Validate Cancellation                           │
│  • Check order exists                                            │
│  • Check order can be cancelled (not already delivered)          │
│  • Validate reason is in enum                                    │
│  • Check user has permission                                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Update Order in Database                        │
│  {                                                               │
│    status: "cancelled",                                          │
│    cancellationReason: "price_too_high",                         │
│    cancellationReasonDetails: "Customer said...",                │
│    cancelledBy: "operator",                                      │
│    cancelledAt: new Date()                                       │
│  }                                                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Update Analytics                                │
│  • Increment cancellation count for product                      │
│  • Update cancellation reason statistics                         │
│  • Update operator performance metrics                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Emit WebSocket Event                            │
│  socket.emit('order:cancelled', {                                │
│    orderId,                                                      │
│    reason,                                                       │
│    cancelledBy                                                   │
│  })                                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Complaint Creation & Linking Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                  Create Complaint                                │
│         POST /api/complaints                                     │
│  Body: {                                                         │
│    orderId: "ORD-001",                                           │
│    category: "product_quality",                                  │
│    description: "Product arrived damaged"                        │
│  }                                                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Save Complaint                                  │
│  • Create complaint document                                     │
│  • Set status to "pending"                                       │
│  • Link to order                                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Update Order                                    │
│  Order.updateOne(                                                │
│    { _id: orderId },                                             │
│    { $set: { hasComplaint: true } }                              │
│  )                                                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Update Product Stats                            │
│  • Increment complaint count for product                         │
│  • Update product complaint rate                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Emit WebSocket Event                            │
│  socket.emit('complaint:created', complaintData)                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Courier Performance Calculation

```
┌─────────────────────────────────────────────────────────────────┐
│              GET /api/analytics/courier-performance              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Get All Active Couriers                         │
│  Courier.find({ isActive: true })                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│            For Each Courier (Parallel Processing)                │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 1. Get all orders for this courier                         │ │
│  │    Order.find({ courier: courierId, shopId })              │ │
│  │                                                             │ │
│  │ 2. Calculate success rate                                  │ │
│  │    successful = orders.filter(o => o.status === 'delivered')│ │
│  │    successRate = (successful / total) * 100                │ │
│  │                                                             │ │
│  │ 3. Calculate average delivery time                         │ │
│  │    avgTime = AVG(deliveredAt - shippedAt) in hours        │ │
│  │                                                             │ │
│  │ 4. Calculate return rate                                   │ │
│  │    returns = orders.filter(o => o.status === 'failed_delivery')│
│  │    returnRate = (returns / total) * 100                    │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Sort by Success Rate                            │
│  courierData.sort((a, b) => b.successRate - a.successRate)      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Return JSON Response                            │
│  {                                                               │
│    couriers: [                                                   │
│      {                                                           │
│        name: "Courier A",                                        │
│        successRate: 92.3,                                        │
│        avgDeliveryTime: 36,                                      │
│        totalDeliveries: 980,                                     │
│        returnRate: 2.1                                           │
│      },                                                          │
│      ...                                                         │
│    ]                                                             │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Database Schema Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                         Order Document                           │
│  {                                                               │
│    _id: ObjectId,                                                │
│    orderId: String,                                              │
│    shopId: ObjectId ──────────────┐                              │
│    status: String,                │                              │
│    aiScore: Number,               │                              │
│    riskLevel: String,             │                              │
│    courier: ObjectId ─────────┐   │                              │
│    region: String,            │   │                              │
│    hasComplaint: Boolean,     │   │                              │
│    ...                        │   │                              │
│  }                            │   │                              │
└───────────────────────────────┼───┼──────────────────────────────┘
                                │   │
                                │   │
                ┌───────────────┘   └──────────────┐
                │                                   │
                ▼                                   ▼
┌───────────────────────────┐      ┌───────────────────────────┐
│    Courier Document       │      │     Shop Document         │
│  {                        │      │  {                        │
│    _id: ObjectId,         │      │    _id: ObjectId,         │
│    name: String,          │      │    name: String,          │
│    regions: [String],     │      │    subscriptionPlan: Str, │
│    performance: {         │      │    ...                    │
│      totalDeliveries: N,  │      │  }                        │
│      successfulDeliveries:│      └───────────────────────────┘
│      avgDeliveryTime: N,  │
│      returnRate: N        │
│    }                      │
│  }                        │
└───────────────────────────┘
                │
                │
                ▼
┌───────────────────────────────────────────────────────────────┐
│              Complaint Document                               │
│  {                                                            │
│    _id: ObjectId,                                             │
│    orderId: ObjectId ──────┐                                  │
│    category: String,       │                                  │
│    status: String,         │                                  │
│    createdAt: Date,        │                                  │
│    resolvedAt: Date        │                                  │
│  }                         │                                  │
└────────────────────────────┼──────────────────────────────────┘
                             │
                             │ (Links back to Order)
                             │
                             └──────────────────────────────────┐
                                                                │
                                                                ▼
                                                    Updates hasComplaint flag
```

---

## 7. Subscription Plan Middleware Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    API Request                                   │
│  GET /api/analytics/courier-performance                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Authentication Middleware                       │
│  • Verify JWT token                                              │
│  • Load user from database                                       │
│  • Attach user to req.user                                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Subscription Plan Middleware                        │
│                                                                  │
│  function requirePlan(minPlan) {                                 │
│    const planHierarchy = {                                       │
│      starter: 0,                                                 │
│      pro: 1,                                                     │
│      business: 2,                                                │
│      enterprise: 3                                               │
│    };                                                            │
│                                                                  │
│    const userPlan = req.user.subscriptionPlan;                   │
│    const userLevel = planHierarchy[userPlan];                    │
│    const requiredLevel = planHierarchy[minPlan];                 │
│                                                                  │
│    if (userLevel >= requiredLevel) {                             │
│      next(); // Allow access                                     │
│    } else {                                                      │
│      return 403 Forbidden                                        │
│    }                                                             │
│  }                                                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Route Handler                                 │
│  • Execute business logic                                        │
│  • Query database                                                │
│  • Return response                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Real-time Updates via WebSocket

```
┌─────────────────────────────────────────────────────────────────┐
│                    Backend Event                                 │
│  (Order created, updated, cancelled, etc.)                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Emit WebSocket Event                            │
│                                                                  │
│  io.to(`shop:${shopId}`).emit('order:updated', {                │
│    orderId: order._id,                                           │
│    status: order.status,                                         │
│    aiScore: order.aiScore,                                       │
│    riskLevel: order.riskLevel,                                   │
│    hasComplaint: order.hasComplaint                              │
│  });                                                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Frontend WebSocket Client                       │
│  socket.on('order:updated', (data) => {                          │
│    // Update order in local state                                │
│    updateOrderInStore(data);                                     │
│    // Show notification                                          │
│    toast.success('Order updated');                               │
│    // Refresh dashboard if needed                                │
│    if (data.status === 'confirmed') {                            │
│      refetchDashboardMetrics();                                  │
│    }                                                             │
│  });                                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Caching Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                    API Request                                   │
│  GET /api/analytics/courier-performance                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Check Cache                                     │
│                                                                  │
│  const cacheKey = `courier-perf:${shopId}`;                      │
│  const cached = await redis.get(cacheKey);                       │
│                                                                  │
│  if (cached && !isStale(cached)) {                               │
│    return JSON.parse(cached);                                    │
│  }                                                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼ (Cache miss or stale)
┌─────────────────────────────────────────────────────────────────┐
│                  Query Database                                  │
│  • Calculate courier performance                                 │
│  • Aggregate statistics                                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Store in Cache                                  │
│                                                                  │
│  await redis.setex(                                              │
│    cacheKey,                                                     │
│    300, // 5 minutes TTL                                         │
│    JSON.stringify(data)                                          │
│  );                                                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Return Response                                 │
└─────────────────────────────────────────────────────────────────┘

Cache Invalidation Triggers:
• Order status changes to 'delivered' or 'failed_delivery'
• Courier information updated
• Manual cache clear via admin endpoint
```

---

## 10. Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    API Request                                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Try-Catch Block                                 │
│  try {                                                           │
│    // Business logic                                             │
│  } catch (error) {                                               │
│    // Error handling                                             │
│  }                                                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Error Classification                            │
│                                                                  │
│  • ValidationError → 400 Bad Request                             │
│  • AuthenticationError → 401 Unauthorized                        │
│  • PermissionError → 403 Forbidden                               │
│  • NotFoundError → 404 Not Found                                 │
│  • DatabaseError → 500 Internal Server Error                     │
│  • UnknownError → 500 Internal Server Error                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Log Error                                       │
│  logger.error({                                                  │
│    error: error.message,                                         │
│    stack: error.stack,                                           │
│    userId: req.user?._id,                                        │
│    endpoint: req.path,                                           │
│    timestamp: new Date()                                         │
│  });                                                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Return Error Response                           │
│  {                                                               │
│    error: "User-friendly error message",                         │
│    code: "ERROR_CODE",                                           │
│    details: {} // Only in development                            │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Performance Optimization Tips

### 1. Database Indexes
```javascript
// Critical indexes for new features
db.orders.createIndex({ "shopId": 1, "status": 1, "createdAt": -1 });
db.orders.createIndex({ "aiScore": 1 });
db.orders.createIndex({ "courier": 1, "status": 1 });
db.orders.createIndex({ "hasComplaint": 1 });
db.orders.createIndex({ "shippedAt": 1, "status": 1 });
```

### 2. Query Optimization
```javascript
// BAD: Multiple queries
const orders = await Order.find({ shopId });
const confirmed = orders.filter(o => o.status === 'confirmed');
const shipped = orders.filter(o => o.status === 'shipped');

// GOOD: Single aggregation query
const stats = await Order.aggregate([
  { $match: { shopId } },
  { $group: {
    _id: '$status',
    count: { $sum: 1 }
  }}
]);
```

### 3. Caching Strategy
- Cache dashboard metrics for 5 minutes
- Cache courier performance for 10 minutes
- Cache product stats for 15 minutes
- Invalidate cache on relevant updates

### 4. Pagination
- Always paginate large result sets
- Default limit: 20 items
- Max limit: 100 items
- Return total count for UI pagination

---

## Security Checklist

- [ ] Validate all input data
- [ ] Sanitize user inputs
- [ ] Check subscription plan on backend
- [ ] Verify user owns the shop
- [ ] Rate limit analytics endpoints
- [ ] Log all sensitive operations
- [ ] Encrypt sensitive data at rest
- [ ] Use HTTPS for all API calls
- [ ] Implement CORS properly
- [ ] Validate JWT tokens
- [ ] Check permissions for each action
- [ ] Prevent SQL/NoSQL injection
- [ ] Implement request timeouts
- [ ] Monitor for unusual patterns

---

## Monitoring Queries

```javascript
// Slow query detection
db.setProfilingLevel(1, { slowms: 100 });

// Monitor query performance
db.system.profile.find({
  millis: { $gt: 100 }
}).sort({ ts: -1 }).limit(10);

// Index usage stats
db.orders.aggregate([
  { $indexStats: {} }
]);
```

---

This data flow documentation should help the backend team understand how all the pieces fit together!
