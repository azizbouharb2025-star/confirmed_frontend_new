# Design Document: Client Panel Enhancements

## Overview

This design document outlines the technical implementation for 10 major enhancements to the client panel. The enhancements include team management with invite workflows, delivery company API integration architecture, internationalization (i18n), product image management, AI scoring in orders, clickable dashboard widgets, separated human/AI feedback, analytics section, cancelled orders tracking, and product performance metrics.

The design follows a modular architecture that maintains backward compatibility while adding new capabilities. All features are designed to work with mock data when external APIs are unavailable, ensuring graceful degradation.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Panel (Next.js)                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Team       │  │  Delivery    │  │   Products   │      │
│  │  Management  │  │   Company    │  │  Management  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Orders     │  │  Dashboard   │  │  Analytics   │      │
│  │  (AI Score)  │  │   Widgets    │  │   Section    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                    Services Layer                            │
├─────────────────────────────────────────────────────────────┤
│  teamService  │  deliveryService  │  analyticsService       │
│  i18nService  │  productService   │  feedbackService        │
├─────────────────────────────────────────────────────────────┤
│                    API Routes (Next.js)                      │
├─────────────────────────────────────────────────────────────┤
│  /api/team    │  /api/delivery    │  /api/analytics         │
│  /api/products│  /api/feedback    │  /api/cancellations     │
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture

Each feature is implemented as a self-contained module with:
- **UI Components**: React components for user interface
- **Service Layer**: API communication and business logic
- **Type Definitions**: TypeScript interfaces for type safety
- **State Management**: Zustand stores for client-side state
- **i18n Integration**: Translation keys for all user-facing text

## Components and Interfaces

### 1. Team Management Components

#### TeamManagementPage Component
```typescript
interface TeamManagementPageProps {
  // No props - uses auth context for shop owner ID
}

// Displays two tabs: "Mon équipe" and "Opérateurs"
// Handles invite workflow: Invite → Pending → Confirmed
```

#### TeamMemberCard Component
```typescript
interface TeamMemberCardProps {
  member: TeamMember;
  onStatusChange: (memberId: string, status: TeamMemberStatus) => void;
  onRemove: (memberId: string) => void;
}

// Displays member information in card format
// Shows status badge (Invite/Pending/Confirmed)
// Provides actions based on status
```

#### OperatorCard Component
```typescript
interface OperatorCardProps {
  operator: Operator;
  showPerformanceMetrics: boolean;
}

// Displays confirmed operator information
// Shows performance metrics (calls handled, confirmation rate)
// Used in "Opérateurs" tab
```

#### InviteTeamMemberModal Component
```typescript
interface InviteTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string, role: string) => Promise<void>;
}

// Modal for inviting new team members
// Validates email and role
// Sends invitation email
```

### 2. Delivery Company Integration Components

#### DeliveryCompanyPanel Component
```typescript
interface DeliveryCompanyPanelProps {
  // No props - uses shop context
}

// Displays list of configured delivery providers
// Shows sync status for each provider
// Provides configuration interface
```

#### DeliveryProviderCard Component
```typescript
interface DeliveryProviderCardProps {
  provider: DeliveryProvider;
  onConfigure: (providerId: string) => void;
  onSync: (providerId: string) => Promise<void>;
  onRemove: (providerId: string) => void;
}

// Displays delivery provider information
// Shows last sync timestamp and status
// Provides configuration and sync actions
```

#### DeliveryProviderConfigModal Component
```typescript
interface DeliveryProviderConfigModalProps {
  isOpen: boolean;
  provider: DeliveryProvider | null;
  onClose: () => void;
  onSave: (config: DeliveryProviderConfig) => Promise<void>;
}

// Modal for configuring delivery provider API credentials
// Validates API keys and endpoints
// Tests connection before saving
```

### 3. Internationalization Components

#### LanguageSelector Component
```typescript
interface LanguageSelectorProps {
  currentLanguage: Language;
  onLanguageChange: (language: Language) => void;
}

// Dropdown for selecting language (FR/EN/AR)
// Displays language names in native script
// Persists selection to localStorage
```

#### NavbarWithI18n Component
```typescript
interface NavbarWithI18nProps {
  // Extends existing Navbar component
  // All text uses i18n keys
}

// Enhanced navbar with enlarged logo
// All menu items use translation keys
// Supports RTL layout for Arabic
```

### 4. Product Image Components

#### ProductImageDisplay Component
```typescript
interface ProductImageDisplayProps {
  imageUrl?: string;
  productName: string;
  size: 'small' | 'medium' | 'large';
  showFallback: boolean;
}

// Displays product image with lazy loading
// Shows fallback placeholder on error
// Supports multiple sizes
```

#### ProductImageUpload Component
```typescript
interface ProductImageUploadProps {
  currentImageUrl?: string;
  onUpload: (file: File) => Promise<string>;
  onRemove: () => void;
}

// Drag-and-drop image upload
// Validates file type and size
// Shows preview before upload
// Returns uploaded image URL
```

### 5. AI Score Components

#### AIScoreColumn Component
```typescript
interface AIScoreColumnProps {
  score: number;
  showDetails: boolean;
}

// Displays AI score with color coding
// Red (<40), Orange (40-70), Green (>70)
// Shows tooltip with score breakdown on hover
```

#### AIScoreFilter Component
```typescript
interface AIScoreFilterProps {
  minScore: number;
  maxScore: number;
  onChange: (min: number, max: number) => void;
}

// Dual-range slider for filtering by AI score
// Shows current range values
// Updates order list on change
```

### 6. Clickable Widget Components

#### ClickableWidget Component
```typescript
interface ClickableWidgetProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  detailPageUrl: string;
  trend?: 'up' | 'down' | 'neutral';
  change?: number;
}

// Enhanced MetricCard with click handler
// Navigates to detail page on click
// Shows hover effect and cursor pointer
```

#### WidgetDetailPage Component
```typescript
interface WidgetDetailPageProps {
  widgetType: string;
  timeRange: TimeRange;
}

// Generic detail page for widget data
// Shows expanded metrics and charts
// Includes breadcrumb navigation
// Supports time range filtering
```

### 7. Feedback Separation Components

#### FeedbackDisplay Component
```typescript
interface FeedbackDisplayProps {
  orderId: string;
  humanFeedback?: HumanFeedback[];
  aiFeedback?: AIFeedback[];
  showSource: 'all' | 'human' | 'ai';
}

// Displays feedback with clear visual separation
// Human feedback: operator name, detailed notes
// AI feedback: confidence score, automated tags
// Supports filtering by source
```

#### HumanFeedbackCard Component
```typescript
interface HumanFeedbackCardProps {
  feedback: HumanFeedback;
}

// Displays human operator feedback
// Shows operator avatar and name
// Includes timestamp and detailed notes
// Uses blue/human color scheme
```

#### AIFeedbackCard Component
```typescript
interface AIFeedbackCardProps {
  feedback: AIFeedback;
}

// Displays AI-generated feedback
// Shows confidence score and reasoning
// Includes automated tags
// Uses purple/AI color scheme
```

### 8. Analytics Section Components

#### AnalyticsDashboard Component
```typescript
interface AnalyticsDashboardProps {
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}

// Main analytics dashboard
// Shows operator feedback summary
// Displays global performance metrics
// Includes trend charts
```

#### OperatorFeedbackSummary Component
```typescript
interface OperatorFeedbackSummaryProps {
  data: OperatorFeedbackSummaryData;
  timeRange: TimeRange;
}

// Summary of operator feedback metrics
// Average ratings, common tags
// Trend over time
```

#### GlobalMetricsChart Component
```typescript
interface GlobalMetricsChartProps {
  metrics: GlobalMetrics;
  chartType: 'line' | 'bar' | 'pie';
  timeRange: TimeRange;
}

// Visualizes global metrics
// Order volumes, confirmation rates
// Performance trends
// Supports multiple chart types
```

### 9. Cancelled Orders Components

#### CancelledOrdersWidget Component
```typescript
interface CancelledOrdersWidgetProps {
  totalCancelled: number;
  topReasons: CancellationReasonSummary[];
  onClick: () => void;
}

// Dashboard widget for cancelled orders
// Shows total count and top reasons
// Clickable to navigate to detail page
```

#### CancellationAnalysisPage Component
```typescript
interface CancellationAnalysisPageProps {
  timeRange: TimeRange;
}

// Detailed cancellation analysis
// Breakdown by reason category
// Trend charts over time
// Filterable by date range
```

#### CancellationReasonChart Component
```typescript
interface CancellationReasonChartProps {
  reasons: CancellationReasonData[];
  chartType: 'pie' | 'bar';
}

// Visualizes cancellation reasons
// Shows percentages and counts
// Color-coded by category
```

### 10. Product Performance Components

#### ProductPerformanceTab Component
```typescript
interface ProductPerformanceTabProps {
  shopId: string;
  timeRange: TimeRange;
}

// New tab in Products panel
// Displays performance table
// Supports sorting and filtering
```

#### ProductPerformanceTable Component
```typescript
interface ProductPerformanceTableProps {
  products: ProductPerformance[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (column: string) => void;
}

// Table showing product performance metrics
// Columns: Product, Sales, Revenue, Returns, AI Score
// Highlights top/underperforming products
// Sortable by any column
```

#### ProductPerformanceChart Component
```typescript
interface ProductPerformanceChartProps {
  product: ProductPerformance;
  metric: 'sales' | 'revenue' | 'returns';
  timeRange: TimeRange;
}

// Chart showing product performance over time
// Supports multiple metrics
// Helps identify trends
```

## Data Models

### Team Management Models

```typescript
type TeamMemberStatus = 'invited' | 'pending' | 'confirmed';
type TeamMemberRole = 'operator' | 'manager' | 'admin';

interface TeamMember {
  _id: string;
  shopId: string;
  email: string;
  name?: string;
  role: TeamMemberRole;
  status: TeamMemberStatus;
  invitedAt: string;
  invitedBy: string;
  acceptedAt?: string;
  lastActiveAt?: string;
  performanceMetrics?: OperatorPerformanceMetrics;
}

interface OperatorPerformanceMetrics {
  totalCalls: number;
  confirmedCalls: number;
  confirmationRate: number;
  averageCallDuration: number;
  lastCallAt?: string;
}

interface Operator extends TeamMember {
  status: 'confirmed';
  performanceMetrics: OperatorPerformanceMetrics;
}

interface TeamInvitation {
  _id: string;
  shopId: string;
  email: string;
  role: TeamMemberRole;
  token: string;
  expiresAt: string;
  createdAt: string;
  createdBy: string;
}
```

### Delivery Company Models

```typescript
type DeliveryProviderType = 'aramex' | 'dhl' | 'fedex' | 'custom';
type DeliveryStatus = 
  | 'pending_pickup'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed'
  | 'returned';

interface DeliveryProvider {
  _id: string;
  shopId: string;
  name: string;
  type: DeliveryProviderType;
  apiEndpoint: string;
  apiKey: string; // Encrypted
  apiSecret?: string; // Encrypted
  isActive: boolean;
  lastSyncAt?: string;
  lastSyncStatus?: 'success' | 'failed';
  lastSyncError?: string;
  config: DeliveryProviderConfig;
  createdAt: string;
  updatedAt: string;
}

interface DeliveryProviderConfig {
  webhookUrl?: string;
  autoSync: boolean;
  syncInterval: number; // minutes
  supportedRegions: string[];
  customFields?: Record<string, any>;
}

interface DeliveryStatusUpdate {
  orderId: string;
  trackingNumber: string;
  status: DeliveryStatus;
  location?: string;
  timestamp: string;
  notes?: string;
  providerId: string;
}
```

### Internationalization Models

```typescript
type Language = 'fr' | 'en' | 'ar';
type TextDirection = 'ltr' | 'rtl';

interface I18nConfig {
  currentLanguage: Language;
  supportedLanguages: Language[];
  fallbackLanguage: Language;
  textDirection: TextDirection;
}

interface TranslationKey {
  key: string;
  translations: Record<Language, string>;
}

// Extend existing translations object
interface ExtendedTranslations {
  // Team Management
  'team.myTeam': string;
  'team.operators': string;
  'team.invite': string;
  'team.pending': string;
  'team.confirmed': string;
  'team.inviteEmail': string;
  'team.selectRole': string;
  'team.sendInvite': string;
  'team.resendInvite': string;
  'team.cancelInvite': string;
  'team.removeOperator': string;
  'team.performanceMetrics': string;
  'team.totalCalls': string;
  'team.confirmationRate': string;
  
  // Delivery Company
  'delivery.providers': string;
  'delivery.addProvider': string;
  'delivery.configure': string;
  'delivery.syncNow': string;
  'delivery.lastSync': string;
  'delivery.syncStatus': string;
  'delivery.apiEndpoint': string;
  'delivery.apiKey': string;
  'delivery.testConnection': string;
  'delivery.autoSync': string;
  'delivery.syncInterval': string;
  
  // Product Images
  'products.uploadImage': string;
  'products.removeImage': string;
  'products.imagePreview': string;
  'products.dragDropImage': string;
  'products.supportedFormats': string;
  'products.maxFileSize': string;
  
  // AI Score
  'orders.aiScore': string;
  'orders.highRisk': string;
  'orders.mediumRisk': string;
  'orders.lowRisk': string;
  'orders.scoreDetails': string;
  'orders.filterByScore': string;
  
  // Analytics
  'analytics.title': string;
  'analytics.operatorFeedback': string;
  'analytics.globalMetrics': string;
  'analytics.orderVolumes': string;
  'analytics.confirmationRates': string;
  'analytics.performanceTrends': string;
  'analytics.exportData': string;
  'analytics.timeRange': string;
  'analytics.daily': string;
  'analytics.weekly': string;
  'analytics.monthly': string;
  'analytics.custom': string;
  
  // Cancellations
  'cancellations.title': string;
  'cancellations.totalCancelled': string;
  'cancellations.byReason': string;
  'cancellations.customerRefused': string;
  'cancellations.priceTooHigh': string;
  'cancellations.qualityDoubts': string;
  'cancellations.duplicateOrder': string;
  'cancellations.fakeNumber': string;
  'cancellations.notAvailable': string;
  'cancellations.courierFailed': string;
  'cancellations.rejectedAtDoor': string;
  
  // Product Performance
  'products.performance': string;
  'products.salesVolume': string;
  'products.revenue': string;
  'products.returnRate': string;
  'products.avgAIScore': string;
  'products.topPerforming': string;
  'products.underperforming': string;
  'products.exportPerformance': string;
}
```

### Product Models (Extended)

```typescript
interface Product {
  _id: string;
  shopId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string; // NEW
  imageUploadedAt?: string; // NEW
  category?: string;
  sku?: string;
  stock?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProductPerformance {
  productId: string;
  productName: string;
  imageUrl?: string;
  salesVolume: number;
  revenue: number;
  returnCount: number;
  returnRate: number; // Calculated: (returnCount / salesVolume) * 100
  avgAIScore?: number; // Average AI score of orders containing this product
  trend: 'up' | 'down' | 'stable';
  isTopPerformer: boolean; // Top 10% by revenue
  isUnderperforming: boolean; // High return rate or low AI score
  timeRange: TimeRange;
}
```

### Feedback Models (Extended)

```typescript
type FeedbackSource = 'human' | 'ai';

interface HumanFeedback {
  _id: string;
  orderId: string;
  operatorId: string;
  operatorName: string;
  operatorAvatar?: string;
  rating: number; // 1-5
  tags: string[]; // e.g., "polite customer", "price concern", "quality question"
  notes: string;
  timestamp: string;
  source: 'human';
}

interface AIFeedback {
  _id: string;
  orderId: string;
  confidenceScore: number; // 0-100
  tags: string[]; // e.g., "high risk", "suspicious pattern", "repeat buyer"
  reasoning: string; // AI explanation
  riskFactors: string[];
  timestamp: string;
  source: 'ai';
}

type Feedback = HumanFeedback | AIFeedback;

interface OperatorFeedbackSummaryData {
  totalFeedback: number;
  averageRating: number;
  topTags: Array<{ tag: string; count: number }>;
  trendData: Array<{ date: string; averageRating: number; count: number }>;
  timeRange: TimeRange;
}
```

### Analytics Models

```typescript
interface TimeRange {
  start: Date;
  end: Date;
  preset?: 'today' | 'yesterday' | '7days' | '30days' | 'custom';
}

interface GlobalMetrics {
  orderVolume: number;
  confirmationRate: number;
  averageOrderValue: number;
  totalRevenue: number;
  cancelledOrders: number;
  cancellationRate: number;
  deliverySuccessRate: number;
  averageDeliveryTime: number;
  timeRange: TimeRange;
}

interface TrendData {
  date: string;
  value: number;
  label?: string;
}

interface AnalyticsExportData {
  metrics: GlobalMetrics;
  operatorFeedback: OperatorFeedbackSummaryData;
  cancellations: CancellationAnalysisData;
  productPerformance: ProductPerformance[];
  generatedAt: string;
  timeRange: TimeRange;
}
```

### Cancellation Models (Extended)

```typescript
// Already defined in order.ts, extending here
interface CancellationReasonData {
  reason: CancellationReason;
  count: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

interface CancellationReasonSummary {
  reason: CancellationReason;
  count: number;
  percentage: number;
}

interface CancellationAnalysisData {
  totalCancelled: number;
  cancellationRate: number;
  reasonBreakdown: CancellationReasonData[];
  trendData: TrendData[];
  topReasons: CancellationReasonSummary[];
  timeRange: TimeRange;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After analyzing all acceptance criteria, I've identified the following redundancies and consolidations:

**Redundancies to eliminate:**
- Properties 5.3, 5.4, 5.5 (AI score color coding) can be combined into one comprehensive property about score-based styling
- Properties 7.1 and 7.6 (feedback separation) are testing the same concept and can be combined
- Properties 3.2 and 3.3 (navbar and landing page translation) can be combined into one property about UI translation consistency

**Properties to keep as separate:**
- Team member status transitions (1.2, 1.3) are distinct state changes
- Filtering properties (1.5, 7.5, 8.4, 9.8, 10.8) test different domains and should remain separate
- Calculation properties (8.6, 9.4, 10.4, 10.9) test different calculations and should remain separate
- Display properties for human vs AI feedback (7.2, 7.3) test different data structures

### Correctness Properties

Property 1: Team invitation status initialization
*For any* valid team member invitation, creating the invitation should result in a status of "pending"
**Validates: Requirements 1.2**

Property 2: Team invitation acceptance state transition
*For any* pending team invitation, accepting the invitation should transition the status to "confirmed"
**Validates: Requirements 1.3**

Property 3: Team member display completeness
*For any* set of team members, the "Mon équipe" view should display all team members with their current statuses
**Validates: Requirements 1.4**

Property 4: Operator filtering
*For any* set of team members, the "Opérateurs" view should display only those with "confirmed" status
**Validates: Requirements 1.5**

Property 5: Operator card completeness
*For any* confirmed operator, the operator card should display name, role, contact information, and performance metrics
**Validates: Requirements 1.6**

Property 6: Delivery provider credential encryption
*For any* delivery provider configuration, stored API credentials should be encrypted
**Validates: Requirements 2.2**

Property 7: Delivery status synchronization
*For any* external delivery status change, the corresponding order status should be updated automatically
**Validates: Requirements 2.4**

Property 8: Multiple delivery provider support
*For any* number of delivery providers (0 to N), the system should store and manage all providers without conflicts
**Validates: Requirements 2.5**

Property 9: Delivery API interaction logging
*For any* delivery API interaction, a log entry should be created with timestamp, provider, and result
**Validates: Requirements 2.7**

Property 10: UI translation consistency
*For any* selected language, all UI text in the navbar and landing page should use translations from that language
**Validates: Requirements 3.2, 3.3**

Property 11: Language preference persistence
*For any* language selection, reloading the application should preserve that language selection
**Validates: Requirements 3.5**

Property 12: Hardcoded string detection
*For any* user-facing component, all displayed text should use i18n translation keys (no hardcoded strings)
**Validates: Requirements 3.8**

Property 13: Product image rendering
*For any* product with a valid image URL, the product display should render the image
**Validates: Requirements 4.1**

Property 14: Image format support
*For any* product image in JPEG, PNG, WebP, or GIF format, the image should display correctly
**Validates: Requirements 4.4**

Property 15: Image upload validation
*For any* uploaded file, the system should validate format and size before accepting the upload
**Validates: Requirements 4.6**

Property 16: AI score range constraint
*For any* order with an AI score, the score value should be between 0 and 100 (inclusive)
**Validates: Requirements 5.2**

Property 17: AI score color coding
*For any* AI score, the display color should be red if score < 40, orange if 40 ≤ score ≤ 70, or green if score > 70
**Validates: Requirements 5.3, 5.4, 5.5**

Property 18: AI score calculation factors
*For any* order, the AI score should be influenced by customer history, region, order value, and time of day
**Validates: Requirements 5.6**

Property 19: AI score sorting
*For any* list of orders sorted by AI score, the orders should be in correct ascending or descending order
**Validates: Requirements 5.8**

Property 20: Widget navigation
*For any* dashboard widget click, the system should navigate to the corresponding detail page
**Validates: Requirements 6.1**

Property 21: Widget detail page relevance
*For any* widget detail page, the displayed data should be related to the widget's metric
**Validates: Requirements 6.2**

Property 22: Order widget filtering
*For any* order-related widget, the detail page should display a filtered list of relevant orders
**Validates: Requirements 6.4**

Property 23: Revenue widget breakdown
*For any* revenue widget, the detail page should show revenue breakdown by product, region, or time period
**Validates: Requirements 6.5**

Property 24: Feedback source separation
*For any* order with both human and AI feedback, the feedback display should show them in separate sections
**Validates: Requirements 7.1, 7.6**

Property 25: Human feedback completeness
*For any* human feedback entry, the display should include operator name, timestamp, and detailed notes
**Validates: Requirements 7.2**

Property 26: AI feedback completeness
*For any* AI feedback entry, the display should include confidence score, automated tags, and reasoning
**Validates: Requirements 7.3**

Property 27: Feedback source filtering
*For any* feedback filter selection (human/AI/both), only feedback matching the selected source should be displayed
**Validates: Requirements 7.5**

Property 28: Analytics time range filtering
*For any* time range selection in analytics, the displayed data should only include records within that range
**Validates: Requirements 8.4**

Property 29: Operator performance average calculation
*For any* set of operator performance data, the calculated average should equal the sum divided by the count
**Validates: Requirements 8.6**

Property 30: Analytics trend highlighting
*For any* trend data with positive or negative changes, visual indicators should be displayed
**Validates: Requirements 8.7**

Property 31: Analytics data export
*For any* analytics data, exporting should produce a valid CSV or PDF file containing all displayed metrics
**Validates: Requirements 8.8**

Property 32: Cancellation reason grouping
*For any* set of cancelled orders, the widget should group cancellations by reason category
**Validates: Requirements 9.2**

Property 33: Cancellation percentage calculation
*For any* cancellation reason, the displayed percentage should equal (reason count / total cancellations) × 100
**Validates: Requirements 9.4**

Property 34: Cancellation filtering
*For any* date range and reason category filter, only matching cancelled orders should be displayed
**Validates: Requirements 9.8**

Property 35: Product performance metrics completeness
*For any* product in the performance display, sales volume, revenue, return rate, and AI score should be shown
**Validates: Requirements 10.3**

Property 36: Return rate calculation
*For any* product with returns and sales, the return rate should equal (returns / total sales) × 100
**Validates: Requirements 10.4**

Property 37: Product performance sorting
*For any* metric column in the performance table, sorting should order products correctly by that metric
**Validates: Requirements 10.5**

Property 38: Top performer identification
*For any* set of products, the top 10% by revenue should be highlighted with visual indicators
**Validates: Requirements 10.6**

Property 39: Underperformer identification
*For any* product with high return rate (>15%) or low AI score (<50), warning indicators should be displayed
**Validates: Requirements 10.7**

Property 40: Product performance time filtering
*For any* time range selection, product performance data should only include orders within that range
**Validates: Requirements 10.8**

Property 41: Product AI score averaging
*For any* product in orders with AI scores, the displayed average AI score should equal the sum of scores divided by order count
**Validates: Requirements 10.9**

Property 42: Product performance export
*For any* product performance data, exporting should produce a valid file containing all performance metrics
**Validates: Requirements 10.10**

## Error Handling

### Team Management Errors

1. **Invalid Invitation**: When an invitation email is invalid or already exists, display clear error message
2. **Expired Invitation**: When a user attempts to accept an expired invitation, show expiration message and offer to resend
3. **Permission Errors**: When a non-owner attempts team management actions, deny with appropriate message
4. **Network Errors**: When team API calls fail, show retry option and cache pending changes

### Delivery Integration Errors

1. **API Connection Failure**: When delivery provider API is unreachable, log error and use cached data
2. **Authentication Errors**: When API credentials are invalid, prompt for reconfiguration
3. **Sync Failures**: When status sync fails, retry with exponential backoff and log for manual review
4. **Invalid Status**: When external status is unrecognized, map to closest valid status and log warning

### Internationalization Errors

1. **Missing Translation**: When a translation key is missing, fall back to English and log warning
2. **Invalid Language**: When an unsupported language is selected, default to French
3. **RTL Layout Issues**: When RTL layout breaks, provide manual override option

### Product Image Errors

1. **Upload Failure**: When image upload fails, show error and allow retry
2. **Invalid Format**: When uploaded file is not an image, show format requirements
3. **Size Exceeded**: When image is too large, show size limit and suggest compression
4. **Load Failure**: When image fails to load, show fallback placeholder immediately

### AI Score Errors

1. **Calculation Failure**: When AI score calculation fails, use default score of 50 and log error
2. **Invalid Score**: When score is outside 0-100 range, clamp to valid range and log warning
3. **Missing Data**: When required data for scoring is missing, use partial scoring with lower confidence

### Widget and Analytics Errors

1. **Data Load Failure**: When widget data fails to load, show error state with retry button
2. **Export Failure**: When export fails, show error and offer to retry or download partial data
3. **Chart Rendering Error**: When chart fails to render, show data in table format as fallback
4. **Time Range Error**: When invalid time range is selected, default to last 30 days

### General Error Handling Principles

1. **User-Friendly Messages**: All errors should have clear, actionable messages in the user's language
2. **Graceful Degradation**: Features should work with reduced functionality when APIs fail
3. **Error Logging**: All errors should be logged with context for debugging
4. **Retry Mechanisms**: Network errors should have automatic retry with exponential backoff
5. **Offline Support**: Critical features should cache data for offline viewing

## Testing Strategy

### Dual Testing Approach

This feature requires both unit testing and property-based testing for comprehensive coverage:

**Unit Tests** focus on:
- Specific UI component rendering (team cards, widgets, charts)
- Edge cases (empty states, missing data, error states)
- Integration points between components
- Mock data handling and fallback behavior
- User interaction flows (clicks, form submissions)

**Property-Based Tests** focus on:
- Universal properties across all inputs (status transitions, calculations, filtering)
- Data transformation correctness (grouping, sorting, aggregation)
- State management consistency
- API response handling for various data shapes
- Validation logic for all input types

### Property-Based Testing Configuration

**Testing Library**: fast-check (JavaScript/TypeScript property-based testing library)

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with: `Feature: client-panel-enhancements, Property {number}: {property_text}`
- Generators for: TeamMember, DeliveryProvider, Product, Order, Feedback, Analytics data
- Shrinking enabled to find minimal failing examples

**Example Property Test Structure**:
```typescript
import fc from 'fast-check';

// Feature: client-panel-enhancements, Property 1: Team invitation status initialization
test('team invitation creates pending status', () => {
  fc.assert(
    fc.property(
      fc.record({
        email: fc.emailAddress(),
        role: fc.constantFrom('operator', 'manager', 'admin'),
        shopId: fc.uuid(),
      }),
      (invitationData) => {
        const invitation = createTeamInvitation(invitationData);
        expect(invitation.status).toBe('pending');
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Testing Strategy

**Testing Framework**: Vitest with React Testing Library

**Coverage Requirements**:
- Component rendering: 100% of new components
- User interactions: All clickable elements and forms
- Error states: All error handling paths
- Edge cases: Empty states, loading states, missing data

**Example Unit Test Structure**:
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { TeamManagementPage } from './TeamManagementPage';

test('displays two sub-menus in team section', () => {
  render(<TeamManagementPage />);
  expect(screen.getByText('Mon équipe')).toBeInTheDocument();
  expect(screen.getByText('Opérateurs')).toBeInTheDocument();
});
```

### Integration Testing

**Focus Areas**:
- Team invitation workflow (invite → pending → confirmed)
- Delivery status synchronization with order updates
- Language switching and UI updates
- Widget click navigation to detail pages
- Analytics data export functionality

### Test Data Generators

**Property-Based Test Generators**:
```typescript
// Team Member Generator
const teamMemberGen = fc.record({
  _id: fc.uuid(),
  shopId: fc.uuid(),
  email: fc.emailAddress(),
  name: fc.fullName(),
  role: fc.constantFrom('operator', 'manager', 'admin'),
  status: fc.constantFrom('invited', 'pending', 'confirmed'),
  invitedAt: fc.date().map(d => d.toISOString()),
  invitedBy: fc.uuid(),
});

// AI Score Generator (0-100)
const aiScoreGen = fc.integer({ min: 0, max: 100 });

// Product Performance Generator
const productPerformanceGen = fc.record({
  productId: fc.uuid(),
  productName: fc.string({ minLength: 3, maxLength: 50 }),
  salesVolume: fc.nat({ max: 10000 }),
  revenue: fc.float({ min: 0, max: 1000000, noNaN: true }),
  returnCount: fc.nat({ max: 1000 }),
});

// Cancellation Reason Generator
const cancellationReasonGen = fc.constantFrom(
  'customer_refused',
  'price_too_high',
  'quality_doubts',
  'duplicate_order',
  'fake_number',
  'not_available',
  'courier_failed',
  'customer_rejected_at_door'
);
```

### Performance Testing

**Metrics to Track**:
- Dashboard widget load time: < 2 seconds
- Product performance table render: < 1 second for 1000 products
- Analytics chart rendering: < 1.5 seconds
- Image lazy loading: Images load as they enter viewport
- Language switching: < 500ms for UI update

### Accessibility Testing

**Requirements**:
- All interactive elements keyboard accessible
- ARIA labels for all widgets and charts
- Color contrast ratios meet WCAG 2.1 Level AA
- Screen reader support for all new features
- RTL layout properly supports Arabic language

## Implementation Notes

### Phase 1: Foundation (Team Management + i18n)
1. Implement team management data models and API routes
2. Create team invitation workflow components
3. Extend i18n system with new translation keys
4. Implement language selector and persistence
5. Update navbar with enlarged logo and translations

### Phase 2: Delivery Integration + Product Images
1. Create delivery provider data models and API routes
2. Implement delivery provider configuration UI
3. Build status synchronization service
4. Add product image upload and display components
5. Implement image validation and fallback handling

### Phase 3: AI Score + Clickable Widgets
1. Extend order model with AI score fields
2. Implement AI score calculation service (with mock fallback)
3. Add AI score column to orders table
4. Make dashboard widgets clickable
5. Create widget detail pages with charts

### Phase 4: Feedback + Analytics
1. Separate human and AI feedback in data models
2. Create feedback display components with visual distinction
3. Build analytics section with global metrics
4. Implement time-based filtering
5. Add export functionality for analytics data

### Phase 5: Cancellations + Product Performance
1. Extend order model with cancellation tracking
2. Create cancelled orders widget and detail page
3. Implement cancellation reason grouping and charts
4. Add product performance tab to products panel
5. Build product performance table with sorting and filtering

### Testing Phase
1. Write property-based tests for all 42 properties
2. Write unit tests for all components
3. Perform integration testing for workflows
4. Conduct accessibility audit
5. Performance testing and optimization

### Deployment Considerations
1. Database migrations for new fields (team members, delivery providers, cancellation reasons)
2. API versioning for backward compatibility
3. Feature flags for gradual rollout
4. Monitoring and logging for new features
5. Documentation for shop owners and operators
