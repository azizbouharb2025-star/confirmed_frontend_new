# Demo Data Setup Guide

This guide will help you populate your MongoDB database with realistic demo data that matches all the mock data structures used throughout the Confirmed platform.

## 📋 Prerequisites

1. MongoDB installed and running on your VPS
2. Access to `mongosh` (MongoDB Shell)
3. Your database name (default: `confirmed_db`)
4. Database credentials (if authentication is enabled)

## ✨ NEW: Self-Contained Script

The `seed_demo_data.js` script is now **completely self-contained**! It will:
- Create all necessary users (admin, shop owner, operators)
- Create shops
- Generate all demo data automatically
- No need to manually update IDs!

## 🎯 What Data Will Be Created

The seed script creates realistic demo data for:

### Users & Authentication
- **1 Admin User** - admin@confirmed.tn
- **1 Shop Owner** - owner@techstore.tn
- **2 Operators** - ahmed.hassan@techstore.tn, fatima.zahra@techstore.tn

### Shops
- **3 Shops** - TechStore Tunisia, ElectroShop, GadgetHub

### Core Collections
- **Products** (10 items) - Electronics and accessories with realistic pricing
- **Orders** (400-500 orders) - 30 days of order history with various statuses
- **Human Feedback** (50 entries) - Operator feedback with ratings and tags
- **AI Feedback** (100 entries) - AI analysis with risk scores and recommendations

### Feature-Specific Collections
- **Delivery Providers** (2 providers) - Aramex and DHL with sync status
- **Team Members** (4 members) - 2 operators, 1 manager, 1 pending invite
- **Activity Logs** (50 entries) - Recent system activities
- **Complaints** (30 entries) - Customer complaints with categories

### Order Status Distribution
- **50%** Confirmed orders
- **15%** Shipped orders
- **10%** Delivered orders
- **15%** Pending orders
- **7%** Cancelled orders (with various cancellation reasons)
- **3%** Rejected orders

### Cancellation Reasons Included
- `customer_refused` - Customer refused delivery
- `price_too_high` - Price concerns
- `quality_doubts` - Quality concerns
- `duplicate_order` - Duplicate order
- `fake_number` - Invalid phone number
- `not_available` - Product not available
- `courier_failed` - Courier delivery failure
- `customer_rejected_at_door` - Rejected at delivery

## 🚀 Quick Start (3 Simple Steps!)

### Step 1: Run the Seed Script

That's it! Just run the script - no configuration needed:

#### Option A: Without Authentication
```bash
mongosh confirmed_db < seed_demo_data.js
```

#### Option B: With Authentication
```bash
mongosh "mongodb://username:password@localhost:27017/confirmed_db" < seed_demo_data.js
```

#### Option C: Remote Database
```bash
mongosh "mongodb://username:password@your-vps-ip:27017/confirmed_db" < seed_demo_data.js
```

### Step 2: Set User Passwords

The script creates users with placeholder passwords. You need to hash and update them:

```javascript
// Connect to MongoDB
mongosh confirmed_db

// Update admin password (use bcrypt hash)
db.users.updateOne(
  { email: 'admin1@confirmed.tn' },
  { $set: { password: '$2b$10$97305e86f36b830a36ac7dc722ac570a3a66e3b10bd981125a8c7' } }
)

// Update shop owner password
db.users.updateOne(
  { email: 'owner@techstore.tn' },
  { $set: { password: '$2b$10$97305e86f36b830a36ac7dc722ac570a3a66e3b10bd981125a8c7' } }
)

// Update operator passwords
db.users.updateOne(
  { email: 'ahmed.hassan@techstore.tn' },
  { $set: { password: '$2b$10$97305e86f36b830a36ac7dc722ac570a3a66e3b10bd981125a8c7' } }
)

db.users.updateOne(
  { email: 'fatima.zahra@techstore.tn' },
  { $set: { password: '$2b$10$97305e86f36b830a36ac7dc722ac570a3a66e3b10bd981125a8c7' } }
)
```

**Generate bcrypt hashes online** or use Node.js:
```javascript
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('your-password', 10);
console.log(hash);
```

### Step 3: Verify the Data

After running the script, verify the data was created:

```javascript
// Check users
db.users.countDocuments()  // Should be 4

// Check shops
db.shops.countDocuments()  // Should be 3

// Check products
db.products.countDocuments()  // Should be 10

// Check orders
db.orders.countDocuments()    // Should be 400-500

// Check feedback
db.humanfeedback.countDocuments()  // Should be 50
db.aifeedback.countDocuments()     // Should be 100

// Check team members
db.teammembers.countDocuments()    // Should be 4

// Check delivery providers
db.deliveryproviders.countDocuments()  // Should be 2

// Check complaints
db.complaints.countDocuments()     // Should be 30

// Check activity logs
db.activitylogs.countDocuments()   // Should be 50
```

## 🔑 Login Credentials

After setting passwords, you can log in with these accounts:

### Admin Account
- **Email**: admin@confirmed.tn
- **Password**: (the one you set)
- **Access**: Full system administration

### Shop Owner Account
- **Email**: owner@techstore.tn
- **Password**: (the one you set)
- **Access**: Client dashboard, all shop features
- **Shop**: TechStore Tunisia

### Operator Accounts
- **Operator 1**:
  - Email: ahmed.hassan@techstore.tn
  - Performance: 77% confirmation rate, 145 calls
  
- **Operator 2**:
  - Email: fatima.zahra@techstore.tn
  - Performance: 84% confirmation rate, 98 calls

## 📊 What You'll See in the Demo

### Client Dashboard (Shop Owner)
- **Orders Received Widget**: 400-500 total orders
- **Orders Confirmed Widget**: ~50% confirmation rate
- **Delivery Success Widget**: ~75% delivery success
- **Cancelled Orders Widget**: Top cancellation reasons with trends
- **Product Performance Tab**: 10 products with sales, revenue, and return data
- **Team Management**: 2 active operators with performance metrics
- **Delivery Company Panel**: 2 providers (1 active, 1 inactive)

### Analytics Page
- **Global Metrics**: Order volume, confirmation rates, revenue trends
- **Operator Feedback**: Average ratings, top tags, trend data
- **Time Range Filters**: Today, Yesterday, 7 days, 30 days

### Cancellations Analysis
- **Total Cancelled**: ~7% of orders
- **Top Reasons**: Customer refused, price too high, quality doubts
- **Trend Data**: Up/down/stable trends for each reason
- **Charts**: Pie chart and bar chart visualizations

### Product Performance
- **10 Products**: Wireless Headphones, Smart Watch, Laptop Stand, etc.
- **Metrics**: Sales volume, revenue, return rate, AI score
- **Top Performers**: Highlighted based on revenue
- **Underperforming**: Flagged based on return rate and AI score

### Team Management
- **2 Active Operators**: Ahmed Hassan (77% confirmation) and Fatima Zahra (84% confirmation)
- **1 Manager**: Youssef Alami
- **1 Pending Invite**: newoperator@example.com
- **Performance Metrics**: Total calls, confirmation rate, avg call duration

### Feedback Display
- **Human Feedback**: 50 entries with ratings (3-5 stars), tags, and notes
- **AI Feedback**: 100 entries with risk scores, confidence levels, and recommendations
- **Filter Options**: All, Human only, AI only

## 🔧 Customization Options

### Adjust Order Volume
To change the number of orders per day, edit line 234:

```javascript
const ordersPerDay = Math.floor(Math.random() * 15) + 10; // Change these numbers
```

### Adjust Status Distribution
To change order status percentages, edit lines 239-256:

```javascript
if (rand < 0.50) {        // 50% confirmed (change 0.50)
  status = 'confirmed';
} else if (rand < 0.65) { // 15% shipped (change 0.65)
  status = 'shipped';
}
// ... etc
```

### Add More Products
Add more product objects to the products array starting at line 48.

### Add More Operators
Add more team member objects to the teammembers array starting at line 398.

## 🎬 Recording Your Demo

### Recommended Demo Flow

1. **Start with Dashboard Overview**
   - Show total orders, confirmation rate, delivery success
   - Highlight the cancelled orders widget

2. **Navigate to Cancellations Analysis**
   - Show the detailed breakdown by reason
   - Demonstrate time range filters
   - Show pie and bar charts

3. **Show Product Performance**
   - Switch between table and chart views
   - Filter by time range
   - Export data to CSV

4. **Demonstrate Team Management**
   - Show operator performance metrics
   - Invite a new team member
   - Show pending invitations

5. **Show Delivery Company Integration**
   - Display configured providers
   - Show sync status
   - Demonstrate provider configuration

6. **Analytics Deep Dive**
   - Global metrics with trends
   - Operator feedback summary
   - Export analytics data

## 🧹 Cleaning Up

To remove all demo data and start fresh:

```javascript
// Connect to MongoDB
mongosh "mongodb://username:password@localhost:27017/confirmed_db"

// Drop all collections
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

// Then run the seed script again
```

## ⚠️ Important Notes

1. **Backup First**: Always backup your database before running seed scripts
2. **Fresh Start**: The script drops existing users and shops collections
3. **Password Security**: Use strong bcrypt hashes for production
4. **Indexes**: The script creates indexes automatically for better performance
5. **Data Consistency**: All relationships are properly linked

## 🐛 Troubleshooting

### Error: "Cannot read property '_id' of undefined"
- **Cause**: Script interrupted before completion
- **Solution**: Drop all collections and run the script again

### Error: "E11000 duplicate key error"
- **Cause**: Running the script multiple times without cleaning up
- **Solution**: Drop the collections first (see Cleaning Up section)

### No data appears in the UI
- **Cause**: Not logged in with the correct user
- **Solution**: Log in with owner@techstore.tn (shop owner account)

### Orders not showing for operators
- **Cause**: Operators not properly linked to shop
- **Solution**: Check teammembers collection has correct shopId and userId

### Can't log in with created accounts
- **Cause**: Passwords not updated with proper bcrypt hashes
- **Solution**: Follow Step 2 to set proper password hashes

## 📞 Support

If you encounter issues:
1. Check MongoDB logs: `tail -f /var/log/mongodb/mongod.log`
2. Verify database connection: `mongosh --eval "db.adminCommand('ping')"`
3. Check collection counts to see what was created
4. Review the script output for any error messages

## ✅ Success Checklist

- [ ] Backed up existing database (if any)
- [ ] Ran seed_demo_data.js successfully
- [ ] Updated all user passwords with bcrypt hashes
- [ ] Verified collection counts
- [ ] Logged into frontend with shop owner account (owner@techstore.tn)
- [ ] Confirmed data appears in all widgets
- [ ] Tested time range filters
- [ ] Tested data export features
- [ ] Ready to record demo!

---

**Happy Demo Recording! 🎥**
