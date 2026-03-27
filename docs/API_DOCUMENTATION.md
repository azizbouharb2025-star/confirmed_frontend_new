# API Documentation - Client Panel Enhancements

## Overview

This document provides comprehensive API documentation for all endpoints added as part of the Client Panel Enhancements feature set. All endpoints require authentication via JWT token in the Authorization header.

**Base URL**: `http://51.255.201.244:3000/api`

**Authentication**: 
```
Authorization: Bearer <jwt_token>
```

---

## Table of Contents

1. [Team Management APIs](#team-management-apis)
2. [Delivery Company APIs](#delivery-company-apis)
3. [Product APIs](#product-apis)
4. [Feedback APIs](#feedback-apis)
5. [Analytics APIs](#analytics-apis)
6. [Cancellation APIs](#cancellation-apis)
7. [Error Handling](#error-handling)

---

## Team Management APIs

### POST /api/team/invite

Invite a new team member to join the shop.

**Requirements**: 1.2

**Request Body**:
```json
{
  "email": "operator@example.com",
  "role": "operator"
}
```

**Parameters**:
- `email` (string, required): Valid email address
- `role` (string, required): One of: "operator", "manager", "admin"

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Invitation sent successfully",
  "invitation": {
    "_id": "inv_123",
    "shopId": "shop_456",
    "email": "operator@example.com",
    "role": "operator",
    "token": "abc123xyz",
    "expiresAt": "2024-02-01T00:00:00Z",
    "createdAt": "2024-01-25T10:30:00Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid email or role
- `409 Conflict`: Email already invited or member exists
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not shop owner

---

### GET /api/team/members

Retrieve all team members for the authenticated shop owner.

**Requirements**: 1.1, 1.4, 1.5

**Query Parameters**:
- `status` (optional): Filter by status ("invited", "pending", "confirmed")
- `role` (optional): Filter by role ("operator", "manager", "admin")

**Response** (200 OK):
```json
{
  "success": true,
  "members": [
    {
      "_id": "member_123",
      "shopId": "shop_456",
      "email": "operator@example.com",
      "name": "John Doe",
      "role": "operator",
      "status": "confirmed",
      "invitedAt": "2024-01-20T10:00:00Z",
      "acceptedAt": "2024-01-21T14:30:00Z",
      "performanceMetrics": {
        "totalCalls": 150,
        "confirmedCalls": 120,
        "confirmationRate": 80,
        "averageCallDuration": 180,
        "lastCallAt": "2024-01-25T09:45:00Z"
      }
    }
  ]
}
```

---

### PATCH /api/team/accept/:token

Accept a team invitation using the invitation token.

**Requirements**: 1.3

**URL Parameters**:
- `token` (string, required): Invitation token from email

**Request Body**:
```json
{
  "name": "John Doe"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Invitation accepted successfully",
  "member": {
    "_id": "member_123",
    "status": "confirmed",
    "name": "John Doe"
  }
}
```

**Error Responses**:
- `404 Not Found`: Invalid or expired token
- `400 Bad Request`: Missing name

---

### DELETE /api/team/members/:id

Remove a team member from the shop.

**Requirements**: 1.1

**URL Parameters**:
- `id` (string, required): Team member ID

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Team member removed successfully"
}
```

**Error Responses**:
- `404 Not Found`: Member not found
- `403 Forbidden`: Cannot remove yourself or not authorized

---

## Delivery Company APIs

### GET /api/delivery/providers

Get all delivery providers configured for the shop.

**Requirements**: 2.1, 2.5

**Response** (200 OK):
```json
{
  "success": true,
  "providers": [
    {
      "_id": "provider_123",
      "shopId": "shop_456",
      "name": "Aramex",
      "type": "aramex",
      "apiEndpoint": "https://api.aramex.com/v1",
      "isActive": true,
      "lastSyncAt": "2024-01-25T10:00:00Z",
      "lastSyncStatus": "success",
      "config": {
        "autoSync": true,
        "syncInterval": 30,
        "supportedRegions": ["MA", "DZ", "TN"]
      }
    }
  ]
}
```

---

### POST /api/delivery/providers

Add a new delivery provider configuration.

**Requirements**: 2.1, 2.2

**Request Body**:
```json
{
  "name": "DHL Express",
  "type": "dhl",
  "apiEndpoint": "https://api.dhl.com/v1",
  "apiKey": "your_api_key",
  "apiSecret": "your_api_secret",
  "config": {
    "autoSync": true,
    "syncInterval": 30,
    "supportedRegions": ["MA", "FR", "ES"],
    "webhookUrl": "https://yourapp.com/webhooks/dhl"
  }
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Delivery provider added successfully",
  "provider": {
    "_id": "provider_789",
    "name": "DHL Express",
    "type": "dhl",
    "isActive": true
  }
}
```

**Security Note**: API credentials are encrypted before storage.

---

### POST /api/delivery/sync/:providerId

Manually trigger delivery status synchronization.

**Requirements**: 2.3, 2.4, 2.7

**URL Parameters**:
- `providerId` (string, required): Delivery provider ID

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Sync completed successfully",
  "syncResult": {
    "ordersUpdated": 15,
    "timestamp": "2024-01-25T10:30:00Z",
    "status": "success"
  }
}
```

**Error Responses**:
- `404 Not Found`: Provider not found
- `500 Internal Server Error`: Sync failed (check logs)

---

### DELETE /api/delivery/providers

Remove a delivery provider configuration.

**Requirements**: 2.5

**Query Parameters**:
- `providerId` (string, required): Provider ID to remove

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Delivery provider removed successfully"
}
```

---

## Product APIs

### POST /api/products/:id/image

Upload an image for a product.

**Requirements**: 4.6, 4.7

**URL Parameters**:
- `id` (string, required): Product ID

**Request**: Multipart form data
- `image` (file, required): Image file (JPEG, PNG, WebP, GIF)
- Max size: 5MB

**Response** (200 OK):
```json
{
  "imageUrl": "https://storage.example.com/products/prod_123.jpg",
  "uploadedAt": "2024-01-25T10:30:00Z"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid file format or size exceeded
- `404 Not Found`: Product not found

---

### DELETE /api/products/:id/image

Remove a product image.

**URL Parameters**:
- `id` (string, required): Product ID

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Product image removed successfully"
}
```

---

### GET /api/products/performance

Get product performance metrics.

**Requirements**: 10.1, 10.2, 10.3, 10.8

**Query Parameters**:
- `startDate` (string, optional): ISO date string
- `endDate` (string, optional): ISO date string
- `sortBy` (string, optional): "sales", "revenue", "returnRate", "aiScore"
- `sortOrder` (string, optional): "asc" or "desc"

**Response** (200 OK):
```json
{
  "success": true,
  "products": [
    {
      "productId": "prod_123",
      "productName": "Premium T-Shirt",
      "imageUrl": "https://storage.example.com/products/prod_123.jpg",
      "salesVolume": 450,
      "revenue": 13500.00,
      "returnCount": 15,
      "returnRate": 3.33,
      "avgAIScore": 78.5,
      "trend": "up",
      "isTopPerformer": true,
      "isUnderperforming": false,
      "timeRange": {
        "start": "2024-01-01T00:00:00Z",
        "end": "2024-01-31T23:59:59Z"
      }
    }
  ]
}
```

---

### POST /api/products/performance/export

Export product performance data as CSV.

**Requirements**: 10.10

**Request Body**:
```json
{
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "format": "csv"
}
```

**Response** (200 OK):
```
Content-Type: text/csv
Content-Disposition: attachment; filename="product-performance-2024-01.csv"

Product ID,Product Name,Sales Volume,Revenue,Return Rate,Avg AI Score
prod_123,Premium T-Shirt,450,13500.00,3.33,78.5
...
```

---

## Feedback APIs

### GET /api/feedback/:orderId

Get all feedback (human and AI) for a specific order.

**Requirements**: 7.1, 7.2, 7.3

**URL Parameters**:
- `orderId` (string, required): Order ID

**Query Parameters**:
- `source` (string, optional): Filter by "human", "ai", or "all" (default)

**Response** (200 OK):
```json
{
  "success": true,
  "orderId": "order_123",
  "humanFeedback": [
    {
      "_id": "feedback_456",
      "orderId": "order_123",
      "operatorId": "op_789",
      "operatorName": "John Doe",
      "operatorAvatar": "https://example.com/avatars/john.jpg",
      "rating": 4,
      "tags": ["polite customer", "price concern"],
      "notes": "Customer was polite but concerned about price. Offered discount.",
      "timestamp": "2024-01-25T10:30:00Z",
      "source": "human"
    }
  ],
  "aiFeedback": [
    {
      "_id": "feedback_789",
      "orderId": "order_123",
      "confidenceScore": 85,
      "tags": ["repeat buyer", "high value"],
      "reasoning": "Customer has 5 previous successful orders with average value of $150",
      "riskFactors": [],
      "timestamp": "2024-01-25T09:00:00Z",
      "source": "ai"
    }
  ]
}
```

---

### GET /api/feedback/summary

Get operator feedback summary statistics.

**Requirements**: 8.2, 8.3, 8.6

**Query Parameters**:
- `startDate` (string, required): ISO date string
- `endDate` (string, required): ISO date string

**Response** (200 OK):
```json
{
  "success": true,
  "summary": {
    "totalFeedback": 250,
    "averageRating": 4.2,
    "topTags": [
      { "tag": "polite customer", "count": 85 },
      { "tag": "price concern", "count": 42 },
      { "tag": "quality question", "count": 38 }
    ],
    "trendData": [
      {
        "date": "2024-01-20",
        "averageRating": 4.1,
        "count": 45
      },
      {
        "date": "2024-01-21",
        "averageRating": 4.3,
        "count": 52
      }
    ],
    "timeRange": {
      "start": "2024-01-01T00:00:00Z",
      "end": "2024-01-31T23:59:59Z"
    }
  }
}
```

---

## Analytics APIs

### GET /api/analytics/global

Get global performance metrics.

**Requirements**: 8.2, 8.3, 8.4, 8.5

**Query Parameters**:
- `startDate` (string, required): ISO date string
- `endDate` (string, required): ISO date string

**Response** (200 OK):
```json
{
  "success": true,
  "metrics": {
    "orderVolume": 1250,
    "confirmationRate": 78.5,
    "averageOrderValue": 125.50,
    "totalRevenue": 156875.00,
    "cancelledOrders": 85,
    "cancellationRate": 6.8,
    "deliverySuccessRate": 94.2,
    "averageDeliveryTime": 3.5,
    "timeRange": {
      "start": "2024-01-01T00:00:00Z",
      "end": "2024-01-31T23:59:59Z"
    }
  }
}
```

---

### GET /api/analytics/operator-feedback

Get operator feedback analytics.

**Requirements**: 8.2, 8.3, 8.6

**Query Parameters**:
- `startDate` (string, required): ISO date string
- `endDate` (string, required): ISO date string

**Response**: Same as `/api/feedback/summary`

---

### POST /api/analytics/export

Export analytics data.

**Requirements**: 8.8

**Request Body**:
```json
{
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "format": "csv",
  "includeMetrics": true,
  "includeFeedback": true,
  "includeCancellations": true,
  "includeProductPerformance": true
}
```

**Response** (200 OK):
```
Content-Type: text/csv or application/pdf
Content-Disposition: attachment; filename="analytics-2024-01.csv"

[CSV or PDF content with all requested data]
```

---

## Cancellation APIs

### GET /api/cancellations/summary

Get cancelled orders summary.

**Requirements**: 9.1, 9.2

**Response** (200 OK):
```json
{
  "success": true,
  "totalCancelled": 85,
  "topReasons": [
    {
      "reason": "customer_refused",
      "count": 25,
      "percentage": 29.4
    },
    {
      "reason": "price_too_high",
      "count": 18,
      "percentage": 21.2
    },
    {
      "reason": "not_available",
      "count": 15,
      "percentage": 17.6
    }
  ]
}
```

---

### GET /api/cancellations/analysis

Get detailed cancellation analysis.

**Requirements**: 9.3, 9.4, 9.5

**Query Parameters**:
- `startDate` (string, required): ISO date string
- `endDate` (string, required): ISO date string

**Response** (200 OK):
```json
{
  "success": true,
  "analysis": {
    "totalCancelled": 85,
    "cancellationRate": 6.8,
    "reasonBreakdown": [
      {
        "reason": "customer_refused",
        "count": 25,
        "percentage": 29.4,
        "trend": "down"
      },
      {
        "reason": "price_too_high",
        "count": 18,
        "percentage": 21.2,
        "trend": "stable"
      }
    ],
    "trendData": [
      {
        "date": "2024-01-20",
        "value": 3,
        "label": "3 cancellations"
      },
      {
        "date": "2024-01-21",
        "value": 5,
        "label": "5 cancellations"
      }
    ],
    "timeRange": {
      "start": "2024-01-01T00:00:00Z",
      "end": "2024-01-31T23:59:59Z"
    }
  }
}
```

---

## Error Handling

All API endpoints follow a consistent error response format:

### Error Response Structure

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional context"
  }
}
```

### Common HTTP Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required or failed
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate email)
- `422 Unprocessable Entity`: Validation failed
- `500 Internal Server Error`: Server error (check logs)

### Common Error Codes

- `INVALID_INPUT`: Request validation failed
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `DUPLICATE_ENTRY`: Resource already exists
- `SYNC_FAILED`: External API sync failed
- `UPLOAD_FAILED`: File upload failed
- `EXPORT_FAILED`: Data export failed

### Rate Limiting

All endpoints are rate-limited to prevent abuse:
- **Limit**: 100 requests per minute per user
- **Header**: `X-RateLimit-Remaining` shows remaining requests
- **Response**: `429 Too Many Requests` when limit exceeded

---

## Changelog

### Version 1.0.0 (January 2024)
- Initial release with all 10 feature sets
- Team management with invite system
- Delivery company integration
- Product image management
- AI score calculation
- Clickable widgets
- Feedback separation
- Analytics section
- Cancelled orders tracking
- Product performance metrics

---

## Support

For API support or bug reports:
- Email: api-support@confirmed.com
- GitHub Issues: https://github.com/yourorg/confirmed/issues
- Documentation: https://docs.confirmed.com

---

**Last Updated**: January 25, 2024
