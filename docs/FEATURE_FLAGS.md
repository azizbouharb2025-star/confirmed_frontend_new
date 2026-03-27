# Feature Flags Configuration - Client Panel Enhancements

## Overview

This document outlines the feature flag system for gradual rollout of Client Panel Enhancements. Feature flags allow controlled deployment, A/B testing, and quick rollback if issues arise.

---

## Feature Flag System

### Implementation

We use a combination of:
- **Environment variables** for deployment-level flags
- **Database flags** for shop-level and user-level flags
- **LaunchDarkly/Unleash** (optional) for advanced feature management

### Flag Structure

```typescript
interface FeatureFlag {
  key: string;                    // Unique flag identifier
  name: string;                   // Human-readable name
  description: string;            // What this flag controls
  enabled: boolean;               // Global enable/disable
  rolloutPercentage: number;      // 0-100, percentage of users
  enabledForShops: string[];      // Specific shop IDs
  enabledForUsers: string[];      // Specific user IDs
  enabledForPlans: string[];      // Subscription plans
  startDate?: Date;               // When to enable
  endDate?: Date;                 // When to disable
  dependencies: string[];         // Required flags
  metadata: Record<string, any>; // Additional config
}
```

---

## Feature Flags List

### 1. Team Management

#### Flag: `team_management_enabled`

**Description**: Enable team member invitation and management system

**Default**: `false`

**Rollout Strategy**:
- Phase 1 (Week 1): 10% of shops (beta testers)
- Phase 2 (Week 2): 50% of shops
- Phase 3 (Week 3): 100% of shops

**Configuration**:
```json
{
  "key": "team_management_enabled",
  "name": "Team Management",
  "description": "Enable team member invitation and management",
  "enabled": true,
  "rolloutPercentage": 10,
  "enabledForShops": ["shop_beta_1", "shop_beta_2"],
  "enabledForPlans": ["business", "enterprise"],
  "dependencies": [],
  "metadata": {
    "maxTeamMembers": {
      "starter": 0,
      "pro": 3,
      "business": 10,
      "enterprise": -1
    }
  }
}
```

**Usage in Code**:
```typescript
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

function TeamManagementPage() {
  const { isEnabled, config } = useFeatureFlag('team_management_enabled');
  
  if (!isEnabled) {
    return <UpgradePrompt feature="Team Management" />;
  }
  
  const maxMembers = config.metadata.maxTeamMembers[userPlan];
  // ... render team management UI
}
```

---

### 2. Delivery Company Integration

#### Flag: `delivery_integration_enabled`

**Description**: Enable delivery provider API integration

**Default**: `false`

**Rollout Strategy**:
- Phase 1 (Week 1): Manual enablement for shops with API credentials
- Phase 2 (Week 2): 25% of shops
- Phase 3 (Week 3): 100% of shops

**Configuration**:
```json
{
  "key": "delivery_integration_enabled",
  "name": "Delivery Integration",
  "description": "Enable delivery provider API integration",
  "enabled": true,
  "rolloutPercentage": 25,
  "enabledForShops": [],
  "enabledForPlans": ["pro", "business", "enterprise"],
  "dependencies": [],
  "metadata": {
    "supportedProviders": ["aramex", "dhl", "fedex"],
    "maxProviders": {
      "pro": 1,
      "business": 3,
      "enterprise": -1
    },
    "autoSyncEnabled": true,
    "syncIntervalMinutes": 30
  }
}
```

**Sub-flags**:
- `delivery_auto_sync`: Enable automatic status synchronization
- `delivery_webhooks`: Enable webhook support

---

### 3. Internationalization (i18n)

#### Flag: `i18n_enabled`

**Description**: Enable multi-language support

**Default**: `true` (already rolled out)

**Configuration**:
```json
{
  "key": "i18n_enabled",
  "name": "Internationalization",
  "description": "Enable multi-language support (FR/EN/AR)",
  "enabled": true,
  "rolloutPercentage": 100,
  "enabledForShops": [],
  "enabledForPlans": ["starter", "pro", "business", "enterprise"],
  "dependencies": [],
  "metadata": {
    "supportedLanguages": ["fr", "en", "ar"],
    "defaultLanguage": "fr",
    "rtlLanguages": ["ar"]
  }
}
```

---

### 4. Product Images

#### Flag: `product_images_enabled`

**Description**: Enable product image upload and management

**Default**: `false`

**Rollout Strategy**:
- Phase 1 (Week 1): 20% of shops
- Phase 2 (Week 2): 60% of shops
- Phase 3 (Week 3): 100% of shops

**Configuration**:
```json
{
  "key": "product_images_enabled",
  "name": "Product Images",
  "description": "Enable product image upload and management",
  "enabled": true,
  "rolloutPercentage": 20,
  "enabledForShops": [],
  "enabledForPlans": ["starter", "pro", "business", "enterprise"],
  "dependencies": [],
  "metadata": {
    "maxFileSize": 5242880,
    "supportedFormats": ["jpeg", "jpg", "png", "webp", "gif"],
    "storageProvider": "cloudinary",
    "compressionEnabled": true,
    "maxImagesPerProduct": 1
  }
}
```

---

### 5. AI Score System

#### Flag: `ai_score_enabled`

**Description**: Enable AI-powered order risk scoring

**Default**: `false`

**Rollout Strategy**:
- Phase 1 (Week 1): 5% of shops (collect data)
- Phase 2 (Week 2): 25% of shops (validate accuracy)
- Phase 3 (Week 3): 100% of shops

**Configuration**:
```json
{
  "key": "ai_score_enabled",
  "name": "AI Score System",
  "description": "Enable AI-powered order risk scoring",
  "enabled": true,
  "rolloutPercentage": 5,
  "enabledForShops": [],
  "enabledForPlans": ["pro", "business", "enterprise"],
  "dependencies": [],
  "metadata": {
    "modelVersion": "v1.2.0",
    "scoreThresholds": {
      "high": 40,
      "medium": 70
    },
    "factors": {
      "customerHistory": 0.3,
      "regionRisk": 0.2,
      "orderValue": 0.2,
      "timeOfDay": 0.15,
      "paymentMethod": 0.15
    },
    "useMockData": false
  }
}
```

**Sub-flags**:
- `ai_score_sorting`: Enable sorting by AI score
- `ai_score_filtering`: Enable filtering by AI score range
- `ai_score_details`: Show detailed score breakdown

---

### 6. Clickable Widgets

#### Flag: `clickable_widgets_enabled`

**Description**: Enable clickable dashboard widgets with detail pages

**Default**: `false`

**Rollout Strategy**:
- Phase 1 (Week 1): 30% of shops
- Phase 2 (Week 2): 100% of shops

**Configuration**:
```json
{
  "key": "clickable_widgets_enabled",
  "name": "Clickable Widgets",
  "description": "Enable clickable dashboard widgets",
  "enabled": true,
  "rolloutPercentage": 30,
  "enabledForShops": [],
  "enabledForPlans": ["starter", "pro", "business", "enterprise"],
  "dependencies": [],
  "metadata": {
    "enabledWidgets": [
      "orders_received",
      "orders_confirmed",
      "revenue",
      "delivery_success",
      "cancelled_orders"
    ],
    "chartTypes": ["line", "bar", "pie"],
    "defaultTimeRange": "30days"
  }
}
```

---

### 7. Feedback Separation

#### Flag: `feedback_separation_enabled`

**Description**: Separate human and AI operator feedback

**Default**: `false`

**Rollout Strategy**:
- Phase 1 (Week 1): 15% of shops
- Phase 2 (Week 2): 50% of shops
- Phase 3 (Week 3): 100% of shops

**Configuration**:
```json
{
  "key": "feedback_separation_enabled",
  "name": "Feedback Separation",
  "description": "Separate human and AI operator feedback",
  "enabled": true,
  "rolloutPercentage": 15,
  "enabledForShops": [],
  "enabledForPlans": ["pro", "business", "enterprise"],
  "dependencies": ["ai_score_enabled"],
  "metadata": {
    "showHumanFeedback": true,
    "showAIFeedback": true,
    "defaultFilter": "all",
    "enableRatings": true,
    "enableTags": true
  }
}
```

---

### 8. Analytics Section

#### Flag: `analytics_section_enabled`

**Description**: Enable comprehensive analytics and reporting

**Default**: `false`

**Rollout Strategy**:
- Phase 1 (Week 1): 10% of shops
- Phase 2 (Week 2): 40% of shops
- Phase 3 (Week 3): 100% of shops

**Configuration**:
```json
{
  "key": "analytics_section_enabled",
  "name": "Analytics Section",
  "description": "Enable analytics and reporting section",
  "enabled": true,
  "rolloutPercentage": 10,
  "enabledForShops": [],
  "enabledForPlans": ["business", "enterprise"],
  "dependencies": [],
  "metadata": {
    "availableMetrics": [
      "global",
      "operator_feedback",
      "cancellations",
      "product_performance"
    ],
    "exportFormats": ["csv", "pdf"],
    "cacheEnabled": true,
    "cacheDurationMinutes": 15,
    "maxTimeRangeDays": 365
  }
}
```

**Sub-flags**:
- `analytics_export`: Enable data export
- `analytics_realtime`: Enable real-time updates
- `analytics_advanced_charts`: Enable advanced visualizations

---

### 9. Cancelled Orders Analysis

#### Flag: `cancellation_analysis_enabled`

**Description**: Enable detailed cancellation tracking and analysis

**Default**: `false`

**Rollout Strategy**:
- Phase 1 (Week 1): 20% of shops
- Phase 2 (Week 2): 100% of shops

**Configuration**:
```json
{
  "key": "cancellation_analysis_enabled",
  "name": "Cancellation Analysis",
  "description": "Enable cancellation tracking and analysis",
  "enabled": true,
  "rolloutPercentage": 20,
  "enabledForShops": [],
  "enabledForPlans": ["pro", "business", "enterprise"],
  "dependencies": [],
  "metadata": {
    "trackReasons": true,
    "reasonCategories": [
      "customer_refused",
      "price_too_high",
      "quality_doubts",
      "duplicate_order",
      "fake_number",
      "not_available",
      "courier_failed",
      "customer_rejected_at_door"
    ],
    "showTrends": true,
    "showRegionalAnalysis": true
  }
}
```

---

### 10. Product Performance

#### Flag: `product_performance_enabled`

**Description**: Enable product performance tracking and metrics

**Default**: `false`

**Rollout Strategy**:
- Phase 1 (Week 1): 15% of shops
- Phase 2 (Week 2): 50% of shops
- Phase 3 (Week 3): 100% of shops

**Configuration**:
```json
{
  "key": "product_performance_enabled",
  "name": "Product Performance",
  "description": "Enable product performance tracking",
  "enabled": true,
  "rolloutPercentage": 15,
  "enabledForShops": [],
  "enabledForPlans": ["business", "enterprise"],
  "dependencies": ["ai_score_enabled"],
  "metadata": {
    "metrics": [
      "sales_volume",
      "revenue",
      "return_rate",
      "avg_ai_score"
    ],
    "highlightTopPerformers": true,
    "highlightUnderperformers": true,
    "topPerformerThreshold": 0.1,
    "underperformerReturnRate": 15,
    "underperformerAIScore": 50,
    "exportEnabled": true
  }
}
```

---

## Feature Flag Management

### Database Schema

```javascript
// feature_flags collection
{
  _id: ObjectId,
  key: String,
  name: String,
  description: String,
  enabled: Boolean,
  rolloutPercentage: Number,
  enabledForShops: [ObjectId],
  enabledForUsers: [ObjectId],
  enabledForPlans: [String],
  startDate: Date,
  endDate: Date,
  dependencies: [String],
  metadata: Object,
  createdAt: Date,
  updatedAt: Date,
  createdBy: ObjectId
}
```

### API Endpoints

#### GET /api/feature-flags

Get all feature flags for current user/shop.

**Response**:
```json
{
  "flags": {
    "team_management_enabled": true,
    "delivery_integration_enabled": false,
    "ai_score_enabled": true,
    "analytics_section_enabled": false
  },
  "config": {
    "team_management_enabled": {
      "maxTeamMembers": 10
    }
  }
}
```

#### POST /api/feature-flags/:key/enable

Enable a feature flag (admin only).

#### POST /api/feature-flags/:key/disable

Disable a feature flag (admin only).

---

## Implementation

### React Hook

```typescript
// hooks/useFeatureFlag.ts

import { useAuth } from './useAuth';
import { useQuery } from '@tanstack/react-query';

export function useFeatureFlag(flagKey: string) {
  const { user, shop } = useAuth();
  
  const { data, isLoading } = useQuery({
    queryKey: ['feature-flags', flagKey, shop?._id],
    queryFn: async () => {
      const response = await fetch(`/api/feature-flags/${flagKey}`);
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    isEnabled: data?.enabled ?? false,
    config: data?.config ?? {},
    isLoading,
  };
}
```

### Usage Example

```typescript
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

function ProductPerformanceTab() {
  const { isEnabled, config, isLoading } = useFeatureFlag('product_performance_enabled');

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isEnabled) {
    return (
      <UpgradePrompt 
        feature="Product Performance Tracking"
        requiredPlan="business"
      />
    );
  }

  const metrics = config.metrics || [];
  
  return (
    <div>
      <ProductPerformanceTable metrics={metrics} />
    </div>
  );
}
```

### Server-Side Check

```typescript
// lib/featureFlags.ts

export async function isFeatureEnabled(
  flagKey: string,
  shopId: string,
  userId?: string
): Promise<boolean> {
  const flag = await db.collection('feature_flags').findOne({ key: flagKey });
  
  if (!flag || !flag.enabled) {
    return false;
  }

  // Check rollout percentage
  if (flag.rolloutPercentage < 100) {
    const hash = hashShopId(shopId);
    if (hash % 100 >= flag.rolloutPercentage) {
      return false;
    }
  }

  // Check shop whitelist
  if (flag.enabledForShops.length > 0) {
    if (!flag.enabledForShops.includes(shopId)) {
      return false;
    }
  }

  // Check user whitelist
  if (userId && flag.enabledForUsers.length > 0) {
    if (!flag.enabledForUsers.includes(userId)) {
      return false;
    }
  }

  // Check subscription plan
  const shop = await db.collection('shops').findOne({ _id: shopId });
  if (flag.enabledForPlans.length > 0) {
    if (!flag.enabledForPlans.includes(shop.subscriptionPlan)) {
      return false;
    }
  }

  // Check date range
  const now = new Date();
  if (flag.startDate && now < flag.startDate) {
    return false;
  }
  if (flag.endDate && now > flag.endDate) {
    return false;
  }

  // Check dependencies
  for (const dep of flag.dependencies) {
    const depEnabled = await isFeatureEnabled(dep, shopId, userId);
    if (!depEnabled) {
      return false;
    }
  }

  return true;
}
```

---

## Rollout Schedule

### Week 1: Beta Testing (10-20% rollout)

**Enabled Features**:
- ✅ Team Management (10%)
- ✅ Product Images (20%)
- ✅ Cancellation Analysis (20%)
- ✅ AI Score (5% - data collection)

**Goals**:
- Collect user feedback
- Monitor performance
- Identify bugs
- Validate AI score accuracy

### Week 2: Expanded Rollout (50-60% rollout)

**Enabled Features**:
- ✅ Team Management (50%)
- ✅ Delivery Integration (25%)
- ✅ Product Images (60%)
- ✅ Clickable Widgets (30%)
- ✅ Feedback Separation (15%)
- ✅ AI Score (25%)

**Goals**:
- Scale testing
- Performance optimization
- Address feedback
- Refine features

### Week 3: Full Rollout (100%)

**Enabled Features**:
- ✅ All features at 100%

**Goals**:
- Complete deployment
- Monitor stability
- Provide support
- Gather success metrics

---

## Monitoring and Metrics

### Key Metrics to Track

**Adoption Metrics**:
- Feature usage rate
- Active users per feature
- Time spent in new sections
- Feature engagement

**Performance Metrics**:
- Page load times
- API response times
- Error rates
- Database query performance

**Business Metrics**:
- Confirmation rate improvement
- Cancellation rate reduction
- Team productivity increase
- Customer satisfaction

### Monitoring Tools

```typescript
// Track feature usage
analytics.track('feature_used', {
  feature: 'team_management',
  action: 'invite_sent',
  shopId: shop._id,
  userId: user._id,
  timestamp: new Date()
});

// Track feature performance
performance.measure('feature_load_time', {
  feature: 'product_performance',
  duration: loadTime,
  shopId: shop._id
});

// Track errors
errorTracking.captureException(error, {
  feature: 'delivery_integration',
  context: { shopId, providerId }
});
```

---

## Rollback Procedures

### Quick Rollback

**Disable Feature Globally**:
```bash
# Via API
curl -X POST https://api.confirmed.com/admin/feature-flags/ai_score_enabled/disable \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Via Database
db.feature_flags.updateOne(
  { key: 'ai_score_enabled' },
  { $set: { enabled: false } }
)
```

**Reduce Rollout Percentage**:
```bash
db.feature_flags.updateOne(
  { key: 'ai_score_enabled' },
  { $set: { rolloutPercentage: 0 } }
)
```

### Gradual Rollback

1. Reduce rollout percentage to 50%
2. Monitor for 1 hour
3. If stable, keep at 50% and investigate
4. If issues persist, reduce to 0%

### Emergency Rollback

```bash
# Disable all new features
db.feature_flags.updateMany(
  { key: { $in: [
    'team_management_enabled',
    'delivery_integration_enabled',
    'ai_score_enabled',
    'analytics_section_enabled',
    'product_performance_enabled'
  ]}},
  { $set: { enabled: false } }
)
```

---

## Testing Feature Flags

### Local Development

```bash
# .env.local
FEATURE_FLAGS_OVERRIDE=true
TEAM_MANAGEMENT_ENABLED=true
AI_SCORE_ENABLED=true
ANALYTICS_SECTION_ENABLED=true
```

### Staging Environment

```bash
# Enable all features in staging
export FEATURE_FLAGS_ENV=staging
export FEATURE_FLAGS_DEFAULT_ENABLED=true
```

### Testing Specific Shops

```typescript
// Enable feature for specific shop
await db.collection('feature_flags').updateOne(
  { key: 'team_management_enabled' },
  { 
    $addToSet: { 
      enabledForShops: 'shop_test_123' 
    } 
  }
);
```

---

## Best Practices

### Do's ✅

- ✅ Start with small rollout percentages
- ✅ Monitor metrics closely during rollout
- ✅ Have rollback plan ready
- ✅ Test thoroughly in staging
- ✅ Communicate with users about new features
- ✅ Collect feedback early
- ✅ Document flag dependencies
- ✅ Clean up old flags after full rollout

### Don'ts ❌

- ❌ Don't roll out to 100% immediately
- ❌ Don't deploy on Fridays or before holidays
- ❌ Don't ignore performance metrics
- ❌ Don't forget to test rollback procedures
- ❌ Don't leave flags in code indefinitely
- ❌ Don't create circular dependencies
- ❌ Don't skip staging testing

---

## Cleanup

### After Successful Rollout

Once a feature is at 100% rollout for 2+ weeks with no issues:

1. **Remove Feature Flag Checks**:
```typescript
// Before
if (useFeatureFlag('team_management_enabled').isEnabled) {
  return <TeamManagement />;
}

// After (flag removed)
return <TeamManagement />;
```

2. **Archive Flag in Database**:
```javascript
db.feature_flags.updateOne(
  { key: 'team_management_enabled' },
  { 
    $set: { 
      archived: true,
      archivedAt: new Date()
    } 
  }
);
```

3. **Update Documentation**:
- Mark feature as fully deployed
- Remove flag from active list
- Update user documentation

---

## Support and Troubleshooting

### Common Issues

**Feature Not Showing for User**:
1. Check user's subscription plan
2. Verify shop is in rollout percentage
3. Check feature dependencies
4. Clear cache and reload

**Feature Causing Performance Issues**:
1. Reduce rollout percentage immediately
2. Check database query performance
3. Review API response times
4. Consider adding caching

**Feature Flag Not Updating**:
1. Check cache expiration
2. Verify database connection
3. Clear application cache
4. Restart application servers

---

## Summary

### Total Features: 10

1. ✅ Team Management
2. ✅ Delivery Integration
3. ✅ Internationalization (already deployed)
4. ✅ Product Images
5. ✅ AI Score System
6. ✅ Clickable Widgets
7. ✅ Feedback Separation
8. ✅ Analytics Section
9. ✅ Cancellation Analysis
10. ✅ Product Performance

### Rollout Timeline: 3 Weeks

- **Week 1**: Beta testing (10-20%)
- **Week 2**: Expanded rollout (50-60%)
- **Week 3**: Full deployment (100%)

### Success Criteria

- ✅ Zero critical bugs
- ✅ < 2% error rate
- ✅ Positive user feedback
- ✅ Performance within SLA
- ✅ Successful rollback testing

---

**Last Updated**: January 25, 2024
