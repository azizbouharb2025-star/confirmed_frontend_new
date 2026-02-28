/**
 * Get Database IDs Script
 * 
 * This script extracts all the IDs you need for the seed_demo_data.js script
 * 
 * Run with:
 *   mongosh confirmed_db < get_database_ids.js
 * 
 * Or with authentication:
 *   mongosh "mongodb://username:password@localhost:27017/confirmed_db" < get_database_ids.js
 */

print("");
print("============================================");
print("🔍 Extracting Database IDs");
print("============================================");
print("");

// ============================================================
// 1. Get Shop Owner ID
// ============================================================
print("📋 SHOP OWNER:");
print("---");

const shopOwners = db.users.find({ role: 'shop_owner' }).limit(1).toArray();

if (shopOwners.length > 0) {
  const shopOwner = shopOwners[0];
  print("const SHOP_OWNER_ID = ObjectId(\"" + shopOwner._id + "\");");
  print("// Email: " + shopOwner.email);
  print("// Name: " + (shopOwner.firstName || "") + " " + (shopOwner.lastName || ""));
} else {
  print("⚠️  No shop owner found!");
  print("const SHOP_OWNER_ID = ObjectId(\"000000000000000000000000\"); // UPDATE THIS!");
}

print("");

// ============================================================
// 2. Get Operator IDs
// ============================================================
print("📋 OPERATORS:");
print("---");

const operators = db.users.find({ role: 'operator' }).limit(3).toArray();

if (operators.length >= 1) {
  print("const OPERATOR_1_ID = ObjectId(\"" + operators[0]._id + "\");");
  print("// Email: " + operators[0].email);
  print("// Name: " + (operators[0].firstName || "") + " " + (operators[0].lastName || ""));
} else {
  print("⚠️  No operator 1 found!");
  print("const OPERATOR_1_ID = ObjectId(\"000000000000000000000000\"); // UPDATE THIS!");
}

print("");

if (operators.length >= 2) {
  print("const OPERATOR_2_ID = ObjectId(\"" + operators[1]._id + "\");");
  print("// Email: " + operators[1].email);
  print("// Name: " + (operators[1].firstName || "") + " " + (operators[1].lastName || ""));
} else {
  print("⚠️  No operator 2 found - will use operator 1 ID");
  if (operators.length >= 1) {
    print("const OPERATOR_2_ID = ObjectId(\"" + operators[0]._id + "\"); // Same as operator 1");
  } else {
    print("const OPERATOR_2_ID = ObjectId(\"000000000000000000000000\"); // UPDATE THIS!");
  }
}

print("");

// ============================================================
// 3. Get Admin ID
// ============================================================
print("📋 ADMIN:");
print("---");

const admins = db.users.find({ role: 'admin' }).limit(1).toArray();

if (admins.length > 0) {
  const admin = admins[0];
  print("const ADMIN_ID = ObjectId(\"" + admin._id + "\");");
  print("// Email: " + admin.email);
  print("// Name: " + (admin.firstName || "") + " " + (admin.lastName || ""));
} else {
  print("⚠️  No admin found - will use shop owner ID");
  if (shopOwners.length > 0) {
    print("const ADMIN_ID = ObjectId(\"" + shopOwners[0]._id + "\"); // Using shop owner");
  } else {
    print("const ADMIN_ID = ObjectId(\"000000000000000000000000\"); // UPDATE THIS!");
  }
}

print("");

// ============================================================
// 4. Get Shop IDs
// ============================================================
print("📋 SHOPS:");
print("---");

const shops = db.shops.find({}).limit(3).toArray();

if (shops.length >= 1) {
  print("const SHOP_1_ID = ObjectId(\"" + shops[0]._id + "\");");
  print("// Name: " + shops[0].name);
  print("// Domain: " + (shops[0].domain || "N/A"));
} else {
  print("⚠️  No shop 1 found!");
  print("const SHOP_1_ID = ObjectId(\"000000000000000000000000\"); // UPDATE THIS!");
}

print("");

if (shops.length >= 2) {
  print("const SHOP_2_ID = ObjectId(\"" + shops[1]._id + "\");");
  print("// Name: " + shops[1].name);
  print("// Domain: " + (shops[1].domain || "N/A"));
} else {
  print("⚠️  No shop 2 found - will use shop 1 ID");
  if (shops.length >= 1) {
    print("const SHOP_2_ID = ObjectId(\"" + shops[0]._id + "\"); // Same as shop 1");
  } else {
    print("const SHOP_2_ID = ObjectId(\"000000000000000000000000\"); // UPDATE THIS!");
  }
}

print("");

if (shops.length >= 3) {
  print("const SHOP_3_ID = ObjectId(\"" + shops[2]._id + "\");");
  print("// Name: " + shops[2].name);
  print("// Domain: " + (shops[2].domain || "N/A"));
} else {
  print("⚠️  No shop 3 found - will use shop 1 ID");
  if (shops.length >= 1) {
    print("const SHOP_3_ID = ObjectId(\"" + shops[0]._id + "\"); // Same as shop 1");
  } else {
    print("const SHOP_3_ID = ObjectId(\"000000000000000000000000\"); // UPDATE THIS!");
  }
}

print("");
print("============================================");
print("✅ Done! Copy the lines above to seed_demo_data.js");
print("============================================");
print("");
print("📝 Summary:");
print("   • Shop Owners found: " + shopOwners.length);
print("   • Operators found: " + operators.length);
print("   • Admins found: " + admins.length);
print("   • Shops found: " + shops.length);
print("");

if (shopOwners.length === 0 || operators.length === 0 || shops.length === 0) {
  print("⚠️  WARNING: Some required data is missing!");
  print("   Make sure you have:");
  print("   • At least 1 shop owner user");
  print("   • At least 1 operator user");
  print("   • At least 1 shop");
  print("");
  print("   Create these first before running the seed script.");
  print("");
}

print("Next steps:");
print("1. Copy the ObjectId lines above");
print("2. Paste them into seed_demo_data.js (lines 13-19)");
print("3. Run: mongosh confirmed_db < seed_demo_data.js");
print("");
