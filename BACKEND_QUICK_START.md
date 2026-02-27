# Backend Quick Start Guide

## Immediate Actions Required

### 1. Update Dashboard Metrics API (CRITICAL)

**File to modify:** Your dashboard analytics endpoint (e.g., `routes/analytics/dashboard.js`)

**Add these fields to the response:**

```javascript
// GET /api/analytics/dashboard
{
  // Existing fields...
  ordersReceived: 0,
  ordersConfirmed: 0,
  ordersPending: 0,
  ordersRejected: 0,
  confirmationRate: 0,
  revenue: 0,
  revenueChange: 0,
  averageOrderValue: 0,
  
  // ADD THESE NEW FIELDS:
  ordersShipped: 0,              // Count of shipped orders
  deliverySuccessRate: 0,        // % successful deliveries (last 7 days)
  complaintRate: 0,              // % orders with complaints
  avgResolutionTime: 0           // Avg complaint resolution time (hours)
}
```

**Quick implementation:**

```javascript
// Example implementation
async function getDashboardMetrics(userId, shopId) {
  const now = new Date();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  
  // Existing queries...
  const ordersReceived = await Order.countDocuments({ shopId });
  const ordersConfirmed = await Order.countDocuments({ shopId, status: 'confirmed' });
  const ordersPending = await Order.countDocuments({ shopId, status: 'pending' });
  const ordersRejected = await Order.countDocuments({ shopId, status: 'rejected' });
  
  // NEW: Orders shipped
  const ordersShipped = await Order.countDocuments({ 
    shopId, 
    status: { $in: ['shipped', 'delivered'] } 
  });
  
  // NEW: Delivery success rate (last 7 days)
  const shippedLast7Days = await Order.countDocuments({
    shopId,
    status: { $in: ['shipped', 'delivered', 'failed_delivery'] },
    shippedAt: { $gte: sevenDaysAgo }
  });
  
  const deliveredLast7Days = await Order.countDocuments({
    shopId,
    status: 'delivered',
    deliveredAt: { $gte: sevenDaysAgo }
  });
  
  const deliverySuccessRate = shippedLast7Days > 0 
    ? (deliveredLast7Days / shippedLast7Days) * 100 
    : 0;
  
  // NEW: Complaint rate
  const ordersWithComplaints = await Order.countDocuments({
    shopId,
    hasComplaint: true
  });
  
  const totalOrders = await Order.countDocuments({ shopId });
  const complaintRate = totalOrders > 0 
    ? (ordersWithComplaints / totalOrders) * 100 
    : 0;
  
  // NEW: Average resolution time
  const resolvedComplaints = await Complaint.find({
    shopId,
    status: 'resolved',
    resolvedAt: { $exists: true }
  });
  
  let avgResolutionTime = 0;
  if (resolvedComplaints.length > 0) {
    const totalTime = resolvedComplaints.reduce((sum, complaint) => {
      const resolutionTime = (new Date(complaint.resolvedAt) - new Date(complaint.createdAt)) / (1000 * 60 * 60); // hours
      return sum + resolutionTime;
    }, 0);
    avgResolutionTime = totalTime / resolvedComplaints.length;
  }
  
  return {
    ordersReceived,
    ordersConfirmed,
    ordersPending,
    ordersRejected,
    ordersShipped,
    confirmationRate: ordersReceived > 0 ? (ordersConfirmed / ordersReceived) * 100 : 0,
    deliverySuccessRate: Math.round(deliverySuccessRate * 10) / 10,
    complaintRate: Math.round(complaintRate * 10) / 10,
    avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
    // ... other fields
  };
}
```

---

### 2. Add New Fields to Order Model (CRITICAL)

**File to modify:** Your Order schema/model (e.g., `models/Order.js`)

**Add these fields:**

```javascript
const OrderSchema = new mongoose.Schema({
  // ... existing fields ...
  
  // NEW FIELDS - Add these:
  aiScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  
  riskLevel: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  
  deliverySuccessProbability: {
    type: Number,
    min: 0,
    max: 100,
    default: 70
  },
  
  cancellationReason: {
    type: String,
    enum: [
      'customer_refused',
      'price_too_high',
      'quality_doubts',
      'duplicate_order',
      'fake_number',
      'not_available',
      'courier_failed',
      'customer_rejected_at_door'
    ]
  },
  
  cancellationReasonDetails: String,
  
  cancelledBy: {
    type: String,
    enum: ['customer', 'operator', 'system', 'courier']
  },
  
  courier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Courier'
  },
  
  region: String,
  
  hasComplaint: {
    type: Boolean,
    default: false
  },
  
  operatorFeedback: {
    confidence: {
      type: String,
      enum: ['strong', 'doubtful', 'neutral']
    },
    notes: String,
    operatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  deliveryAttempts: [{
    attemptNumber: Number,
    attemptDate: Date,
    status: {
      type: String,
      enum: ['failed', 'customer_not_home', 'refused', 'successful']
    },
    notes: String
  }],
  
  shippedAt: Date,
  deliveredAt: Date
});

// Update status enum to include new statuses
status: {
  type: String,
  enum: [
    'pending',
    'assigned',
    'in_progress',
    'confirmed',
    'rejected',
    'cancelled',      // NEW
    'shipped',
    'delivered',
    'failed_delivery' // NEW
  ],
  default: 'pending'
}
```

---

### 3. Create Risk Score Distribution API (HIGH PRIORITY)

**New endpoint:** `GET /api/analytics/risk-score-distribution`

```javascript
// routes/analytics/riskScore.js
router.get('/risk-score-distribution', async (req, res) => {
  try {
    const { shopId } = req.user;
    
    // Get pending orders with AI scores
    const orders = await Order.find({ 
      shopId, 
      status: 'pending',
      aiScore: { $exists: true }
    });
    
    const distribution = {
      high: orders.filter(o => o.aiScore > 80).length,
      medium: orders.filter(o => o.aiScore >= 50 && o.aiScore <= 80).length,
      low: orders.filter(o => o.aiScore < 50).length
    };
    
    res.json(distribution);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

### 4. Update Orders API with New Filters (HIGH PRIORITY)

**Endpoint to modify:** `GET /api/orders`

**Add these query parameters:**

```javascript
// routes/orders.js
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20,
      status,
      filter,        // NEW: 'risky' for low AI score orders
      courier,       // NEW: Filter by courier ID
      region,        // NEW: Filter by region
      hasComplaint   // NEW: Filter orders with complaints
    } = req.query;
    
    const query = { shopId: req.user.shopId };
    
    // Existing filters
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // NEW: Risky orders filter
    if (filter === 'risky') {
      query.aiScore = { $lt: 50 };
    }
    
    // NEW: Courier filter
    if (courier) {
      query.courier = courier;
    }
    
    // NEW: Region filter
    if (region) {
      query.region = region;
    }
    
    // NEW: Complaint filter
    if (hasComplaint === 'true') {
      query.hasComplaint = true;
    }
    
    const orders = await Order.find(query)
      .populate('courier', 'name')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);
    
    const total = await Order.countDocuments(query);
    
    res.json({
      orders,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

### 5. Create Courier Model (MEDIUM PRIORITY)

**New file:** `models/Courier.js`

```javascript
const mongoose = require('mongoose');

const CourierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  
  contactEmail: String,
  contactPhone: String,
  
  regions: [String],
  
  performance: {
    totalDeliveries: {
      type: Number,
      default: 0
    },
    successfulDeliveries: {
      type: Number,
      default: 0
    },
    failedDeliveries: {
      type: Number,
      default: 0
    },
    avgDeliveryTime: {
      type: Number,
      default: 48
    },
    returnRate: {
      type: Number,
      default: 0
    }
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual for success rate
CourierSchema.virtual('successRate').get(function() {
  if (this.performance.totalDeliveries === 0) return 0;
  return (this.performance.successfulDeliveries / this.performance.totalDeliveries) * 100;
});

module.exports = mongoose.model('Courier', CourierSchema);
```

---

### 6. Create Courier Performance API (MEDIUM PRIORITY)

**New endpoint:** `GET /api/analytics/courier-performance`

```javascript
// routes/analytics/courierPerformance.js
router.get('/courier-performance', async (req, res) => {
  try {
    const { shopId } = req.user;
    
    // Get all active couriers
    const couriers = await Courier.find({ isActive: true });
    
    // Get performance data for each courier
    const courierData = await Promise.all(couriers.map(async (courier) => {
      const orders = await Order.find({ 
        courier: courier._id,
        shopId 
      });
      
      const successful = orders.filter(o => o.status === 'delivered').length;
      const total = orders.length;
      
      return {
        name: courier.name,
        successRate: total > 0 ? Math.round((successful / total) * 100 * 10) / 10 : 0,
        avgDeliveryTime: courier.performance.avgDeliveryTime,
        totalDeliveries: total,
        returnRate: courier.performance.returnRate
      };
    }));
    
    res.json({ couriers: courierData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## Database Migration Scripts

### Run these to update existing data:

```javascript
// migration-1-add-default-values.js
db.orders.updateMany(
  { aiScore: { $exists: false } },
  { 
    $set: { 
      aiScore: 50,
      riskLevel: 'medium',
      deliverySuccessProbability: 70,
      hasComplaint: false
    } 
  }
);

// migration-2-create-default-couriers.js
db.couriers.insertMany([
  { 
    name: 'Courier A', 
    regions: ['Tunis', 'Ariana'],
    performance: {
      totalDeliveries: 0,
      successfulDeliveries: 0,
      avgDeliveryTime: 48,
      returnRate: 5
    }
  },
  { 
    name: 'Courier B', 
    regions: ['Sfax', 'Sousse'],
    performance: {
      totalDeliveries: 0,
      successfulDeliveries: 0,
      avgDeliveryTime: 48,
      returnRate: 5
    }
  }
]);

// migration-3-link-complaints-to-orders.js
const complaints = db.complaints.find({});
complaints.forEach(complaint => {
  db.orders.updateOne(
    { _id: complaint.orderId },
    { $set: { hasComplaint: true } }
  );
});
```

---

## Testing Endpoints

Use these curl commands to test:

```bash
# Test dashboard metrics
curl -X GET http://localhost:3000/api/analytics/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test risk score distribution
curl -X GET http://localhost:3000/api/analytics/risk-score-distribution \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test risky orders filter
curl -X GET "http://localhost:3000/api/orders?filter=risky" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test courier performance
curl -X GET http://localhost:3000/api/analytics/courier-performance \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Priority Order

1. ✅ **Day 1**: Update dashboard metrics API (Critical for frontend)
2. ✅ **Day 1**: Add new fields to Order model
3. ✅ **Day 2**: Create risk score distribution API
4. ✅ **Day 2**: Update orders API with new filters
5. ✅ **Day 3**: Create Courier model and seed data
6. ✅ **Day 3**: Create courier performance API
7. ✅ **Day 4**: Run migration scripts
8. ✅ **Day 5**: Testing and bug fixes

---

## Common Issues & Solutions

### Issue: Frontend shows 0 for new metrics
**Solution:** Make sure your API returns the new fields with default values (0) even if no data exists yet.

### Issue: Orders not filtering by risk level
**Solution:** Ensure all existing orders have `aiScore` field. Run migration script.

### Issue: Courier data not showing
**Solution:** Create at least 2-3 courier records in the database using the migration script.

---

## Need Help?

See the full documentation in `BACKEND_CHANGES_REQUIRED.md` for:
- Complete API specifications
- All new endpoints needed
- Detailed implementation examples
- Enterprise features
- WebSocket updates
- Security considerations

---

## Quick Checklist

- [ ] Dashboard metrics API updated with 4 new fields
- [ ] Order model has new fields (aiScore, riskLevel, etc.)
- [ ] Risk score distribution API created
- [ ] Orders API supports new filters (risky, courier, region, hasComplaint)
- [ ] Courier model created
- [ ] Courier performance API created
- [ ] Migration scripts executed
- [ ] All endpoints tested with Postman/curl
- [ ] Frontend can fetch and display new data
