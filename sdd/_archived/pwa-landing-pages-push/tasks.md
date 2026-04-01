# Tasks: PWA Landing Pages y Push Notifications

## Phase 1: Infrastructure (4 tasks)

- [ ] 1.1 Generate VAPID keys using `npx web-push generate-vapid-keys`
- [ ] 1.2 Add VAPID keys to `backend/.env`: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
- [ ] 1.3 Create migration `backend/database/migrations/<timestamp>-create-push-subscriptions.js` with table push_subscriptions
- [ ] 1.4 Create `backend/src/models/PushSubscription.ts` Sequelize model

## Phase 2: Core Backend (5 tasks)

- [x] 2.1 Create `backend/src/utils/vapid.ts` - VAPID key management (load from env, validate, generate)
- [x] 2.2 Create `backend/src/services/PushService.ts` - push notification sending logic with web-push
- [x] 2.3 Create `backend/src/routes/push.routes.ts` - endpoints: POST /subscribe, DELETE /unsubscribe, GET /vapid-public-key
- [x] 2.4 Add push routes to `backend/src/routes/index.ts`
- [x] 2.5 Create `backend/src/routes/landing-public.routes.ts` - GET /landing/product/:id, GET /profile/:code/products

## Phase 3: Core Frontend (4 tasks)

- [x] 3.1 Extend `frontend/vite.config.ts` with offline strategies: runtimeCaching for /landing/_ and /ref/_
- [x] 3.2 Create `frontend/src/pages/ProductLanding.tsx` - landing page component for /landing/product/:id
- [x] 3.3 Create `frontend/src/services/pushService.ts` - frontend push subscription management
- [x] 3.4 Add route `/landing/product/:id` to `frontend/src/App.tsx`

## Phase 4: Integration (3 tasks)

- [x] 4.1 Update `frontend/src/pages/PublicProfile.tsx` - add products section with fetch to /profile/:code/products
- [x] 4.2 Create `frontend/src/types/push.ts` - PushSubscription and PushNotificationPayload interfaces
- [x] 4.3 Add feature flags in `frontend/src/config/features.ts` - pwaOffline, productLanding, pushNotifications (skipped - uses env vars via import.meta.env)

## Phase 5: Testing (6 tasks)

- [x] 5.1 Write unit tests for `backend/src/services/PushService.ts` - encryption, error handling
- [x] 5.2 Write unit tests for `backend/src/utils/vapid.ts` - key generation, validation
- [x] 5.3 Write unit tests for `frontend/src/services/pushService.ts` - subscribe/unsubscribe
- [x] 5.4 Write integration test: POST /api/push/subscribe stores subscription
- [x] 5.5 Write integration test: GET /api/public/landing/product/:id returns product data
- [x] 5.6 Write E2E test: PWA install and offline functionality (Playwright)

## Phase 6: Cleanup (2 tasks)

- [x] 6.1 Update API documentation with new endpoints
- [x] 6.2 Verify feature flags disabled by default in development
