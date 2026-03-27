# User Guide - Client Panel Enhancements

## Welcome to Your Enhanced Client Panel! 🎉

This guide will help you navigate and use all the new features added to your shop management dashboard.

---

## Table of Contents

1. [Team Management](#1-team-management)
2. [Delivery Company Integration](#2-delivery-company-integration)
3. [Language Settings](#3-language-settings)
4. [Product Image Management](#4-product-image-management)
5. [AI Score System](#5-ai-score-system)
6. [Interactive Dashboard Widgets](#6-interactive-dashboard-widgets)
7. [Operator Feedback](#7-operator-feedback)
8. [Analytics & Reports](#8-analytics--reports)
9. [Cancelled Orders Analysis](#9-cancelled-orders-analysis)
10. [Product Performance Tracking](#10-product-performance-tracking)

---

## 1. Team Management

### Overview
Manage your team members with a professional invitation system. Add operators, managers, and admins to help run your shop.

### Accessing Team Management
1. Log in to your shop owner dashboard
2. Click **"Team"** in the sidebar
3. You'll see two tabs:
   - **Mon équipe** (My Team): All team members
   - **Opérateurs** (Operators): Confirmed operators only

### Inviting Team Members

**Step 1**: Click the **"Invite Team Member"** button

**Step 2**: Fill in the invitation form:
- **Email**: Enter the team member's email address
- **Role**: Select from:
  - **Operator**: Handles order confirmations and customer calls
  - **Manager**: Manages operations and team
  - **Admin**: Full access to all features

**Step 3**: Click **"Send Invitation"**

The team member will receive an email with an invitation link.

### Invitation Status

Team members can have three statuses:

- 🟡 **Invited**: Invitation sent, awaiting response
- 🟠 **Pending**: Invitation accepted, account being set up
- 🟢 **Confirmed**: Active team member

### Managing Team Members

**View Team Member Details**:
- Name and email
- Role and status
- Join date
- Performance metrics (for operators)

**Remove Team Member**:
1. Find the team member in the list
2. Click the **"Remove"** button
3. Confirm the action

**Resend Invitation**:
- For invited members, click **"Resend Invitation"** if they didn't receive the email

### Operator Performance Metrics

For confirmed operators, you can see:
- **Total Calls**: Number of calls handled
- **Confirmed Calls**: Successfully confirmed orders
- **Confirmation Rate**: Percentage of successful confirmations
- **Average Call Duration**: Time spent per call
- **Last Call**: When they last handled a call

---

## 2. Delivery Company Integration

### Overview
Connect your shop with delivery providers to automatically sync order statuses and track shipments.

### Accessing Delivery Settings
1. Navigate to **"Delivery Company"** in the sidebar
2. View all configured delivery providers

### Adding a Delivery Provider

**Step 1**: Click **"Add Delivery Provider"**

**Step 2**: Enter provider details:
- **Provider Name**: e.g., "Aramex", "DHL", "FedEx"
- **Provider Type**: Select from supported providers
- **API Endpoint**: Provider's API URL
- **API Key**: Your API key from the provider
- **API Secret**: Your API secret (if required)

**Step 3**: Configure sync settings:
- **Auto Sync**: Enable automatic status updates
- **Sync Interval**: How often to check for updates (in minutes)
- **Supported Regions**: Select regions this provider serves

**Step 4**: Click **"Test Connection"** to verify credentials

**Step 5**: Click **"Save"** to add the provider

### Managing Delivery Providers

**View Provider Status**:
- Last sync time
- Sync status (success/failed)
- Number of orders tracked

**Manual Sync**:
- Click **"Sync Now"** to manually update order statuses

**Edit Provider**:
- Click **"Configure"** to update settings

**Remove Provider**:
- Click **"Remove"** and confirm

### How Delivery Sync Works

1. When an order is shipped, it's linked to a delivery provider
2. The system automatically checks for status updates
3. Order status is updated in real-time:
   - Pending Pickup → Picked Up → In Transit → Out for Delivery → Delivered
4. You and your customers see the latest status

### Troubleshooting

**Sync Failed**:
- Check your API credentials
- Verify the provider's API is online
- Check the error log for details

**Orders Not Updating**:
- Ensure auto-sync is enabled
- Verify the tracking number is correct
- Manually trigger a sync

---

## 3. Language Settings

### Overview
Use the platform in your preferred language: French, English, or Arabic.

### Changing Language

**Method 1: Language Selector**
1. Look for the language selector in the top navigation bar
2. Click on the current language flag
3. Select your preferred language:
   - 🇫🇷 Français (French)
   - 🇬🇧 English
   - 🇸🇦 العربية (Arabic)

**Method 2: Settings Page**
1. Go to **Settings**
2. Find **Language Preferences**
3. Select your language
4. Click **Save**

### Language Features

- **Persistent**: Your choice is saved and remembered
- **Complete Translation**: All menus, buttons, and text are translated
- **RTL Support**: Arabic displays right-to-left automatically
- **Instant Switch**: Changes apply immediately

### Supported Languages

| Language | Code | Direction |
|----------|------|-----------|
| French   | FR   | LTR       |
| English  | EN   | LTR       |
| Arabic   | AR   | RTL       |

---

## 4. Product Image Management

### Overview
Add professional images to your products to improve your catalog's appearance.

### Adding Product Images

**Step 1**: Navigate to **"Products"** in the sidebar

**Step 2**: Find the product you want to add an image to

**Step 3**: Click **"Upload Image"** or drag and drop an image

**Step 4**: Select an image file:
- **Supported formats**: JPEG, PNG, WebP, GIF
- **Maximum size**: 5MB
- **Recommended size**: 800x800 pixels

**Step 5**: Preview the image and click **"Upload"**

### Image Requirements

✅ **Supported**:
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- GIF (.gif)

❌ **Not Supported**:
- BMP, TIFF, SVG
- Files over 5MB
- Corrupted files

### Managing Product Images

**Replace Image**:
1. Click on the current image
2. Upload a new image
3. The old image is automatically replaced

**Remove Image**:
1. Click the **"Remove Image"** button
2. Confirm the action
3. A placeholder image will be shown

### Image Display

- **Product List**: Thumbnail images
- **Product Details**: Full-size images
- **Orders**: Product images shown in order items
- **Fallback**: If an image fails to load, a placeholder is shown

### Tips for Best Results

- Use high-quality images with good lighting
- Keep backgrounds simple and clean
- Show the product clearly
- Use consistent image sizes across products
- Compress images before uploading to reduce file size

---

## 5. AI Score System

### Overview
Every order receives an AI Score (0-100) that predicts the likelihood of successful confirmation. Use this to prioritize high-risk orders.

### Understanding AI Scores

**Score Ranges**:
- 🔴 **0-39 (High Risk)**: Requires immediate attention
- 🟠 **40-70 (Medium Risk)**: Standard processing
- 🟢 **71-100 (Low Risk)**: Likely to confirm

### What Influences AI Score?

The AI considers multiple factors:
- **Customer History**: Previous orders and behavior
- **Order Value**: Price point and items
- **Region**: Delivery location patterns
- **Time of Day**: When the order was placed
- **Payment Method**: Payment type used
- **Product Type**: Items in the order

### Using AI Scores

**In Orders List**:
1. Navigate to **"Orders"**
2. See the **AI Score** column
3. Orders are color-coded by risk level

**Sorting by AI Score**:
1. Click the **AI Score** column header
2. Sort ascending (high risk first) or descending (low risk first)

**Filtering by AI Score**:
1. Use the AI Score filter slider
2. Set minimum and maximum scores
3. View only orders in that range

### Best Practices

**High Risk Orders (0-39)**:
- ✅ Call these customers first
- ✅ Verify customer details carefully
- ✅ Offer reassurance about product quality
- ✅ Be prepared with answers to common concerns

**Medium Risk Orders (40-70)**:
- ✅ Follow standard confirmation process
- ✅ Be friendly and professional
- ✅ Address any questions promptly

**Low Risk Orders (71-100)**:
- ✅ Quick confirmation process
- ✅ Focus on upselling opportunities
- ✅ Build customer loyalty

### AI Score Details

Click on an order to see:
- Detailed score breakdown
- Risk factors identified
- Recommendations for confirmation
- Historical data used

---

## 6. Interactive Dashboard Widgets

### Overview
Your dashboard widgets are now clickable! Click any widget to see detailed analytics and insights.

### Available Widgets

**Orders Received**:
- Click to see: Full order list with filters
- Details: Order timeline, status distribution, hourly trends

**Orders Confirmed**:
- Click to see: Confirmed orders with operator details
- Details: Confirmation rates, operator performance, time to confirm

**Revenue**:
- Click to see: Revenue breakdown and trends
- Details: By product, by region, by time period, payment methods

**Delivery Success**:
- Click to see: Delivery performance metrics
- Details: Success rates by region, delivery times, courier performance

**Cancelled Orders**:
- Click to see: Cancellation analysis
- Details: Reasons, trends, patterns

### Using Widget Details

**Navigation**:
1. Click any widget on the dashboard
2. View detailed page with charts and data
3. Use breadcrumb navigation to return

**Time Range Selection**:
- Today
- Yesterday
- Last 7 days
- Last 30 days
- Custom range

**Filters**:
- Filter by status, region, product, operator
- Combine multiple filters
- Save favorite filter combinations

**Export Data**:
- Click **"Export"** button
- Choose CSV or PDF format
- Download for offline analysis

---

## 7. Operator Feedback

### Overview
Feedback is now clearly separated between human operators and AI analysis, making it easier to evaluate both sources.

### Viewing Feedback

**In Order Details**:
1. Open any order
2. Scroll to the **Feedback** section
3. See two separate sections:
   - **Human Feedback** (blue)
   - **AI Feedback** (purple)

### Human Feedback

**What You'll See**:
- Operator name and photo
- Rating (1-5 stars)
- Tags (e.g., "polite customer", "price concern")
- Detailed notes from the operator
- Timestamp

**Example**:
```
👤 John Doe (Operator)
⭐⭐⭐⭐ 4/5
🏷️ polite customer, price concern
📝 "Customer was very polite but concerned about the price. 
    I offered a 10% discount and they confirmed the order."
🕐 Jan 25, 2024 at 10:30 AM
```

### AI Feedback

**What You'll See**:
- AI confidence score (0-100)
- Automated tags
- AI reasoning and analysis
- Risk factors identified
- Timestamp

**Example**:
```
🤖 AI Analysis
📊 Confidence: 85%
🏷️ repeat buyer, high value, low risk
💡 "Customer has 5 previous successful orders with an 
    average value of $150. No returns or complaints."
⚠️ Risk Factors: None
🕐 Jan 25, 2024 at 9:00 AM
```

### Filtering Feedback

**Filter Options**:
- **All**: Show both human and AI feedback
- **Human Only**: Show only operator feedback
- **AI Only**: Show only AI analysis

**How to Filter**:
1. Click the filter dropdown
2. Select your preference
3. View filtered feedback

### Using Feedback Effectively

**For Training**:
- Review operator feedback for quality
- Identify common customer concerns
- Share best practices with team

**For Improvement**:
- Compare human and AI assessments
- Identify patterns in customer behavior
- Adjust confirmation strategies

**For Quality Control**:
- Ensure operators are providing detailed feedback
- Verify AI predictions against actual outcomes
- Refine processes based on insights

---

## 8. Analytics & Reports

### Overview
Access comprehensive analytics to understand your business performance and identify improvement opportunities.

### Accessing Analytics

1. Click **"Feedback & Analytics"** in the sidebar
2. View the analytics dashboard

### Available Analytics

#### Global Metrics

**Order Metrics**:
- Total orders received
- Confirmation rate
- Average order value
- Cancellation rate

**Revenue Metrics**:
- Total revenue
- Revenue by product
- Revenue by region
- Revenue trends

**Delivery Metrics**:
- Delivery success rate
- Average delivery time
- Delivery by region
- Courier performance

#### Operator Feedback Summary

**Performance Metrics**:
- Total feedback entries
- Average rating
- Top feedback tags
- Trend over time

**Operator Comparison**:
- Individual operator ratings
- Calls handled vs. confirmed
- Average call duration
- Performance trends

### Time Range Selection

**Preset Ranges**:
- Today
- Yesterday
- Last 7 days
- Last 30 days
- This month
- Last month

**Custom Range**:
1. Click **"Custom Range"**
2. Select start date
3. Select end date
4. Click **"Apply"**

### Charts and Visualizations

**Line Charts**: Show trends over time
**Bar Charts**: Compare categories
**Pie Charts**: Show distribution
**Tables**: Detailed data view

### Exporting Analytics

**Export Options**:
1. Click **"Export Data"**
2. Choose what to include:
   - ✅ Global metrics
   - ✅ Operator feedback
   - ✅ Cancellations
   - ✅ Product performance
3. Select format (CSV or PDF)
4. Click **"Download"**

**CSV Format**: For Excel/Google Sheets analysis
**PDF Format**: For reports and presentations

### Using Analytics for Business Decisions

**Identify Trends**:
- Are orders increasing or decreasing?
- Which products are selling best?
- What times of day are busiest?

**Optimize Operations**:
- Which operators need training?
- What are common cancellation reasons?
- Where are delivery issues occurring?

**Improve Confirmation Rates**:
- What feedback tags appear most?
- Which regions have lower confirmation rates?
- What price points have issues?

---

## 9. Cancelled Orders Analysis

### Overview
Understand why orders are cancelled and take action to reduce cancellation rates.

### Accessing Cancellation Analysis

**Method 1**: Click the **"Cancelled Orders"** widget on the dashboard

**Method 2**: Navigate to **"Orders"** → **"Cancelled"** tab

### Cancellation Dashboard

**Summary View**:
- Total cancelled orders
- Cancellation rate (%)
- Top cancellation reasons
- Trend over time

### Cancellation Reasons

Orders can be cancelled for various reasons:

| Reason | Description |
|--------|-------------|
| **Customer Refused** | Customer declined the order |
| **Price Too High** | Customer found price unacceptable |
| **Quality Doubts** | Customer had concerns about quality |
| **Duplicate Order** | Customer ordered by mistake |
| **Fake Number** | Invalid contact information |
| **Not Available** | Product out of stock |
| **Courier Failed** | Delivery issues |
| **Rejected at Door** | Customer refused delivery |

### Analyzing Cancellations

**Reason Breakdown**:
- See percentage of each cancellation reason
- Identify most common issues
- Compare to previous periods

**Trend Analysis**:
- View cancellations over time
- Identify patterns (day of week, time of day)
- Spot seasonal trends

**Regional Analysis**:
- Which regions have higher cancellation rates?
- Are certain areas problematic?
- Adjust strategies by region

### Filtering Cancellations

**By Date Range**:
1. Select start and end dates
2. View cancellations in that period

**By Reason**:
1. Select one or more reasons
2. View only those cancellations

**By Region**:
1. Select regions
2. View regional cancellations

### Taking Action

**For "Price Too High"**:
- ✅ Review pricing strategy
- ✅ Offer discounts or promotions
- ✅ Highlight value and quality
- ✅ Compare with competitor prices

**For "Quality Doubts"**:
- ✅ Improve product descriptions
- ✅ Add more product images
- ✅ Include customer reviews
- ✅ Offer quality guarantees

**For "Customer Refused"**:
- ✅ Improve operator training
- ✅ Call at better times
- ✅ Be more persuasive
- ✅ Address concerns proactively

**For "Courier Failed"**:
- ✅ Review delivery provider performance
- ✅ Consider alternative couriers
- ✅ Improve address verification
- ✅ Offer flexible delivery options

---

## 10. Product Performance Tracking

### Overview
Track which products are performing well and which need attention.

### Accessing Product Performance

1. Navigate to **"Products"** in the sidebar
2. Click the **"Performance"** tab

### Performance Metrics

For each product, you'll see:

**Sales Metrics**:
- **Sales Volume**: Number of units sold
- **Revenue**: Total money earned
- **Trend**: Up, down, or stable

**Quality Metrics**:
- **Return Count**: Number of returns
- **Return Rate**: Percentage of sales returned
- **Average AI Score**: Average risk score for orders

**Performance Indicators**:
- 🌟 **Top Performer**: Top 10% by revenue
- ⚠️ **Underperforming**: High return rate or low AI score

### Sorting Products

Click any column header to sort:
- **Sales Volume**: See best sellers
- **Revenue**: See most profitable
- **Return Rate**: See problem products
- **AI Score**: See risky products

### Filtering Products

**By Performance**:
- Top performers only
- Underperforming only
- All products

**By Time Range**:
- Last 7 days
- Last 30 days
- Last 3 months
- Custom range

### Product Performance Details

Click on any product to see:
- Sales trend chart
- Revenue over time
- Return reasons
- Customer feedback
- AI score distribution

### Taking Action

**For Top Performers** 🌟:
- ✅ Increase inventory
- ✅ Feature in promotions
- ✅ Create similar products
- ✅ Upsell to customers

**For Underperformers** ⚠️:
- ✅ Investigate return reasons
- ✅ Improve product quality
- ✅ Update descriptions/images
- ✅ Consider discontinuing
- ✅ Adjust pricing

**For High Return Rates**:
- ✅ Review product quality
- ✅ Check if description is accurate
- ✅ Verify sizing/specifications
- ✅ Improve packaging

**For Low AI Scores**:
- ✅ Understand why orders are risky
- ✅ Improve product presentation
- ✅ Add customer reviews
- ✅ Offer guarantees

### Exporting Performance Data

1. Click **"Export Performance"**
2. Select time range
3. Choose format (CSV or PDF)
4. Download for analysis

**Use Cases**:
- Share with suppliers
- Plan inventory
- Create reports for stakeholders
- Analyze in Excel/Google Sheets

---

## Tips for Success

### Daily Routine

**Morning**:
1. Check dashboard for overnight orders
2. Review high-risk orders (AI Score < 40)
3. Assign orders to operators
4. Check delivery provider sync status

**During the Day**:
1. Monitor confirmation rates
2. Review operator feedback
3. Address cancellations promptly
4. Respond to customer concerns

**Evening**:
1. Review daily performance
2. Check analytics for trends
3. Plan for tomorrow
4. Export reports if needed

### Weekly Tasks

1. Review team performance
2. Analyze cancellation trends
3. Check product performance
4. Update inventory based on sales
5. Review and respond to feedback

### Monthly Tasks

1. Generate comprehensive reports
2. Review and adjust strategies
3. Train team on improvements
4. Optimize delivery providers
5. Plan promotions based on data

---

## Troubleshooting

### Common Issues

**Can't See New Features**:
- Clear browser cache
- Log out and log back in
- Check your subscription plan
- Contact support

**Images Not Uploading**:
- Check file size (max 5MB)
- Verify file format (JPEG, PNG, WebP, GIF)
- Try a different browser
- Check internet connection

**Delivery Sync Not Working**:
- Verify API credentials
- Check provider's API status
- Review error logs
- Contact delivery provider

**Analytics Not Loading**:
- Check date range selection
- Verify you have data for that period
- Try a different time range
- Refresh the page

---

## Getting Help

### Support Channels

**Email**: support@confirmed.com
**Phone**: +212 XXX-XXXX
**Live Chat**: Available in dashboard (bottom right)
**Documentation**: https://docs.confirmed.com

### Before Contacting Support

1. Check this user guide
2. Try clearing browser cache
3. Note any error messages
4. Take screenshots if helpful
5. Note the steps to reproduce the issue

---

## Keyboard Shortcuts

Speed up your workflow with these shortcuts:

| Shortcut | Action |
|----------|--------|
| `Ctrl + K` | Quick search |
| `Ctrl + /` | Show shortcuts |
| `Ctrl + D` | Go to dashboard |
| `Ctrl + O` | Go to orders |
| `Ctrl + P` | Go to products |
| `Ctrl + T` | Go to team |
| `Ctrl + A` | Go to analytics |
| `Esc` | Close modal/dialog |

---

## What's Next?

We're constantly improving the platform. Upcoming features:
- Mobile app for on-the-go management
- Advanced AI predictions
- Automated marketing campaigns
- Customer loyalty program
- Multi-store management

---

**Thank you for using Confirmed!** 🎉

We're here to help you succeed. If you have any questions or feedback, please don't hesitate to reach out.

**Last Updated**: January 25, 2024
