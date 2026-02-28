# 🎬 Demo Recording Checklist

Use this checklist to ensure your demo environment is ready.

## ✅ Pre-Setup

- [ ] MongoDB is installed and running
- [ ] mongosh (MongoDB Shell) is installed
- [ ] Node.js is installed (for password generation)
- [ ] Backed up existing database (if any)

## ✅ Setup Steps

- [ ] Ran `seed_demo_data.js` successfully
  ```bash
  mongosh confirmed_db < seed_demo_data.js
  ```

- [ ] Generated password hashes
  ```bash
  npm install bcryptjs
  node generate_password_hash.js
  ```

- [ ] Updated passwords in MongoDB (copied commands from output)

- [ ] Verified collection counts:
  - [ ] users: 4
  - [ ] shops: 3
  - [ ] products: 10
  - [ ] orders: 400-500
  - [ ] humanfeedback: 50
  - [ ] aifeedback: 100
  - [ ] deliveryproviders: 2
  - [ ] teammembers: 4
  - [ ] activitylogs: 50
  - [ ] complaints: 30

## ✅ Login & Verification

- [ ] Can login as shop owner (owner@techstore.tn)
- [ ] Dashboard loads without errors
- [ ] All widgets show data:
  - [ ] Orders Received
  - [ ] Orders Confirmed
  - [ ] Delivery Success
  - [ ] Cancelled Orders
- [ ] Product Performance tab shows 10 products
- [ ] Team Management shows 2 operators with metrics
- [ ] Delivery Company panel shows 2 providers

## ✅ Feature Testing

- [ ] Time range filters work (Today, Yesterday, 7 days, 30 days)
- [ ] Cancellations page shows breakdown by reason
- [ ] Charts display correctly (pie chart, bar chart)
- [ ] Product performance table/chart toggle works
- [ ] Data export to CSV works
- [ ] Analytics page loads with metrics
- [ ] Operator feedback displays correctly

## ✅ Demo Preparation

- [ ] Prepared demo script/talking points
- [ ] Screen recording software ready
- [ ] Browser zoom level set appropriately
- [ ] Closed unnecessary browser tabs
- [ ] Disabled browser notifications
- [ ] Cleared browser console
- [ ] Set up microphone (if recording audio)

## 🎯 Demo Flow (10 minutes)

### 1. Dashboard Overview (2 min)
- [ ] Show orders received widget
- [ ] Highlight confirmation rate
- [ ] Show delivery success
- [ ] Point out cancelled orders widget

### 2. Cancellations Analysis (2 min)
- [ ] Navigate to cancellations page
- [ ] Show breakdown by reason
- [ ] Demonstrate time range filters
- [ ] Show pie and bar charts

### 3. Product Performance (2 min)
- [ ] Switch to product performance tab
- [ ] Show table view with metrics
- [ ] Toggle to chart view
- [ ] Filter by time range
- [ ] Export to CSV

### 4. Team Management (1 min)
- [ ] Show operator performance metrics
- [ ] Highlight confirmation rates
- [ ] Show pending invitations

### 5. Delivery Integration (1 min)
- [ ] Show configured providers
- [ ] Point out sync status
- [ ] Show active/inactive states

### 6. Analytics Deep Dive (2 min)
- [ ] Show global metrics with trends
- [ ] Display operator feedback summary
- [ ] Show time range comparisons
- [ ] Export analytics data

## 🎥 Recording Tips

- [ ] Start with a clean browser session
- [ ] Use full screen mode
- [ ] Speak clearly and at moderate pace
- [ ] Pause briefly between sections
- [ ] Highlight key features with cursor
- [ ] Show real data, not just UI
- [ ] Demonstrate interactivity (filters, exports)
- [ ] End with a summary of key benefits

## 🐛 Troubleshooting

If something doesn't work:

- [ ] Check MongoDB is running
- [ ] Verify you're logged in as shop owner
- [ ] Check browser console for errors
- [ ] Verify collection counts in MongoDB
- [ ] Restart the application if needed
- [ ] Clear browser cache if needed

## 📊 Data Highlights to Mention

- **400-500 orders** over 30 days
- **~50% confirmation rate** (realistic)
- **~75% delivery success** rate
- **8 cancellation reasons** tracked
- **10 products** with performance metrics
- **2 operators** with detailed metrics
- **Real-time sync** with delivery providers
- **AI-powered** risk scoring
- **Comprehensive analytics** and exports

## ✅ Post-Recording

- [ ] Review recording for quality
- [ ] Check audio levels
- [ ] Verify all features were shown
- [ ] Edit out any mistakes/pauses
- [ ] Add intro/outro if needed
- [ ] Export in appropriate format
- [ ] Upload to platform
- [ ] Share with stakeholders

## 🎉 You're Ready!

When all items are checked, you're ready to record a professional demo!

---

**Good luck with your demo! 🚀**
