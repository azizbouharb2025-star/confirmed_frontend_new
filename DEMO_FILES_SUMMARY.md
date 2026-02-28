# Demo Data Files Summary

This document explains all the demo data setup files and how to use them.

## 📁 Files Overview

### Main Files

| File | Purpose | When to Use |
|------|---------|-------------|
| `seed_demo_data.js` | Complete seed script with users, shops, and demo data | **Always use this** - it's self-contained |
| `generate_password_hash.js` | Generates bcrypt hashes for user passwords | After running seed script |
| `DEMO_SETUP_README.md` | Quick start guide | **Start here** for setup instructions |
| `DEMO_DATA_SETUP_GUIDE.md` | Detailed setup guide with troubleshooting | For detailed information |

### Helper Scripts

| File | Purpose | Platform |
|------|---------|----------|
| `setup_demo.bat` | Automated setup script | Windows |
| `setup_demo.sh` | Automated setup script | Linux/Mac |

### Legacy Files (Not Needed)

| File | Purpose | Status |
|------|---------|--------|
| `get_database_ids.js` | Extracts IDs from existing database | ❌ Not needed - seed script is self-contained |
| `seed_data.js` | Old seed script with hardcoded IDs | ❌ Replaced by seed_demo_data.js |

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

**Windows:**
```bash
setup_demo.bat
```

**Linux/Mac:**
```bash
chmod +x setup_demo.sh
./setup_demo.sh
```

### Option 2: Manual Setup

1. **Run seed script:**
   ```bash
   mongosh confirmed_db < seed_demo_data.js
   ```

2. **Generate password hashes:**
   ```bash
   npm install bcryptjs
   node generate_password_hash.js
   ```

3. **Copy the output commands and run them in mongosh**

4. **Login with:** owner@techstore.tn

## 📋 What Gets Created

### Users (4 total)
- **Admin**: admin@confirmed.tn
- **Shop Owner**: owner@techstore.tn (use this for demo)
- **Operator 1**: ahmed.hassan@techstore.tn
- **Operator 2**: fatima.zahra@techstore.tn

### Shops (3 total)
- TechStore Tunisia (main shop for demo)
- ElectroShop
- GadgetHub

### Demo Data
- 10 products
- 400-500 orders (30 days history)
- 50 human feedback entries
- 100 AI feedback entries
- 2 delivery providers
- 4 team members
- 50 activity logs
- 30 complaints

## 🎯 File Usage Guide

### For First-Time Setup

1. Read `DEMO_SETUP_README.md`
2. Run `setup_demo.bat` (Windows) or `setup_demo.sh` (Linux/Mac)
3. Follow the on-screen instructions

### For Manual Setup

1. Read `DEMO_DATA_SETUP_GUIDE.md`
2. Run `seed_demo_data.js` manually
3. Run `generate_password_hash.js`
4. Update passwords in MongoDB

### For Troubleshooting

1. Check `DEMO_DATA_SETUP_GUIDE.md` - Troubleshooting section
2. Verify collection counts
3. Check MongoDB logs

## 🔄 Reset Demo Data

To start fresh:

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

# Exit and run seed script again
exit
```

Then run the setup script again.

## 📊 Verify Setup

After setup, verify with these commands in mongosh:

```javascript
// Should return 4
db.users.countDocuments()

// Should return 3
db.shops.countDocuments()

// Should return 10
db.products.countDocuments()

// Should return 400-500
db.orders.countDocuments()

// List all users
db.users.find({}, { email: 1, role: 1, firstName: 1, lastName: 1 }).pretty()

// List all shops
db.shops.find({}, { name: 1, domain: 1 }).pretty()
```

## 🎬 Recording Your Demo

### Preparation Checklist

- [ ] Run seed script successfully
- [ ] Set all user passwords
- [ ] Login as shop owner (owner@techstore.tn)
- [ ] Verify all widgets show data
- [ ] Test time range filters
- [ ] Test data export features
- [ ] Prepare demo script/talking points

### Recommended Demo Flow

1. **Dashboard Overview** (2 min)
   - Orders received, confirmed, delivery success
   - Cancelled orders widget

2. **Cancellations Analysis** (2 min)
   - Detailed breakdown
   - Time filters
   - Charts

3. **Product Performance** (2 min)
   - Table/chart views
   - Export to CSV

4. **Team Management** (1 min)
   - Operator metrics
   - Invite flow

5. **Delivery Integration** (1 min)
   - Provider status
   - Configuration

6. **Analytics** (2 min)
   - Global metrics
   - Operator feedback
   - Export

## 🆘 Getting Help

### Common Issues

**"mongosh not found"**
- Install MongoDB Shell: https://www.mongodb.com/try/download/shell

**"bcryptjs not found"**
- Run: `npm install bcryptjs`

**"Can't login"**
- Make sure you ran the password update commands
- Check that passwords were hashed correctly

**"No data in UI"**
- Verify you're logged in as owner@techstore.tn
- Check collection counts in MongoDB
- Verify you're viewing TechStore Tunisia shop

### Support Resources

1. `DEMO_SETUP_README.md` - Quick start guide
2. `DEMO_DATA_SETUP_GUIDE.md` - Detailed guide with troubleshooting
3. MongoDB logs: Check for connection/authentication errors
4. Browser console: Check for API errors

## 📝 Notes

- **Self-Contained**: `seed_demo_data.js` creates everything - no need to update IDs
- **Fresh Start**: Script drops existing users and shops collections
- **Production**: Change passwords before deploying to production
- **Customization**: Edit seed script to adjust data volume and distribution

## ✅ Success Indicators

You're ready to record when:

- ✅ All collection counts match expected values
- ✅ Can login as shop owner
- ✅ Dashboard shows all widgets with data
- ✅ Time range filters work
- ✅ Data export works
- ✅ All pages load without errors

---

**Happy Demo Recording! 🎥**
