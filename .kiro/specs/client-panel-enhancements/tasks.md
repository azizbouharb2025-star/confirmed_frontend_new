# Implementation Plan: Client Panel Enhancements

## Overview

This implementation plan breaks down the 10 major client panel enhancements into compact, actionable tasks. Each task combines related work to minimize overhead while maintaining clear deliverables.

## Tasks

- [x] 1. Team Management - Data Models & API
  - Create types/team.ts with TeamMember, Operator, TeamInvitation interfaces
  - Implement API routes: POST /api/team/invite, GET /api/team/members, PATCH /api/team/accept/:token, DELETE /api/team/members/:id
  - Create services/teamService.ts with invitation workflow logic
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ]* 1.1 Write property tests for team management
  - Property 1: Team invitation status initialization
  - Property 2: Team invitation acceptance state transition
  - Property 3: Team member display completeness
  - Property 4: Operator filtering
  - Property 5: Operator card completeness

- [x] 2. Team Management - UI Components
  - Create TeamManagementPage with "Mon équipe" and "Opérateurs" tabs
  - Create TeamMemberCard, OperatorCard, and InviteTeamMemberModal components
  - Integrate into app/panel/client/team/page.tsx
  - _Requirements: 1.1, 1.2, 1.4, 1.5, 1.6_

- [x] 3. Internationalization - Setup & Translation Keys
  - Add all translation keys to lib/i18n.ts (team, delivery, analytics, products, cancellations)
  - Provide French, English, and Arabic translations
  - Create LanguageSelector component with localStorage persistence
  - Implement RTL layout support for Arabic
  - _Requirements: 3.1, 3.5, 3.6, 3.8_

- [ ]* 3.1 Write property tests for i18n
  - Property 10: UI translation consistency
  - Property 11: Language preference persistence
  - Property 12: Hardcoded string detection

- [x] 4. Internationalization - Navbar & Landing Page
  - Update components/dashboard/Navbar with i18n keys and enlarged logo (30% bigger)
  - Update landing page (app/page.tsx) with i18n keys
  - Add LanguageSelector to navbar
  - _Requirements: 3.2, 3.3, 3.4_

- [x] 5. Delivery Company - Data Models & API
  - Create types/delivery.ts with DeliveryProvider, DeliveryProviderConfig interfaces
  - Implement API routes: POST/GET/DELETE /api/delivery/providers, POST /api/delivery/sync/:providerId
  - Create services/deliveryService.ts with encryption utilities and status mapping
  - _Requirements: 2.1, 2.2, 2.4, 2.5, 2.7_

- [ ]* 5.1 Write property tests for delivery integration
  - Property 6: Delivery provider credential encryption
  - Property 7: Delivery status synchronization
  - Property 8: Multiple delivery provider support
  - Property 9: Delivery API interaction logging

- [x] 6. Delivery Company - UI Components
  - Create DeliveryCompanyPanel, DeliveryProviderCard, DeliveryProviderConfigModal components
  - Update app/panel/client/delivery-company/page.tsx
  - _Requirements: 2.1, 2.2, 2.5_

- [x] 7. Product Images - Models, API & UI
  - Add imageUrl and imageUploadedAt to types/product.ts
  - Implement API routes: POST/DELETE /api/products/:id/image
  - Create ProductImageDisplay and ProductImageUpload components
  - Integrate into app/panel/client/products/page.tsx
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [ ]* 7.1 Write property tests for product images
  - Property 13: Product image rendering
  - Property 14: Image format support
  - Property 15: Image upload validation

- [x] 8. AI Score - Service & UI
  - Add aiScore and riskLevel fields to types/order.ts
  - Create services/aiScoreService.ts with calculateAIScore function and mock fallback
  - Create AIScoreColumn and AIScoreFilter components
  - Update app/panel/client/orders/page.tsx with AI Score column
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

- [ ]* 8.1 Write property tests for AI score
  - Property 16: AI score range constraint
  - Property 17: AI score color coding
  - Property 18: AI score calculation factors
  - Property 19: AI score sorting

- [x] 9. Clickable Widgets - Component & Detail Pages
  - Create ClickableWidget component (extends MetricCard)
  - Update dashboard to use ClickableWidget
  - Create detail pages: app/panel/client/details/orders-received/page.tsx, orders-confirmed/page.tsx, revenue/page.tsx, delivery-success/page.tsx
  - Include breadcrumb navigation and charts
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [ ]* 9.1 Write property tests for widgets
  - Property 20: Widget navigation
  - Property 21: Widget detail page relevance
  - Property 22: Order widget filtering
  - Property 23: Revenue widget breakdown

- [x] 10. Feedback Separation - Models, API & UI
  - Create types/feedback.ts with HumanFeedback and AIFeedback interfaces
  - Implement API routes: GET /api/feedback/:orderId, GET /api/feedback/summary
  - Create FeedbackDisplay, HumanFeedbackCard, AIFeedbackCard components
  - Update components/orders/OrderDetailPanel with feedback display
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ]* 10.1 Write property tests for feedback
  - Property 24: Feedback source separation
  - Property 25: Human feedback completeness
  - Property 26: AI feedback completeness
  - Property 27: Feedback source filtering

- [x] 11. Analytics Section - Models, API & UI
  - Create types/analytics.ts with TimeRange, GlobalMetrics, TrendData interfaces
  - Implement API routes: GET /api/analytics/global, GET /api/analytics/operator-feedback, POST /api/analytics/export
  - Create app/panel/client/analytics/page.tsx with OperatorFeedbackSummary and GlobalMetricsChart components
  - Add "Feedback & Analytics" to navigation menu
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

- [ ]* 11.1 Write property tests for analytics
  - Property 28: Analytics time range filtering
  - Property 29: Operator performance average calculation
  - Property 30: Analytics trend highlighting
  - Property 31: Analytics data export

- [x] 12. Cancelled Orders - Models, API & UI
  - Add cancellation fields to types/order.ts
  - Create types/cancellation.ts with CancellationReasonData, CancellationAnalysisData interfaces
  - Implement API routes: GET /api/cancellations/summary, GET /api/cancellations/analysis
  - Create CancelledOrdersWidget and add to dashboard
  - Create app/panel/client/cancellations/page.tsx with CancellationReasonChart
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

- [ ]* 12.1 Write property tests for cancellations
  - Property 32: Cancellation reason grouping
  - Property 33: Cancellation percentage calculation
  - Property 34: Cancellation filtering

- [x] 13. Product Performance - Models, API & UI
  - Create types/productPerformance.ts with ProductPerformance interface
  - Implement API routes: GET /api/products/performance, POST /api/products/performance/export
  - Create ProductPerformanceTab, ProductPerformanceTable, ProductPerformanceChart components
  - Add "Performance" tab to app/panel/client/products/page.tsx
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 10.10_

- [ ]* 13.1 Write property tests for product performance
  - Property 35: Product performance metrics completeness
  - Property 36: Return rate calculation
  - Property 37: Product performance sorting
  - Property 38: Top performer identification
  - Property 39: Underperformer identification
  - Property 40: Product performance time filtering
  - Property 41: Product AI score averaging
  - Property 42: Product performance export

- [x] 14. Integration & Polish
  - Ensure consistent styling (dark/light mode, spacing, typography)
  - Add loading states (skeleton loaders, spinners)
  - Add error boundaries for all new pages
  - Verify mobile responsiveness
  - Accessibility audit (keyboard navigation, ARIA labels)
  - _Requirements: All_

- [x] 15. Documentation & Deployment
  - Update API documentation with all new endpoints
  - Create user guide for new features
  - Prepare database migrations
  - Set up feature flags for gradual rollout
  - _Requirements: All_

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task combines related work (models + API + UI) to reduce context switching
- All new features maintain backward compatibility with existing functionality
- Mock data is used gracefully when external APIs are unavailable
- All user-facing text uses i18n translation keys (no hardcoded strings)
- Total: 15 main tasks (down from 45) with optional property tests
