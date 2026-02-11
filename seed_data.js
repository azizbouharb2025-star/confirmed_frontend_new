/**
 * MongoDB Seed Script for Confirmed Platform
 * 
 * Run on your VPS with:
 *   mongosh confirmed_db < seed_data.js
 * 
 * Or if you use auth:
 *   mongosh "mongodb://username:password@localhost:27017/confirmed_db" < seed_data.js
 * 
 * ⚠️  BEFORE RUNNING: Replace the ObjectIds below with real ones from your DB.
 *     Run these commands first to get your IDs:
 * 
 *     db.users.find({ role: 'operator' }, { _id: 1, name: 1 })
 *     db.users.find({ role: 'shop_owner' }, { _id: 1, name: 1 })
 *     db.users.find({ role: 'admin' }, { _id: 1, name: 1 })
 *     db.shops.find({}, { _id: 1, name: 1 })
 *     db.orders.find({}, { _id: 1, orderId: 1 }).limit(5)
 */

// ============================================================
// YOUR REAL IDs
// ============================================================
const OPERATOR_1_ID = ObjectId("698b3273dca1424b562379c2");
const ADMIN_ID      = ObjectId("698b30d34d61d8ba8d87fa9f");
const SHOP_1_ID     = ObjectId("698c9a9040ecdbcdb340b83f");
const SHOP_2_ID     = ObjectId("698c9aa3648a18995b891e17");
const SHOP_3_ID     = ObjectId("698c9aa4b405c6cea0f7e9fb");
// ============================================================

const now = new Date();
const hour = 60 * 60 * 1000;
const day = 24 * hour;

print("🌱 Starting seed...");

// ============================================================
// 1. Add preferences subdocument to ALL existing users
// ============================================================
print("📋 Adding preferences to users...");

db.users.updateMany(
  { preferences: { $exists: false } },
  {
    $set: {
      preferences: {
        emailNotifications: true,
        pushNotifications: true
      }
    }
  }
);

print("   ✓ User preferences added");

// ============================================================
// 2. ActivityLog collection — recent system events
// ============================================================
print("📋 Seeding activitylogs...");

db.activitylogs.drop();
db.activitylogs.insertMany([
  {
    type: "user",
    action: "New user registered",
    detail: "ahmed@example.com",
    timestamp: new Date(now - 2 * 60 * 1000),
    createdAt: new Date(now - 2 * 60 * 1000)
  },
  {
    type: "order",
    action: "Order confirmed",
    detail: "#ORD-1042",
    timestamp: new Date(now - 5 * 60 * 1000),
    createdAt: new Date(now - 5 * 60 * 1000)
  },
  {
    type: "system",
    action: "Shop connected",
    detail: "TechStore TN",
    timestamp: new Date(now - 10 * 60 * 1000),
    createdAt: new Date(now - 10 * 60 * 1000)
  },
  {
    type: "payment",
    action: "Subscription upgraded",
    detail: "Pro plan — 299 TND",
    timestamp: new Date(now - 15 * 60 * 1000),
    createdAt: new Date(now - 15 * 60 * 1000)
  },
  {
    type: "order",
    action: "Order rejected",
    detail: "#ORD-1038",
    timestamp: new Date(now - 20 * 60 * 1000),
    createdAt: new Date(now - 20 * 60 * 1000)
  },
  {
    type: "user",
    action: "Operator joined",
    detail: "fatma@example.com",
    timestamp: new Date(now - 30 * 60 * 1000),
    createdAt: new Date(now - 30 * 60 * 1000)
  },
  {
    type: "order",
    action: "Order confirmed",
    detail: "#ORD-1035",
    timestamp: new Date(now - 45 * 60 * 1000),
    createdAt: new Date(now - 45 * 60 * 1000)
  },
  {
    type: "system",
    action: "Webhook configured",
    detail: "Shopify — MyStore",
    timestamp: new Date(now - 1 * hour),
    createdAt: new Date(now - 1 * hour)
  },
  {
    type: "order",
    action: "Bulk orders imported",
    detail: "47 orders — ElectroShop",
    timestamp: new Date(now - 2 * hour),
    createdAt: new Date(now - 2 * hour)
  },
  {
    type: "user",
    action: "Password changed",
    detail: "seller@example.com",
    timestamp: new Date(now - 3 * hour),
    createdAt: new Date(now - 3 * hour)
  }
]);

db.activitylogs.createIndex({ timestamp: -1 });
db.activitylogs.createIndex({ type: 1 });

print("   ✓ 10 activity logs inserted");

// ============================================================
// 3. Missions collection — operator gamification
// ============================================================
print("📋 Seeding missions...");

db.missions.drop();

// Create missions for your operator
[OPERATOR_1_ID].forEach(function(opId, idx) {
  db.missions.insertMany([
    {
      operatorId: opId,
      title: "Daily Confirmation Goal",
      description: "Confirm 20 orders today",
      target: 20,
      current: Math.floor(Math.random() * 18) + 2,
      reward: 10,
      rewardType: "cash",
      type: "daily",
      status: "active",
      expiresAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
      createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    },
    {
      operatorId: opId,
      title: "Weekly Champion",
      description: "Achieve 90% confirmation rate this week",
      target: 90,
      current: 75 + Math.floor(Math.random() * 15),
      reward: 50,
      rewardType: "cash",
      type: "weekly",
      status: "active",
      expiresAt: new Date(now.getTime() + (7 - now.getDay()) * day),
      createdAt: new Date(now.getTime() - now.getDay() * day)
    },
    {
      operatorId: opId,
      title: "Speed Demon",
      description: "Complete 50 calls in one day",
      target: 50,
      current: 20 + Math.floor(Math.random() * 25),
      reward: 25,
      rewardType: "points",
      type: "daily",
      status: "active",
      expiresAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
      createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    },
    {
      operatorId: opId,
      title: "Zero Complaints Week",
      description: "No customer complaints on your confirmed orders",
      target: 1,
      current: 1,
      reward: 30,
      rewardType: "cash",
      type: "weekly",
      status: "completed",
      completedAt: new Date(now - 2 * day),
      expiresAt: new Date(now.getTime() + (7 - now.getDay()) * day),
      createdAt: new Date(now.getTime() - now.getDay() * day)
    }
  ]);
});

db.missions.createIndex({ operatorId: 1, status: 1 });
db.missions.createIndex({ expiresAt: 1 });

print("   ✓ 4 missions inserted for operator");

// ============================================================
// 4. OperatorWallet collection
// ============================================================
print("📋 Seeding operatorwallets...");

db.operatorwallets.drop();
db.operatorwallets.insertMany([
  {
    operatorId: OPERATOR_1_ID,
    balance: 245.50,
    pendingRewards: 35.00,
    updatedAt: now
  }
]);

db.operatorwallets.createIndex({ operatorId: 1 }, { unique: true });

print("   ✓ 3 operator wallets inserted");

// ============================================================
// 5. RewardTransaction collection — wallet history
// ============================================================
print("📋 Seeding rewardtransactions...");

db.rewardtransactions.drop();

var rewardData = [
  { opId: OPERATOR_1_ID, amount: 10, reason: "Daily goal completed", daysAgo: 0 },
  { opId: OPERATOR_1_ID, amount: 25, reason: "Weekly bonus", daysAgo: 1 },
  { opId: OPERATOR_1_ID, amount: 15, reason: "Perfect streak — 3 days", daysAgo: 2 },
  { opId: OPERATOR_1_ID, amount: 50, reason: "Weekly champion reward", daysAgo: 7 },
  { opId: OPERATOR_1_ID, amount: 10, reason: "Daily goal completed", daysAgo: 3 },
  { opId: OPERATOR_1_ID, amount: 10, reason: "Daily goal completed", daysAgo: 4 },
  { opId: OPERATOR_1_ID, amount: 30, reason: "Zero complaints bonus", daysAgo: 5 },
  { opId: OPERATOR_1_ID, amount: 10, reason: "Speed demon bonus", daysAgo: 6 },
];

var rewardDocs = rewardData.map(function(r) {
  return {
    operatorId: r.opId,
    amount: r.amount,
    reason: r.reason,
    date: new Date(now - r.daysAgo * day),
    createdAt: new Date(now - r.daysAgo * day)
  };
});

db.rewardtransactions.insertMany(rewardDocs);
db.rewardtransactions.createIndex({ operatorId: 1, date: -1 });

print("   ✓ " + rewardDocs.length + " reward transactions inserted");

// ============================================================
// 6. Create indexes for admin dashboard aggregations
//    (on your existing orders collection)
// ============================================================
print("📋 Creating indexes for dashboard queries...");

// These help the admin charts/orders and charts/revenue aggregations
db.orders.createIndex({ createdAt: -1 });
db.orders.createIndex({ status: 1, createdAt: -1 });
db.orders.createIndex({ assignedOperatorId: 1, status: 1 });
db.orders.createIndex({ shopId: 1, createdAt: -1 });

print("   ✓ Order indexes created");

// ============================================================
// 7. Summary
// ============================================================
print("");
print("============================================");
print("🎉 Seed complete! Collections populated:");
print("   • activitylogs     — " + db.activitylogs.countDocuments() + " docs");
print("   • missions         — " + db.missions.countDocuments() + " docs");
print("   • operatorwallets  — " + db.operatorwallets.countDocuments() + " docs");
print("   • rewardtransactions — " + db.rewardtransactions.countDocuments() + " docs");
print("   • users.preferences — updated all users");
print("============================================");
print("");
print("⚠️  Done! Your IDs are already set:");
print("   Operator: 698b3273dca1424b562379c2");
print("   Admin:    698b30d34d61d8ba8d87fa9f");
print("   Shops:    698c9a9040ecdbcdb340b83f, 698c9aa3648a18995b891e17, 698c9aa4b405c6cea0f7e9fb");
