# Developer Quick Start - Client Panel Enhancements

## Overview

This guide helps developers quickly understand and work with the Client Panel Enhancements codebase.

---

## Project Structure

```
Confirmed V1/
├── app/                              # Next.js App Router
│   ├── api/                         # API Routes
│   │   ├── team/                    # Team management endpoints
│   │   ├── delivery/                # Delivery integration endpoints
│   │   ├── products/                # Product endpoints
│   │   ├── feedback/                # Feedback endpoints
│   │   ├── analytics/               # Analytics endpoints
│   │   └── cancellations/           # Cancellation endpoints
│   └── panel/client/                # Client dashboard pages
│       ├── team/                    # Team management UI
│       ├── delivery-company/        # Delivery integration UI
│       ├── products/                # Products with performance tab
│       ├── analytics/               # Analytics dashboard
│       ├── cancellations/           # Cancellation analysis
│       └── details/                 # Widget detail pages
│
├── components/                       # React components
│   ├── team/                        # Team management components
│   ├── delivery/                    # Delivery components
│   ├── products/                    # Product components
│   ├── feedback/                    # Feedback components
│   ├── analytics/                   # Analytics components
│   └── dashboard/                   # Dashboard components
│
├── services/                         # Business logic
│   ├── teamService.ts               # Team management logic
│   ├── deliveryService.ts           # Delivery integration logic
│   ├── aiScoreService.ts            # AI scoring logic
│   ├── analyticsService.ts          # Analytics calculations
│   └── feedbackService.ts           # Feedback processing
│
├── types/                            # TypeScript definitions
│   ├── team.ts                      # Team types
│   ├── delivery.ts                  # Delivery types
│   ├── product.ts                   # Product types
│   ├── productPerformance.ts        # Performance types
│   ├── feedback.ts                  # Feedback types
│   ├── analytics.ts                 # Analytics types
│   └── cancellation.ts              # Cancellation types
│
├── lib/                              # Utilities
│   ├── i18n.ts                      # Internationalization
│   ├── api.ts                       # API client
│   └── featureFlags.ts              # Feature flag utilities
│
└── docs/                             # Documentation
    ├── API_DOCUMENTATION.md
    ├── USER_GUIDE.md
    ├── DATABASE_MIGRATIONS.md
    ├── FEATURE_FLAGS.md
    └── DEPLOYMENT_CHECKLIST.md
```

---

## Key Features

### 1. Team Management

**Files**:
- `types/team.ts` - Type definitions
- `services/teamService.ts` - Business logic
- `app/api/team/` - API endpoints
- `app/panel/client/team/` - UI components

**Key Concepts**:
- Invitation workflow: Invite → Pending → Confirmed
- Role-based access: operator, manager, admin
- Performance metrics for operators

**Example Usage**:
```typescript
import { teamService } from '@/services/teamService';

// Invite a team member
const invitation = await teamService.inviteTeamMember({
  email: 'operator@example.com',
  role: 'operator',
  shopId: 'shop_123'
});

// Get all team members
const members = await teamService.getTeamMembers('shop_123');

// Accept invitation
await teamService.acceptInvitation(token, 'John Doe');
```

---

### 2. Delivery Integration

**Files**:
- `types/delivery.ts` - Type definitions
- `services/deliveryService.ts` - Business logic
- `app/api/delivery/` - API endpoints
- `app/panel/client/delivery-company/` - UI components

**Key Concepts**:
- Multiple provider support
- Encrypted API credentials
- Automatic status synchronization
- Webhook support

**Example Usage**:
```typescript
import { deliveryService } from '@/services/deliveryService';

// Add delivery provider
const provider = await deliveryService.addProvider({
  name: 'Aramex',
  type: 'aramex',
  apiEndpoint: 'https://api.aramex.com/v1',
  apiKey: 'encrypted_key',
  config: {
    autoSync: true,
    syncInterval: 30
  }
});

// Sync delivery status
await deliveryService.syncDeliveryStatus('provider_123');
```

---

### 3. AI Score System

**Files**:
- `services/aiScoreService.ts` - Scoring logic
- `components/orders/AIScoreColumn.tsx` - Display component
- `types/order.ts` - Extended with AI score fields

**Key Concepts**:
- Score range: 0-100
- Risk levels: high (<40), medium (40-70), low (>70)
- Factors: customer history, region, order value, time, payment

**Example Usage**:
```typescript
import { calculateAIScore } from '@/services/aiScoreService';

// Calculate AI score for an order
const score = await calculateAIScore({
  customerId: 'cust_123',
  orderValue: 150,
  region: 'Casablanca',
  timeOfDay: new Date(),
  paymentMethod: 'cash'
});

// Returns: { score: 75, riskLevel: 'low', factors: {...} }
```

---

### 4. Product Performance

**Files**:
- `types/productPerformance.ts` - Type definitions
- `app/api/products/performance/` - API endpoints
- `app/panel/client/products/` - UI with performance tab

**Key Concepts**:
- Metrics: sales volume, revenue, return rate, AI score
- Top performers: top 10% by revenue
- Underperformers: high return rate or low AI score

**Example Usage**:
```typescript
// Get product performance
const performance = await fetch('/api/products/performance?startDate=2024-01-01&endDate=2024-01-31');

// Export performance data
const csv = await fetch('/api/products/performance/export', {
  method: 'POST',
  body: JSON.stringify({ format: 'csv' })
});
```

---

### 5. Feedback System

**Files**:
- `types/feedback.ts` - Type definitions
- `services/feedbackService.ts` - Business logic
- `app/api/feedback/` - API endpoints
- `components/feedback/` - Display components

**Key Concepts**:
- Separate human and AI feedback
- Visual distinction (blue for human, purple for AI)
- Filtering by source

**Example Usage**:
```typescript
import { getFeedback } from '@/services/feedbackService';

// Get all feedback for an order
const feedback = await getFeedback('order_123');

// Returns: { humanFeedback: [...], aiFeedback: [...] }
```

---

### 6. Analytics

**Files**:
- `types/analytics.ts` - Type definitions
- `services/analyticsService.ts` - Calculations
- `app/api/analytics/` - API endpoints
- `app/panel/client/analytics/` - Dashboard UI

**Key Concepts**:
- Global metrics: orders, revenue, confirmation rates
- Operator feedback summary
- Time range filtering
- Data export (CSV/PDF)

**Example Usage**:
```typescript
// Get global metrics
const metrics = await fetch('/api/analytics/global?startDate=2024-01-01&endDate=2024-01-31');

// Export analytics
const pdf = await fetch('/api/analytics/export', {
  method: 'POST',
  body: JSON.stringify({
    format: 'pdf',
    includeMetrics: true,
    includeFeedback: true
  })
});
```

---

## Internationalization (i18n)

### Adding Translations

**File**: `lib/i18n.ts`

```typescript
export const translations = {
  en: {
    'team.myTeam': 'My Team',
    'team.operators': 'Operators',
    'team.invite': 'Invite Team Member'
  },
  fr: {
    'team.myTeam': 'Mon équipe',
    'team.operators': 'Opérateurs',
    'team.invite': 'Inviter un membre'
  },
  ar: {
    'team.myTeam': 'فريقي',
    'team.operators': 'المشغلون',
    'team.invite': 'دعوة عضو'
  }
};
```

### Using Translations

```typescript
import { useLanguage } from '@/hooks/useLanguage';

function MyComponent() {
  const { t } = useLanguage();
  
  return (
    <div>
      <h1>{t('team.myTeam')}</h1>
      <button>{t('team.invite')}</button>
    </div>
  );
}
```

---

## Feature Flags

### Checking Feature Flags

```typescript
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

function TeamManagementPage() {
  const { isEnabled, config } = useFeatureFlag('team_management_enabled');
  
  if (!isEnabled) {
    return <UpgradePrompt />;
  }
  
  const maxMembers = config.metadata.maxTeamMembers[userPlan];
  
  return <TeamManagement maxMembers={maxMembers} />;
}
```

### Server-Side Feature Checks

```typescript
import { isFeatureEnabled } from '@/lib/featureFlags';

export async function GET(request: NextRequest) {
  const shopId = getShopIdFromSession(request);
  
  if (!await isFeatureEnabled('team_management_enabled', shopId)) {
    return NextResponse.json(
      { error: 'Feature not available' },
      { status: 403 }
    );
  }
  
  // ... handle request
}
```

---

## API Development

### Creating a New Endpoint

**File**: `app/api/my-feature/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getShopIdFromSession } from '@/lib/auth';

/**
 * GET /api/my-feature
 * Description of what this endpoint does
 * Requirements: X.X
 */
export async function GET(request: NextRequest) {
  try {
    // Get shop ID from session
    const shopId = await getShopIdFromSession(request);
    
    if (!shopId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Your logic here
    const data = await fetchData(shopId);
    
    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error in GET /api/my-feature:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## Component Development

### Creating a New Component

**File**: `components/my-feature/MyComponent.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';

interface MyComponentProps {
  data: MyData;
  onAction: (id: string) => void;
}

export function MyComponent({ data, onAction }: MyComponentProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  
  const handleClick = async () => {
    setLoading(true);
    try {
      await onAction(data.id);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="p-4 bg-white dark:bg-slate-800 rounded-lg">
      <h3 className="text-lg font-semibold">{data.title}</h3>
      <button
        onClick={handleClick}
        disabled={loading}
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
      >
        {loading ? t('common.loading') : t('common.action')}
      </button>
    </div>
  );
}
```

---

## Testing

### Unit Tests

**File**: `components/my-feature/__tests__/MyComponent.test.tsx`

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    const data = { id: '1', title: 'Test' };
    render(<MyComponent data={data} onAction={jest.fn()} />);
    
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
  
  it('calls onAction when button clicked', async () => {
    const onAction = jest.fn();
    const data = { id: '1', title: 'Test' };
    
    render(<MyComponent data={data} onAction={onAction} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(onAction).toHaveBeenCalledWith('1');
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- MyComponent.test.tsx
```

---

## Common Tasks

### Adding a New Translation Key

1. Add to `lib/i18n.ts`:
```typescript
export const translations = {
  en: { 'my.key': 'My Text' },
  fr: { 'my.key': 'Mon Texte' },
  ar: { 'my.key': 'نصي' }
};
```

2. Use in component:
```typescript
const { t } = useLanguage();
<span>{t('my.key')}</span>
```

### Adding a New API Endpoint

1. Create route file: `app/api/my-endpoint/route.ts`
2. Implement GET/POST/etc. functions
3. Add types to `types/` directory
4. Document in `docs/API_DOCUMENTATION.md`
5. Add tests

### Adding a New Feature Flag

1. Add to database:
```javascript
db.feature_flags.insertOne({
  key: 'my_feature_enabled',
  name: 'My Feature',
  enabled: false,
  rolloutPercentage: 0
});
```

2. Use in code:
```typescript
const { isEnabled } = useFeatureFlag('my_feature_enabled');
```

3. Document in `docs/FEATURE_FLAGS.md`

### Creating a Database Migration

1. Create file: `migrations/XXX_my_migration.js`
2. Implement `up()` and `down()` functions
3. Test in staging
4. Document in `docs/DATABASE_MIGRATIONS.md`
5. Run: `npm run migrate`

---

## Debugging

### Enable Debug Logging

```bash
# .env.local
DEBUG=true
LOG_LEVEL=debug
```

### Common Issues

**Feature Not Showing**:
1. Check feature flag status
2. Verify user subscription plan
3. Check browser console for errors
4. Clear cache and reload

**API Errors**:
1. Check network tab in DevTools
2. Verify authentication token
3. Check API endpoint URL
4. Review server logs

**Translation Missing**:
1. Check if key exists in `lib/i18n.ts`
2. Verify language is supported
3. Check for typos in translation key
4. Fallback to English if missing

---

## Performance Optimization

### Best Practices

1. **Use React.memo** for expensive components
2. **Lazy load** heavy components
3. **Debounce** search inputs
4. **Cache** API responses with React Query
5. **Optimize images** with Next.js Image component
6. **Use indexes** for database queries
7. **Implement pagination** for large lists

### Example: Lazy Loading

```typescript
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <LoadingSpinner />,
  ssr: false
});
```

### Example: React Query Caching

```typescript
import { useQuery } from '@tanstack/react-query';

function useTeamMembers(shopId: string) {
  return useQuery({
    queryKey: ['team-members', shopId],
    queryFn: () => fetchTeamMembers(shopId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000 // 10 minutes
  });
}
```

---

## Code Style

### TypeScript

- Use explicit types for function parameters and return values
- Prefer interfaces over types for object shapes
- Use enums for fixed sets of values
- Avoid `any` type

### React

- Use functional components with hooks
- Extract complex logic into custom hooks
- Keep components small and focused
- Use proper prop types

### Naming Conventions

- **Components**: PascalCase (e.g., `TeamMemberCard`)
- **Functions**: camelCase (e.g., `calculateAIScore`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)
- **Files**: kebab-case (e.g., `team-member-card.tsx`)

---

## Resources

### Documentation
- [API Documentation](API_DOCUMENTATION.md)
- [User Guide](USER_GUIDE.md)
- [Database Migrations](DATABASE_MIGRATIONS.md)
- [Feature Flags](FEATURE_FLAGS.md)
- [Deployment Checklist](DEPLOYMENT_CHECKLIST.md)

### External Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

## Getting Help

### Internal
- **Slack**: #dev-confirmed channel
- **Email**: dev-team@confirmed.com
- **Wiki**: https://wiki.confirmed.com

### External
- **GitHub Issues**: Report bugs and request features
- **Stack Overflow**: Tag questions with `confirmed-platform`

---

**Last Updated**: January 25, 2024
