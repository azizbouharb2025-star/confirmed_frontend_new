# 🎬 Demo Data Setup - Quick Start

Complete demo data setup for the Confirmed platform in 3 easy steps!

## 📦 What You Get

- **4 Users**: 1 admin, 1 shop owner, 2 operators with performance data
- **3 Shops**: Fully configured e-commerce shops
- **10 Products**: Electronics and accessories
- **400-500 Orders**: 30 days of realistic order history
- **50 Human Feedback**: Operator ratings and notes
- **100 AI Feedback**: Risk scores and recommendations
- **2 Delivery Providers**: Aramex (active) and DHL (inactive)
- **4 Team Members**: With performance metrics
- **50 Activity Logs**: System events
- **30 Complaints**: Customer complaints with categories

## 🚀 Quick Setup (3 Steps)

### Step 1: Run the Seed Script

```bash
# Simple version (no auth)
mongosh confirmed_db < seed_demo_data.js

# With authentication
mongosh "mongodb://username:password@localhost:27017/confirmed_db" < seed_demo_data.js
```

### Step 2: Generate Password Hashes

```bash
# Install bcryptjs if needed
npm install bcryptjs

# Generate hashes
node generate_password_hash.js
```

This will output MongoDB commands like:
```javascript
db.users.updateOne(
  { email: 'admin@confirmed.tn' },
  { $set: { password: '$2a$10$...' } }
);
```

Copy and paste these into mongosh to set the passwords.

### Step 3: Login and Test

Login with the shop owner account:
- **Email**: owner@techstore.tn
- **Password**: (whatever you set in generate_password_hash.js)

## 📋 Available Accounts

| Role | Email | Default Password | Access |
|------|-------|-----------------|--------|
| Admin | admin@confirmed.tn | admin123 | Full system access |
| Shop Owner | owner@techstore.tn | owner123 | Client dashboard |
| Operator 1 | ahmed.hassan@techstore.tn | ahmed123 | Operator panel |
| Operator 2 | fatima.zahra@techstore.tn | fatima123 | Operator panel |

⚠️ **Change these passwords** in `generate_password_hash.js` before running!

## 🎥 Demo Recording Tips

### Recommended Demo Flow

1. **Dashboard Overview** (2 min)
   - Show orders received, confirmed, delivery success widgets
   - Highlight cancelled orders widget with reasons

2. **Cancellations Analysis** (2 min)
   - Navigate to cancellations page
   - Show breakdown by reason
   - Demonstrate time range filters
   - Show charts (pie + bar)

3. **Product Performance** (2 min)
   - Switch to product performance tab
   - Show table and chart views
   - Filter by time range
   - Export to CSV

4. **Team Management** (1 min)
   - Show operator performance metrics
   - Demonstrate invite flow

5. **Delivery Integration** (1 min)
   - Show configured providers
   - Sync status
   - Provider configuration

6. **Analytics Deep Dive** (2 min)
   - Global metrics with trends
   - Operator feedback summary
   - Export analytics

## 🔧 Customization

### Change Order Volume

Edit `seed_demo_data.js` line ~234:
```javascript
const ordersPerDay = Math.floor(Math.random() * 15) + 10; // 10-25 orders/day
```

### Change Status Distribution

Edit `seed_demo_data.js` lines ~239-256:
```javascript
if (rand < 0.50) {        // 50% confirmed
  status = 'confirmed';
} else if (rand < 0.65) { // 15% shipped
  status = 'shipped';
}
// ... etc
```

### Add More Products

Add product objects to the products array starting at line ~48.

## 🧹 Reset Demo Data

```bash
# Connect to MongoDB
mongosh confirmed_db

# Drop all collections
db.users.drop()
db.shops.drop()
db.products.drop()
db.orders.drop()
db.humanfeedback.drop()
db.aifeedback.drop()
db.deliveryproviders.drop()
db.teammembers.drop()
db.activitylogs.drop()
db.complaints.drop()

# Run seed script again
exit
mongosh confirmed_db < seed_demo_data.js
```

## 📊 Expected Data Counts

After successful seeding:

```javascript
db.users.countDocuments()              // 4
db.shops.countDocuments()              // 3
db.products.countDocuments()           // 10
db.orders.countDocuments()             // 400-500
db.humanfeedback.countDocuments()      // 50
db.aifeedback.countDocuments()         // 100
db.deliveryproviders.countDocuments()  // 2
db.teammembers.countDocuments()        // 4
db.activitylogs.countDocuments()       // 50
db.complaints.countDocuments()         // 30
```

## 🐛 Troubleshooting

### Script fails with "duplicate key error"
**Solution**: Drop collections first, then run script again

### No data appears in UI
**Solution**: Make sure you're logged in as owner@techstore.tn

### Can't login
**Solution**: Make sure you ran the password hash update commands

### Orders not showing
**Solution**: Check that you're viewing the correct shop (TechStore Tunisia)

## 📁 Files Included

- `seed_demo_data.js` - Main seed script (self-contained)
- `generate_password_hash.js` - Password hash generator
- `get_database_ids.js` - ID extraction helper (legacy, not needed)
- `DEMO_DATA_SETUP_GUIDE.md` - Detailed setup guide
- `DEMO_SETUP_README.md` - This file

## ✅ Success Checklist

- [ ] Ran seed_demo_data.js successfully
- [ ] Generated password hashes with generate_password_hash.js
- [ ] Updated passwords in MongoDB
- [ ] Logged in as shop owner
- [ ] Verified all widgets show data
- [ ] Tested time range filters
- [ ] Tested data export
- [ ] Ready to record!

## 🎉 You're Ready!

Your demo environment is now fully populated with realistic data. Start your screen recording and showcase the platform!

---

**Need Help?** Check `DEMO_DATA_SETUP_GUIDE.md` for detailed instructions.
