# Database Migrations - Client Panel Enhancements

## Overview

This document outlines all database schema changes required for the Client Panel Enhancements feature set. These migrations should be applied in order to ensure data integrity and backward compatibility.

---

## Migration Strategy

### Approach
- **Zero-downtime migrations**: All changes are backward compatible
- **Incremental rollout**: Migrations can be applied independently
- **Rollback support**: Each migration includes rollback instructions
- **Data preservation**: Existing data is never deleted, only extended

### Prerequisites
- Database backup before applying migrations
- Read access to production database for testing
- Staging environment for validation
- Monitoring tools for performance tracking

---

## Migration 1: Team Management Schema

### Purpose
Add team member management with invitation workflow support.

### Collections/Tables to Create

#### `team_members` Collection

```javascript
{
  _id: ObjectId,
  shopId: ObjectId,              // Reference to shops collection
  email: String,                 // Unique per shop
  name: String,                  // Optional until invitation accepted
  role: String,                  // Enum: 'operator', 'manager', 'admin'
  status: String,                // Enum: 'invited', 'pending', 'confirmed'
  invitedAt: Date,              // When invitation was sent
  invitedBy: ObjectId,          // User who sent invitation
  acceptedAt: Date,             // When invitation was accepted (optional)
  lastActiveAt: Date,           // Last activity timestamp (optional)
  performanceMetrics: {         // For operators only
    totalCalls: Number,
    confirmedCalls: Number,
    confirmationRate: Number,
    averageCallDuration: Number,
    lastCallAt: Date
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
```javascript
db.team_members.createIndex({ shopId: 1, email: 1 }, { unique: true })
db.team_members.createIndex({ shopId: 1, status: 1 })
db.team_members.createIndex({ shopId: 1, role: 1 })
```

#### `team_invitations` Collection

```javascript
{
  _id: ObjectId,
  shopId: ObjectId,
  email: String,
  role: String,
  token: String,                // Unique invitation token
  expiresAt: Date,             // Token expiration (7 days from creation)
  createdAt: Date,
  createdBy: ObjectId,
  acceptedAt: Date,            // Optional, set when accepted
  status: String               // Enum: 'pending', 'accepted', 'expired'
}
```

**Indexes**:
```javascript
db.team_invitations.createIndex({ token: 1 }, { unique: true })
db.team_invitations.createIndex({ shopId: 1, email: 1 })
db.team_invitations.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
```

### Migration Script (MongoDB)

```javascript
// Migration: 001_add_team_management.js

async function up(db) {
  // Create team_members collection
  await db.createCollection('team_members', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['shopId', 'email', 'role', 'status', 'invitedAt', 'invitedBy'],
        properties: {
          shopId: { bsonType: 'objectId' },
          email: { bsonType: 'string', pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$' },
          name: { bsonType: 'string' },
          role: { enum: ['operator', 'manager', 'admin'] },
          status: { enum: ['invited', 'pending', 'confirmed'] },
          invitedAt: { bsonType: 'date' },
          invitedBy: { bsonType: 'objectId' },
          acceptedAt: { bsonType: 'date' },
          lastActiveAt: { bsonType: 'date' },
          performanceMetrics: {
            bsonType: 'object',
            properties: {
              totalCalls: { bsonType: 'number', minimum: 0 },
              confirmedCalls: { bsonType: 'number', minimum: 0 },
              confirmationRate: { bsonType: 'number', minimum: 0, maximum: 100 },
              averageCallDuration: { bsonType: 'number', minimum: 0 },
              lastCallAt: { bsonType: 'date' }
            }
          }
        }
      }
    }
  });

  // Create indexes
  await db.collection('team_members').createIndex(
    { shopId: 1, email: 1 }, 
    { unique: true }
  );
  await db.collection('team_members').createIndex({ shopId: 1, status: 1 });
  await db.collection('team_members').createIndex({ shopId: 1, role: 1 });

  // Create team_invitations collection
  await db.createCollection('team_invitations', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['shopId', 'email', 'role', 'token', 'expiresAt', 'createdAt', 'createdBy'],
        properties: {
          shopId: { bsonType: 'objectId' },
          email: { bsonType: 'string' },
          role: { enum: ['operator', 'manager', 'admin'] },
          token: { bsonType: 'string' },
          expiresAt: { bsonType: 'date' },
          createdAt: { bsonType: 'date' },
          createdBy: { bsonType: 'objectId' },
          acceptedAt: { bsonType: 'date' },
          status: { enum: ['pending', 'accepted', 'expired'] }
        }
      }
    }
  });

  // Create indexes
  await db.collection('team_invitations').createIndex({ token: 1 }, { unique: true });
  await db.collection('team_invitations').createIndex({ shopId: 1, email: 1 });
  await db.collection('team_invitations').createIndex(
    { expiresAt: 1 }, 
    { expireAfterSeconds: 0 }
  );

  console.log('Migration 001: Team management schema created successfully');
}

async function down(db) {
  await db.collection('team_members').drop();
  await db.collection('team_invitations').drop();
  console.log('Migration 001: Team management schema rolled back');
}

module.exports = { up, down };
```

### Rollback Instructions
```bash
# Run the down function to remove collections
node migrations/001_add_team_management.js --down
```

---

## Migration 2: Delivery Provider Schema

### Purpose
Add delivery provider integration with encrypted credentials.

### Collections/Tables to Create

#### `delivery_providers` Collection

```javascript
{
  _id: ObjectId,
  shopId: ObjectId,
  name: String,                  // Provider name (e.g., "Aramex")
  type: String,                  // Enum: 'aramex', 'dhl', 'fedex', 'custom'
  apiEndpoint: String,           // Provider API URL
  apiKey: String,                // Encrypted API key
  apiSecret: String,             // Encrypted API secret (optional)
  isActive: Boolean,             // Whether provider is active
  lastSyncAt: Date,             // Last successful sync timestamp
  lastSyncStatus: String,        // Enum: 'success', 'failed'
  lastSyncError: String,         // Error message if sync failed
  config: {
    webhookUrl: String,
    autoSync: Boolean,
    syncInterval: Number,        // Minutes between syncs
    supportedRegions: [String],  // Array of region codes
    customFields: Object         // Provider-specific config
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
```javascript
db.delivery_providers.createIndex({ shopId: 1 })
db.delivery_providers.createIndex({ shopId: 1, isActive: 1 })
```

#### `delivery_sync_logs` Collection

```javascript
{
  _id: ObjectId,
  providerId: ObjectId,
  shopId: ObjectId,
  syncType: String,              // Enum: 'manual', 'automatic'
  status: String,                // Enum: 'success', 'failed', 'partial'
  ordersUpdated: Number,
  errorMessage: String,
  startedAt: Date,
  completedAt: Date,
  duration: Number               // Milliseconds
}
```

**Indexes**:
```javascript
db.delivery_sync_logs.createIndex({ providerId: 1, startedAt: -1 })
db.delivery_sync_logs.createIndex({ shopId: 1, startedAt: -1 })
```

### Migration Script (MongoDB)

```javascript
// Migration: 002_add_delivery_providers.js

async function up(db) {
  // Create delivery_providers collection
  await db.createCollection('delivery_providers', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['shopId', 'name', 'type', 'apiEndpoint', 'apiKey', 'isActive'],
        properties: {
          shopId: { bsonType: 'objectId' },
          name: { bsonType: 'string' },
          type: { enum: ['aramex', 'dhl', 'fedex', 'custom'] },
          apiEndpoint: { bsonType: 'string' },
          apiKey: { bsonType: 'string' },
          apiSecret: { bsonType: 'string' },
          isActive: { bsonType: 'bool' },
          lastSyncAt: { bsonType: 'date' },
          lastSyncStatus: { enum: ['success', 'failed'] },
          lastSyncError: { bsonType: 'string' },
          config: {
            bsonType: 'object',
            properties: {
              webhookUrl: { bsonType: 'string' },
              autoSync: { bsonType: 'bool' },
              syncInterval: { bsonType: 'number', minimum: 1 },
              supportedRegions: { bsonType: 'array', items: { bsonType: 'string' } }
            }
          }
        }
      }
    }
  });

  await db.collection('delivery_providers').createIndex({ shopId: 1 });
  await db.collection('delivery_providers').createIndex({ shopId: 1, isActive: 1 });

  // Create delivery_sync_logs collection
  await db.createCollection('delivery_sync_logs');
  await db.collection('delivery_sync_logs').createIndex({ providerId: 1, startedAt: -1 });
  await db.collection('delivery_sync_logs').createIndex({ shopId: 1, startedAt: -1 });

  console.log('Migration 002: Delivery provider schema created successfully');
}

async function down(db) {
  await db.collection('delivery_providers').drop();
  await db.collection('delivery_sync_logs').drop();
  console.log('Migration 002: Delivery provider schema rolled back');
}

module.exports = { up, down };
```

---

## Migration 3: Product Image Fields

### Purpose
Add image support to products collection.

### Schema Changes

#### Update `products` Collection

Add new fields:
```javascript
{
  // ... existing fields ...
  imageUrl: String,              // URL to product image
  imageUploadedAt: Date,         // When image was uploaded
  imageMetadata: {               // Optional metadata
    format: String,              // e.g., 'jpeg', 'png'
    size: Number,                // File size in bytes
    width: Number,               // Image width in pixels
    height: Number               // Image height in pixels
  }
}
```

### Migration Script (MongoDB)

```javascript
// Migration: 003_add_product_images.js

async function up(db) {
  // Add new fields to products collection
  await db.collection('products').updateMany(
    {},
    {
      $set: {
        imageUrl: null,
        imageUploadedAt: null,
        imageMetadata: null
      }
    }
  );

  // Create index for products with images
  await db.collection('products').createIndex({ imageUrl: 1 });

  console.log('Migration 003: Product image fields added successfully');
}

async function down(db) {
  // Remove image fields
  await db.collection('products').updateMany(
    {},
    {
      $unset: {
        imageUrl: '',
        imageUploadedAt: '',
        imageMetadata: ''
      }
    }
  );

  await db.collection('products').dropIndex({ imageUrl: 1 });

  console.log('Migration 003: Product image fields removed');
}

module.exports = { up, down };
```

---

## Migration 4: Order AI Score and Cancellation Fields

### Purpose
Add AI scoring and enhanced cancellation tracking to orders.

### Schema Changes

#### Update `orders` Collection

Add new fields:
```javascript
{
  // ... existing fields ...
  aiScore: Number,               // AI risk score (0-100)
  riskLevel: String,             // Enum: 'high', 'medium', 'low'
  aiScoreCalculatedAt: Date,     // When score was calculated
  aiScoreFactors: {              // Factors influencing score
    customerHistory: Number,
    regionRisk: Number,
    orderValue: Number,
    timeOfDay: Number,
    paymentMethod: Number
  },
  cancellationReason: String,    // Detailed cancellation reason
  cancellationNotes: String,     // Additional cancellation details
  cancelledBy: ObjectId,         // User who cancelled
  cancelledAt: Date              // Cancellation timestamp
}
```

### Migration Script (MongoDB)

```javascript
// Migration: 004_add_ai_score_and_cancellation.js

async function up(db) {
  // Add AI score fields
  await db.collection('orders').updateMany(
    {},
    {
      $set: {
        aiScore: null,
        riskLevel: null,
        aiScoreCalculatedAt: null,
        aiScoreFactors: null,
        cancellationReason: null,
        cancellationNotes: null,
        cancelledBy: null,
        cancelledAt: null
      }
    }
  );

  // Create indexes
  await db.collection('orders').createIndex({ aiScore: 1 });
  await db.collection('orders').createIndex({ riskLevel: 1 });
  await db.collection('orders').createIndex({ cancellationReason: 1 });
  await db.collection('orders').createIndex({ cancelledAt: -1 });

  console.log('Migration 004: AI score and cancellation fields added successfully');
}

async function down(db) {
  await db.collection('orders').updateMany(
    {},
    {
      $unset: {
        aiScore: '',
        riskLevel: '',
        aiScoreCalculatedAt: '',
        aiScoreFactors: '',
        cancellationReason: '',
        cancellationNotes: '',
        cancelledBy: '',
        cancelledAt: ''
      }
    }
  );

  await db.collection('orders').dropIndex({ aiScore: 1 });
  await db.collection('orders').dropIndex({ riskLevel: 1 });
  await db.collection('orders').dropIndex({ cancellationReason: 1 });
  await db.collection('orders').dropIndex({ cancelledAt: -1 });

  console.log('Migration 004: AI score and cancellation fields removed');
}

module.exports = { up, down };
```

---

## Migration 5: Feedback Collections

### Purpose
Separate human and AI feedback with enhanced tracking.

### Collections/Tables to Create

#### `human_feedback` Collection

```javascript
{
  _id: ObjectId,
  orderId: ObjectId,
  operatorId: ObjectId,
  operatorName: String,
  operatorAvatar: String,
  rating: Number,                // 1-5
  tags: [String],               // Array of feedback tags
  notes: String,                // Detailed feedback notes
  timestamp: Date,
  source: 'human'
}
```

**Indexes**:
```javascript
db.human_feedback.createIndex({ orderId: 1 })
db.human_feedback.createIndex({ operatorId: 1, timestamp: -1 })
```

#### `ai_feedback` Collection

```javascript
{
  _id: ObjectId,
  orderId: ObjectId,
  confidenceScore: Number,       // 0-100
  tags: [String],               // Automated tags
  reasoning: String,            // AI explanation
  riskFactors: [String],        // Identified risk factors
  timestamp: Date,
  source: 'ai',
  modelVersion: String          // AI model version used
}
```

**Indexes**:
```javascript
db.ai_feedback.createIndex({ orderId: 1 })
db.ai_feedback.createIndex({ timestamp: -1 })
```

### Migration Script (MongoDB)

```javascript
// Migration: 005_add_feedback_collections.js

async function up(db) {
  // Create human_feedback collection
  await db.createCollection('human_feedback', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['orderId', 'operatorId', 'rating', 'timestamp', 'source'],
        properties: {
          orderId: { bsonType: 'objectId' },
          operatorId: { bsonType: 'objectId' },
          operatorName: { bsonType: 'string' },
          operatorAvatar: { bsonType: 'string' },
          rating: { bsonType: 'number', minimum: 1, maximum: 5 },
          tags: { bsonType: 'array', items: { bsonType: 'string' } },
          notes: { bsonType: 'string' },
          timestamp: { bsonType: 'date' },
          source: { enum: ['human'] }
        }
      }
    }
  });

  await db.collection('human_feedback').createIndex({ orderId: 1 });
  await db.collection('human_feedback').createIndex({ operatorId: 1, timestamp: -1 });

  // Create ai_feedback collection
  await db.createCollection('ai_feedback', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['orderId', 'confidenceScore', 'timestamp', 'source'],
        properties: {
          orderId: { bsonType: 'objectId' },
          confidenceScore: { bsonType: 'number', minimum: 0, maximum: 100 },
          tags: { bsonType: 'array', items: { bsonType: 'string' } },
          reasoning: { bsonType: 'string' },
          riskFactors: { bsonType: 'array', items: { bsonType: 'string' } },
          timestamp: { bsonType: 'date' },
          source: { enum: ['ai'] },
          modelVersion: { bsonType: 'string' }
        }
      }
    }
  });

  await db.collection('ai_feedback').createIndex({ orderId: 1 });
  await db.collection('ai_feedback').createIndex({ timestamp: -1 });

  console.log('Migration 005: Feedback collections created successfully');
}

async function down(db) {
  await db.collection('human_feedback').drop();
  await db.collection('ai_feedback').drop();
  console.log('Migration 005: Feedback collections removed');
}

module.exports = { up, down };
```

---

## Migration 6: Analytics Cache Collection

### Purpose
Cache analytics data for improved performance.

### Collections/Tables to Create

#### `analytics_cache` Collection

```javascript
{
  _id: ObjectId,
  shopId: ObjectId,
  cacheKey: String,              // Unique cache identifier
  cacheType: String,             // Enum: 'global', 'operator', 'product', 'cancellation'
  data: Object,                  // Cached analytics data
  timeRange: {
    start: Date,
    end: Date
  },
  generatedAt: Date,
  expiresAt: Date                // Cache expiration
}
```

**Indexes**:
```javascript
db.analytics_cache.createIndex({ shopId: 1, cacheKey: 1 }, { unique: true })
db.analytics_cache.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
```

### Migration Script (MongoDB)

```javascript
// Migration: 006_add_analytics_cache.js

async function up(db) {
  await db.createCollection('analytics_cache');
  
  await db.collection('analytics_cache').createIndex(
    { shopId: 1, cacheKey: 1 }, 
    { unique: true }
  );
  
  await db.collection('analytics_cache').createIndex(
    { expiresAt: 1 }, 
    { expireAfterSeconds: 0 }
  );

  console.log('Migration 006: Analytics cache collection created successfully');
}

async function down(db) {
  await db.collection('analytics_cache').drop();
  console.log('Migration 006: Analytics cache collection removed');
}

module.exports = { up, down };
```

---

## Running Migrations

### Prerequisites

1. **Backup Database**:
```bash
mongodump --uri="mongodb://your-connection-string" --out=/backup/$(date +%Y%m%d)
```

2. **Test in Staging**:
```bash
# Set staging environment
export NODE_ENV=staging
export MONGODB_URI="mongodb://staging-connection-string"

# Run migrations
npm run migrate
```

### Migration Commands

```bash
# Run all pending migrations
npm run migrate

# Run specific migration
npm run migrate -- --migration=001

# Rollback last migration
npm run migrate:rollback

# Rollback specific migration
npm run migrate:rollback -- --migration=001

# Check migration status
npm run migrate:status
```

### Migration Runner Script

```javascript
// scripts/migrate.js

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db = client.db();

  // Get all migration files
  const migrationsDir = path.join(__dirname, '../migrations');
  const files = fs.readdirSync(migrationsDir).sort();

  // Track applied migrations
  const migrationsCollection = db.collection('_migrations');
  const applied = await migrationsCollection.find({}).toArray();
  const appliedNames = applied.map(m => m.name);

  for (const file of files) {
    if (!file.endsWith('.js')) continue;
    
    const migrationName = file.replace('.js', '');
    
    if (appliedNames.includes(migrationName)) {
      console.log(`Skipping ${migrationName} (already applied)`);
      continue;
    }

    console.log(`Running ${migrationName}...`);
    const migration = require(path.join(migrationsDir, file));
    
    try {
      await migration.up(db);
      await migrationsCollection.insertOne({
        name: migrationName,
        appliedAt: new Date()
      });
      console.log(`✓ ${migrationName} completed`);
    } catch (error) {
      console.error(`✗ ${migrationName} failed:`, error);
      process.exit(1);
    }
  }

  await client.close();
  console.log('All migrations completed successfully');
}

runMigrations().catch(console.error);
```

---

## Post-Migration Validation

### Validation Checklist

1. **Verify Collections Created**:
```javascript
db.getCollectionNames()
```

2. **Check Indexes**:
```javascript
db.team_members.getIndexes()
db.delivery_providers.getIndexes()
db.human_feedback.getIndexes()
```

3. **Validate Data Integrity**:
```javascript
// Check for null values in required fields
db.team_members.find({ shopId: null }).count()
db.orders.find({ aiScore: { $lt: 0, $gt: 100 } }).count()
```

4. **Performance Testing**:
```javascript
// Test query performance
db.orders.find({ aiScore: { $lt: 40 } }).explain('executionStats')
```

---

## Monitoring and Maintenance

### Performance Monitoring

```javascript
// Monitor collection sizes
db.stats()
db.team_members.stats()
db.delivery_providers.stats()

// Monitor index usage
db.orders.aggregate([
  { $indexStats: {} }
])
```

### Cleanup Tasks

```bash
# Remove expired invitations (handled by TTL index)
# Remove old sync logs (older than 90 days)
db.delivery_sync_logs.deleteMany({
  startedAt: { $lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
})

# Clear expired analytics cache (handled by TTL index)
```

---

## Troubleshooting

### Common Issues

**Migration Fails Midway**:
1. Check error logs
2. Verify database connection
3. Ensure sufficient permissions
4. Run rollback if needed
5. Fix issue and retry

**Index Creation Timeout**:
1. Create indexes in background: `{ background: true }`
2. Run during low-traffic periods
3. Monitor index build progress

**Data Validation Errors**:
1. Review validation rules
2. Check existing data format
3. Update data before applying strict validation

---

## Backup and Recovery

### Backup Strategy

```bash
# Full backup before migrations
mongodump --uri="mongodb://connection-string" --out=/backup/pre-migration

# Backup specific collections
mongodump --uri="mongodb://connection-string" --collection=orders --out=/backup/orders
```

### Recovery Process

```bash
# Restore from backup
mongorestore --uri="mongodb://connection-string" /backup/pre-migration

# Restore specific collection
mongorestore --uri="mongodb://connection-string" --collection=orders /backup/orders
```

---

## Summary

### Migration Order

1. ✅ Team Management Schema
2. ✅ Delivery Provider Schema
3. ✅ Product Image Fields
4. ✅ Order AI Score and Cancellation Fields
5. ✅ Feedback Collections
6. ✅ Analytics Cache Collection

### Estimated Downtime

- **Zero downtime**: All migrations are non-blocking
- **Index creation**: May slow queries temporarily
- **Recommended**: Run during low-traffic periods

### Success Criteria

- ✅ All collections created
- ✅ All indexes created
- ✅ Data validation passing
- ✅ No performance degradation
- ✅ Application functioning normally

---

**Last Updated**: January 25, 2024
