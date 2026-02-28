/**
 * MongoDB Seed Script for Confirmed Platform - DEMO DATA
 * 
 * This script creates realistic demo data matching all mock data structures
 * used throughout the application for recording credible demos.
 * 
 * Run on your VPS with:
 *   mongosh confirmed_db < seed_demo_data.js
 * 
 * Or with authentication:
 *   mongosh "mongodb://username:password@localhost:27017/confirmed_db" < seed_demo_data.js
 * 
 * ⚠️  BEFORE RUNNING: Update the IDs below with your actual database IDs
 */

// ============================================================
// YOUR REAL IDs - UPDATE THESE!
// ============================================================
const SHOP_OWNER_ID = ObjectId("YOUR_SHOP_OWNER_ID_HERE");
const OPERATOR_1_ID = ObjectId("YOUR_OPERATOR_1_ID_HERE");
const OPERATOR_2_ID = ObjectId("YOUR_OPERATOR_2_ID_HERE");
const ADMIN_ID      = ObjectId("YOUR_ADMIN_ID_HERE");
const SHOP_1_ID     = ObjectId("YOUR_SHOP_1_ID_HERE");
const SHOP_2_ID     = ObjectId("YOUR_SHOP_2_ID_HERE");
const SHOP_3_ID     = ObjectId("YOUR_SHOP_3_ID_HERE");
// ============================================================

const now = new Date();
const hour = 60 * 60 * 1000;
const day = 24 * hour;

print("🌱 Starting demo data seed...");
print("");

// ============================================================
// 1. PRODUCTS - For product performance tracking
// ============================================================
print("📦 Seeding products...");

db.products.drop();
db.products.insertMany([
  {
    _id: ObjectId(),
    shopId: SHOP_1_ID,
    name: "Wireless Headphones",
    description: "Premium noise-cancelling wireless headphones",
    price: 299.99,
    sku: "WH-001",
    imageUrl: "/assets/product1.jpg",
    category: "Electronics",
    stock: 45,
    isActive: true,
    createdAt: new Date(now - 90 * day),
    updatedAt: new Date(now - 2 * day)
  },
  {
    _id: ObjectId(),
    shopId: SHOP_1_ID,
    name: "Smart Watch",
    description: "Fitness tracking smartwatch with heart rate monitor",
    price: 199.99,
    sku: "SW-002",
    imageUrl: "/assets/product2.jpg",
    category: "Electronics",
    stock: 32,
    isActive: true,
    createdAt: new Date(now - 85 * day),
    updatedAt: new Date(now - 1 * day)
  },
  {
    _id: ObjectId(),
    shopId: SHOP_1_ID,
    name: "Laptop Stand",
    description: "Ergonomic aluminum laptop stand",
    price: 49.99,
    sku: "LS-003",
    imageUrl: "/assets/product3.jpg",
    category: "Accessories",
    stock: 78,
    isActive: true,
    createdAt: new Date(now - 80 * day),
    updatedAt: now
  },
  {
    _id: ObjectId(),
    shopId: SHOP_1_ID,
    name: "USB-C Cable",
    description: "Fast charging USB-C cable 2m",
    price: 19.99,
    sku: "UC-004",
    imageUrl: "/assets/product4.jpg",
    category: "Accessories",
    stock: 156,
    isActive: true,
    createdAt: new Date(now - 75 * day),
    updatedAt: now
  },
  {
    _id: ObjectId(),
    shopId: SHOP_1_ID,
    name: "Phone Case",
    description: "Protective silicone phone case",
    price: 24.99,
    sku: "PC-005",
    imageUrl: "/assets/product5.jpg",
    category: "Accessories",
    stock: 203,
    isActive: true,
    createdAt: new Date(now - 70 * day),
    updatedAt: now
  },
  {
    _id: ObjectId(),
    shopId: SHOP_1_ID,
    name: "Bluetooth Speaker",
    description: "Portable waterproof Bluetooth speaker",
    price: 79.99,
    sku: "BS-006",
    imageUrl: "/assets/product6.jpg",
    category: "Electronics",
    stock: 67,
    isActive: true,
    createdAt: new Date(now - 65 * day),
    updatedAt: now
  },
  {
    _id: ObjectId(),
    shopId: SHOP_1_ID,
    name: "Wireless Keyboard",
    description: "Mechanical wireless keyboard with RGB",
    price: 129.99,
    sku: "KB-007",
    imageUrl: "/assets/product1.jpg",
    category: "Electronics",
    stock: 41,
    isActive: true,
    createdAt: new Date(now - 60 * day),
    updatedAt: now
  },
  {
    _id: ObjectId(),
    shopId: SHOP_1_ID,
    name: "Mouse Pad",
    description: "Large gaming mouse pad",
    price: 14.99,
    sku: "MP-008",
    imageUrl: "/assets/product1.jpg",
    category: "Accessories",
    stock: 189,
    isActive: true,
    createdAt: new Date(now - 55 * day),
    updatedAt: now
  },
  {
    _id: ObjectId(),
    shopId: SHOP_1_ID,
    name: "HD Webcam",
    description: "1080p HD webcam with microphone",
    price: 89.99,
    sku: "WC-009",
    imageUrl: "/assets/product1.jpg",
    category: "Electronics",
    stock: 28,
    isActive: true,
    createdAt: new Date(now - 50 * day),
    updatedAt: now
  },
  {
    _id: ObjectId(),
    shopId: SHOP_1_ID,
    name: "27\" Monitor",
    description: "4K UHD 27-inch monitor",
    price: 399.99,
    sku: "MN-010",
    imageUrl: "/assets/product1.jpg",
    category: "Electronics",
    stock: 15,
    isActive: true,
    createdAt: new Date(now - 45 * day),
    updatedAt: now
  }
]);

print("   ✓ 10 products inserted");

// ============================================================
// 2. ORDERS - With various statuses and cancellation reasons
// ============================================================
print("📋 Seeding orders...");

// Helper function to generate random order
function generateOrder(daysAgo, status, shopId, operatorId) {
  const orderDate = new Date(now - daysAgo * day);
  const orderId = "ORD-" + (1000 + Math.floor(Math.random() * 9000));
  
  const customers = [
    { name: "Ahmed Ben Ali", phone: "+216 98 123 456", city: "Tunis", region: "Tunis" },
    { name: "Fatima Mansouri", phone: "+216 97 234 567", city: "Sfax", region: "Sfax" },
    { name: "Mohamed Trabelsi", phone: "+216 99 345 678", city: "Sousse", region: "Sousse" },
    { name: "Leila Gharbi", phone: "+216 96 456 789", city: "Ariana", region: "Ariana" },
    { name: "Karim Jebali", phone: "+216 95 567 890", city: "Bizerte", region: "Bizerte" },
    { name: "Sonia Hamdi", phone: "+216 94 678 901", city: "Monastir", region: "Monastir" },
    { name: "Youssef Khelifi", phone: "+216 93 789 012", city: "Nabeul", region: "Nabeul" },
    { name: "Amira Sassi", phone: "+216 92 890 123", city: "Gabes", region: "Gabes" }
  ];
  
  const customer = customers[Math.floor(Math.random() * customers.length)];
  const total = Math.floor(Math.random() * 500) + 50;
  const aiScore = Math.floor(Math.random() * 40) + 60;
  
  const order = {
    _id: ObjectId(),
    orderId: orderId,
    shopId: shopId,
    customerName: customer.name,
    customerPhone: customer.phone,
    customerEmail: customer.name.toLowerCase().replace(/ /g, '.') + "@example.com",
    deliveryAddress: {
      street: Math.floor(Math.random() * 100) + " Avenue Habib Bourguiba",
      city: customer.city,
      state: customer.region,
      zipCode: String(Math.floor(Math.random() * 9000) + 1000),
      country: "Tunisia"
    },
    items: [
      {
        productId: "prod_" + Math.floor(Math.random() * 10 + 1),
        name: "Product " + Math.floor(Math.random() * 10 + 1),
        quantity: Math.floor(Math.random() * 3) + 1,
        price: Math.floor(Math.random() * 200) + 20
      }
    ],
    total: total,
    status: status,
    aiScore: aiScore,
    riskLevel: aiScore > 80 ? 'high' : aiScore >= 50 ? 'medium' : 'low',
    createdAt: orderDate,
    updatedAt: new Date(orderDate.getTime() + Math.random() * 2 * hour)
  };
  
  if (operatorId && (status === 'confirmed' || status === 'rejected')) {
    order.assignedOperatorId = operatorId;
    order.confirmedAt = new Date(orderDate.getTime() + Math.random() * 2 * hour);
  }
  
  if (status === 'cancelled') {
    const reasons = [
      'customer_refused',
      'price_too_high',
      'quality_doubts',
      'duplicate_order',
      'fake_number',
      'not_available',
      'courier_failed',
      'customer_rejected_at_door'
    ];
    order.cancellationReason = reasons[Math.floor(Math.random() * reasons.length)];
    order.cancelledAt = new Date(orderDate.getTime() + Math.random() * 3 * hour);
  }
  
  if (status === 'shipped' || status === 'delivered') {
    order.shippedAt = new Date(orderDate.getTime() + 1 * day);
    order.trackingNumber = "TRK" + Math.floor(Math.random() * 1000000);
  }
  
  if (status === 'delivered') {
    order.deliveredAt = new Date(orderDate.getTime() + 3 * day);
  }
  
  return order;
}

// Generate orders for the last 30 days
const orders = [];
for (let i = 0; i < 30; i++) {
  const ordersPerDay = Math.floor(Math.random() * 15) + 10; // 10-25 orders per day
  
  for (let j = 0; j < ordersPerDay; j++) {
    const rand = Math.random();
    let status, operatorId;
    
    if (rand < 0.50) {
      status = 'confirmed';
      operatorId = Math.random() > 0.5 ? OPERATOR_1_ID : OPERATOR_2_ID;
    } else if (rand < 0.65) {
      status = 'shipped';
      operatorId = Math.random() > 0.5 ? OPERATOR_1_ID : OPERATOR_2_ID;
    } else if (rand < 0.75) {
      status = 'delivered';
      operatorId = Math.random() > 0.5 ? OPERATOR_1_ID : OPERATOR_2_ID;
    } else if (rand < 0.85) {
      status = 'pending';
      operatorId = null;
    } else if (rand < 0.92) {
      status = 'cancelled';
      operatorId = null;
    } else {
      status = 'rejected';
      operatorId = Math.random() > 0.5 ? OPERATOR_1_ID : OPERATOR_2_ID;
    }
    
    orders.push(generateOrder(i, status, SHOP_1_ID, operatorId));
  }
}

db.orders.insertMany(orders);

print("   ✓ " + orders.length + " orders inserted");

// ============================================================
// 3. HUMAN FEEDBACK - Operator feedback on orders
// ============================================================
print("💬 Seeding human feedback...");

db.humanfeedback.drop();

const feedbackDocs = [];
const confirmedOrders = orders.filter(o => o.status === 'confirmed' || o.status === 'delivered');

confirmedOrders.slice(0, 50).forEach(function(order) {
  const rating = Math.floor(Math.random() * 2) + 3; // 3-5 stars
  const tags = [];
  
  const allTags = [
    'polite customer',
    'price concern',
    'quality question',
    'delivery inquiry',
    'satisfied customer',
    'repeat buyer',
    'new customer',
    'urgent request'
  ];
  
  const numTags = Math.floor(Math.random() * 3) + 1;
  for (let i = 0; i < numTags; i++) {
    const tag = allTags[Math.floor(Math.random() * allTags.length)];
    if (!tags.includes(tag)) tags.push(tag);
  }
  
  const notes = [
    "Customer was very polite and confirmed immediately",
    "Had some questions about delivery time but confirmed",
    "Requested faster delivery option",
    "Very satisfied with the product details",
    "Asked about payment options",
    "Confirmed after price negotiation",
    "Regular customer, smooth confirmation"
  ];
  
  feedbackDocs.push({
    _id: ObjectId(),
    orderId: order._id,
    operatorId: order.assignedOperatorId,
    operatorName: order.assignedOperatorId.equals(OPERATOR_1_ID) ? "Ahmed Hassan" : "Fatima Zahra",
    operatorAvatar: null,
    rating: rating,
    tags: tags,
    notes: notes[Math.floor(Math.random() * notes.length)],
    timestamp: new Date(order.confirmedAt || order.createdAt),
    createdAt: new Date(order.confirmedAt || order.createdAt)
  });
});

db.humanfeedback.insertMany(feedbackDocs);

print("   ✓ " + feedbackDocs.length + " human feedback entries inserted");

// ============================================================
// 4. AI FEEDBACK - AI analysis of orders
// ============================================================
print("🤖 Seeding AI feedback...");

db.aifeedback.drop();

const aiFeedbackDocs = [];

orders.slice(0, 100).forEach(function(order) {
  const confidence = Math.random() * 0.3 + 0.7; // 0.7-1.0
  
  const riskFactors = [];
  if (order.aiScore < 70) {
    riskFactors.push({
      factor: "Low historical success rate",
      impact: -15,
      confidence: 0.85
    });
  }
  if (order.total > 300) {
    riskFactors.push({
      factor: "High order value",
      impact: 10,
      confidence: 0.92
    });
  }
  
  const recommendations = [];
  if (order.aiScore < 60) {
    recommendations.push("Verify customer phone number before shipping");
    recommendations.push("Consider requiring prepayment");
  } else if (order.aiScore > 85) {
    recommendations.push("Fast-track for immediate shipping");
  }
  
  aiFeedbackDocs.push({
    _id: ObjectId(),
    orderId: order._id,
    aiScore: order.aiScore,
    riskLevel: order.riskLevel,
    confidence: confidence,
    riskFactors: riskFactors,
    recommendations: recommendations,
    predictedOutcome: order.aiScore > 70 ? 'confirmed' : 'uncertain',
    timestamp: order.createdAt,
    createdAt: order.createdAt
  });
});

db.aifeedback.insertMany(aiFeedbackDocs);

print("   ✓ " + aiFeedbackDocs.length + " AI feedback entries inserted");

// ============================================================
// 5. DELIVERY PROVIDERS - For delivery company management
// ============================================================
print("🚚 Seeding delivery providers...");

db.deliveryproviders.drop();
db.deliveryproviders.insertMany([
  {
    _id: ObjectId(),
    shopId: SHOP_1_ID,
    name: "Aramex Morocco",
    type: "aramex",
    apiEndpoint: "https://api.aramex.com/v1",
    apiKey: Buffer.from("mock_aramex_key_123").toString('base64'),
    apiSecret: Buffer.from("mock_aramex_secret_456").toString('base64'),
    isActive: true,
    lastSyncAt: new Date(now - 2 * hour),
    lastSyncStatus: "success",
    config: {
      autoSync: true,
      syncInterval: 30,
      supportedRegions: ["Casablanca", "Rabat", "Marrakech", "Tangier", "Fes"]
    },
    createdAt: new Date(now - 30 * day),
    updatedAt: new Date(now - 2 * hour)
  },
  {
    _id: ObjectId(),
    shopId: SHOP_1_ID,
    name: "DHL Express",
    type: "dhl",
    apiEndpoint: "https://api.dhl.com/v2",
    apiKey: Buffer.from("mock_dhl_key_789").toString('base64'),
    isActive: false,
    lastSyncAt: new Date(now - 5 * day),
    lastSyncStatus: "failed",
    lastSyncError: "Authentication failed",
    config: {
      autoSync: false,
      syncInterval: 60,
      supportedRegions: ["All Morocco"]
    },
    createdAt: new Date(now - 15 * day),
    updatedAt: new Date(now - 5 * day)
  }
]);

print("   ✓ 2 delivery providers inserted");

// ============================================================
// 6. TEAM MEMBERS - For team management
// ============================================================
print("👥 Seeding team members...");

db.teammembers.drop();
db.teammembers.insertMany([
  {
    _id: ObjectId(),
    shopId: SHOP_1_ID,
    userId: OPERATOR_1_ID,
    email: "operator1@example.com",
    name: "Ahmed Hassan",
    role: "operator",
    status: "confirmed",
    invitedAt: new Date(now - 30 * day),
    invitedBy: SHOP_OWNER_ID,
    acceptedAt: new Date(now - 29 * day),
    lastActiveAt: new Date(now - 2 * hour),
    performanceMetrics: {
      totalCalls: 145,
      confirmedCalls: 112,
      confirmationRate: 77.24,
      averageCallDuration: 180,
      lastCallAt: new Date(now - 2 * hour)
    },
    createdAt: new Date(now - 30 * day),
    updatedAt: new Date(now - 2 * hour)
  },
  {
    _id: ObjectId(),
    shopId: SHOP_1_ID,
    userId: OPERATOR_2_ID,
    email: "operator2@example.com",
    name: "Fatima Zahra",
    role: "operator",
    status: "confirmed",
    invitedAt: new Date(now - 20 * day),
    invitedBy: SHOP_OWNER_ID,
    acceptedAt: new Date(now - 19 * day),
    lastActiveAt: new Date(now - 1 * hour),
    performanceMetrics: {
      totalCalls: 98,
      confirmedCalls: 82,
      confirmationRate: 83.67,
      averageCallDuration: 165,
      lastCallAt: new Date(now - 1 * hour)
    },
    createdAt: new Date(now - 20 * day),
    updatedAt: new Date(now - 1 * hour)
  },
  {
    _id: ObjectId(),
    shopId: SHOP_1_ID,
    userId: ObjectId(),
    email: "manager@example.com",
    name: "Youssef Alami",
    role: "manager",
    status: "confirmed",
    invitedAt: new Date(now - 45 * day),
    invitedBy: SHOP_OWNER_ID,
    acceptedAt: new Date(now - 44 * day),
    lastActiveAt: new Date(now - 30 * 60 * 1000),
    createdAt: new Date(now - 45 * day),
    updatedAt: new Date(now - 30 * 60 * 1000)
  },
  {
    _id: ObjectId(),
    shopId: SHOP_1_ID,
    userId: null,
    email: "newoperator@example.com",
    role: "operator",
    status: "pending",
    invitedAt: new Date(now - 2 * day),
    invitedBy: SHOP_OWNER_ID,
    createdAt: new Date(now - 2 * day),
    updatedAt: new Date(now - 2 * day)
  }
]);

print("   ✓ 4 team members inserted");

// ============================================================
// 7. ACTIVITY LOGS - For admin dashboard
// ============================================================
print("📊 Seeding activity logs...");

db.activitylogs.drop();

const activities = [];
const activityTypes = [
  { type: "order", messages: ["New order created", "Order confirmed", "Order shipped", "Order delivered", "Order cancelled"] },
  { type: "user", messages: ["New user registered", "User logged in", "Password changed", "Profile updated"] },
  { type: "shop", messages: ["Shop created", "Shop settings updated", "API credentials generated"] },
  { type: "system", messages: ["Database backup completed", "System maintenance", "Cache cleared"] }
];

for (let i = 0; i < 50; i++) {
  const typeData = activityTypes[Math.floor(Math.random() * activityTypes.length)];
  const message = typeData.messages[Math.floor(Math.random() * typeData.messages.length)];
  
  activities.push({
    _id: ObjectId(),
    type: typeData.type,
    action: message,
    detail: "#" + Math.floor(Math.random() * 9000 + 1000),
    timestamp: new Date(now - i * 15 * 60 * 1000),
    createdAt: new Date(now - i * 15 * 60 * 1000)
  });
}

db.activitylogs.insertMany(activities);

print("   ✓ " + activities.length + " activity logs inserted");

// ============================================================
// 8. COMPLAINTS - For complaints analytics
// ============================================================
print("📝 Seeding complaints...");

db.complaints.drop();

const complaints = [];
const complaintCategories = [
  "Product Quality",
  "Delivery Issue",
  "Wrong Item",
  "Damaged Product",
  "Missing Item",
  "Other"
];

const complaintTexts = [
  "Product arrived damaged, box was crushed",
  "Delivery was 3 days late, very disappointed",
  "Received wrong color, ordered black got white",
  "Product quality is poor, not as described",
  "Missing accessories from the package",
  "Product stopped working after 2 days"
];

for (let i = 0; i < 30; i++) {
  const daysAgo = Math.floor(Math.random() * 30);
  const category = complaintCategories[Math.floor(Math.random() * complaintCategories.length)];
  
  complaints.push({
    _id: ObjectId(),
    orderId: orders[Math.floor(Math.random() * orders.length)]._id,
    shopId: SHOP_1_ID,
    category: category,
    description: complaintTexts[Math.floor(Math.random() * complaintTexts.length)],
    status: Math.random() > 0.3 ? "resolved" : "pending",
    priority: Math.random() > 0.7 ? "high" : Math.random() > 0.4 ? "medium" : "low",
    createdAt: new Date(now - daysAgo * day),
    updatedAt: new Date(now - (daysAgo - 1) * day),
    resolvedAt: Math.random() > 0.3 ? new Date(now - (daysAgo - 2) * day) : null
  });
}

db.complaints.insertMany(complaints);

print("   ✓ " + complaints.length + " complaints inserted");

// ============================================================
// 9. CREATE INDEXES
// ============================================================
print("🔍 Creating indexes...");

// Products
db.products.createIndex({ shopId: 1, isActive: 1 });
db.products.createIndex({ sku: 1 }, { unique: true });

// Orders
db.orders.createIndex({ shopId: 1, createdAt: -1 });
db.orders.createIndex({ status: 1, createdAt: -1 });
db.orders.createIndex({ assignedOperatorId: 1, status: 1 });
db.orders.createIndex({ orderId: 1 }, { unique: true });
db.orders.createIndex({ aiScore: 1 });

// Feedback
db.humanfeedback.createIndex({ orderId: 1 });
db.humanfeedback.createIndex({ operatorId: 1, timestamp: -1 });
db.aifeedback.createIndex({ orderId: 1 });
db.aifeedback.createIndex({ aiScore: 1 });

// Delivery Providers
db.deliveryproviders.createIndex({ shopId: 1, isActive: 1 });

// Team Members
db.teammembers.createIndex({ shopId: 1, status: 1 });
db.teammembers.createIndex({ userId: 1 });
db.teammembers.createIndex({ email: 1 });

// Activity Logs
db.activitylogs.createIndex({ timestamp: -1 });
db.activitylogs.createIndex({ type: 1, timestamp: -1 });

// Complaints
db.complaints.createIndex({ shopId: 1, status: 1 });
db.complaints.createIndex({ orderId: 1 });
db.complaints.createIndex({ createdAt: -1 });

print("   ✓ All indexes created");

// ============================================================
// 10. SUMMARY
// ============================================================
print("");
print("============================================");
print("🎉 Demo data seed complete!");
print("============================================");
print("");
print("Collections populated:");
print("   • products           — " + db.products.countDocuments() + " docs");
print("   • orders             — " + db.orders.countDocuments() + " docs");
print("   • humanfeedback      — " + db.humanfeedback.countDocuments() + " docs");
print("   • aifeedback         — " + db.aifeedback.countDocuments() + " docs");
print("   • deliveryproviders  — " + db.deliveryproviders.countDocuments() + " docs");
print("   • teammembers        — " + db.teammembers.countDocuments() + " docs");
print("   • activitylogs       — " + db.activitylogs.countDocuments() + " docs");
print("   • complaints         — " + db.complaints.countDocuments() + " docs");
print("");
print("⚠️  IMPORTANT: Update the IDs at the top of this script");
print("   with your actual database IDs before running!");
print("");
print("To get your IDs, run:");
print("   db.users.find({ role: 'shop_owner' }, { _id: 1, email: 1 })");
print("   db.users.find({ role: 'operator' }, { _id: 1, email: 1 })");
print("   db.shops.find({}, { _id: 1, name: 1 })");
print("============================================");
