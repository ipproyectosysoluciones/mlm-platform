# Delta for API Versioning (Sprint 19)

> No existing specs. All requirements below are NEW full specs.

## ADDED Requirements — Express Router Prefix

### Requirement: Versioned Route Mount

The system SHALL mount all API routes under `/api/v1` as the canonical path prefix via Express Router.

#### Scenario: Versioned route responds correctly

- GIVEN the backend is running
- WHEN a client sends `GET /api/v1/auth/me` with a valid token
- THEN the server returns 200 with the authenticated user

#### Scenario: Legacy route still works (dual-mount)

- GIVEN the backend is running
- WHEN a client sends `GET /api/auth/me` with a valid token
- THEN the server returns 200 (backward-compatible legacy mount)

### Requirement: Rate Limiter Dual-Path Coverage

The system SHALL apply rate limiters (global, auth, order, 2FA) to both `/api` and `/api/v1` path prefixes.

#### Scenario: Rate limit applies on versioned path

- GIVEN global rate limiter is active at 200 req/min
- WHEN a client exceeds 200 requests to `/api/v1/*` within 1 minute
- THEN the server returns 429 with `RATE_LIMIT` error code

#### Scenario: Rate limit applies on legacy path

- GIVEN same configuration
- WHEN a client exceeds 200 requests to `/api/*` within 1 minute
- THEN the server returns 429 (legacy paths remain rate-limited)

### Requirement: Health Endpoint Availability

The system SHALL expose a health check at `/api/v1/health` AND `/api/health`.

#### Scenario: Versioned health check

- GIVEN the backend is running
- WHEN a client sends `GET /api/v1/health`
- THEN the server returns 200

### Requirement: Short Code Routes Unversioned

The system SHALL NOT version `/q/:shortCode` routes. These MUST remain at root level.

#### Scenario: Short code resolves without version prefix

- GIVEN a valid short code `ABC123` exists
- WHEN a client sends `GET /q/ABC123`
- THEN the server resolves it (302/200) without requiring `/api/v1/`

## ADDED Requirements — Webhook Backward Compatibility

### Requirement: Webhook 307 Redirect

The system SHALL issue HTTP 307 redirects from `/api/payment/paypal/webhook` to `/api/v1/payment/paypal/webhook` and from `/api/payment/mercadopago/webhook` to `/api/v1/payment/mercadopago/webhook` during the deprecation window.

#### Scenario: PayPal webhook legacy redirect

- GIVEN a PayPal IPN arrives at `/api/payment/paypal/webhook`
- WHEN the server receives the request
- THEN it responds with 307 and `Location: /api/v1/payment/paypal/webhook`
- AND PayPal follows the redirect to the versioned endpoint

#### Scenario: MercadoPago webhook legacy redirect

- GIVEN a MercadoPago notification arrives at `/api/payment/mercadopago/webhook`
- WHEN the server receives the request
- THEN it responds with 307 and `Location: /api/v1/payment/mercadopago/webhook`

### Requirement: General Legacy 307 Redirect

The system SHALL 307-redirect any `GET` request from `/api/{path}` to `/api/v1/{path}` for paths that exist under `/api/v1`.

#### Scenario: Non-webhook legacy redirect

- GIVEN routes are mounted under `/api/v1`
- WHEN a client sends `GET /api/users/me`
- THEN the server returns 307 with `Location: /api/v1/users/me`

## ADDED Requirements — Swagger/OpenAPI

### Requirement: Swagger UI at Versioned Path

The system SHALL serve Swagger UI at `/api/v1/docs`. The OpenAPI spec SHALL declare `/api/v1` as the server URL prefix.

#### Scenario: Swagger UI loads at new path

- GIVEN the backend is running
- WHEN a client navigates to `/api/v1/docs`
- THEN the Swagger UI renders with all endpoints listed under `/api/v1/*`

### Requirement: Legacy Docs Redirect

The system SHALL 307-redirect `/api-docs` to `/api/v1/docs`.

#### Scenario: Old docs path redirects

- GIVEN Swagger UI is at `/api/v1/docs`
- WHEN a client requests `GET /api-docs`
- THEN the server returns 307 with `Location: /api/v1/docs`

## ADDED Requirements — Frontend Client Migration

### Requirement: Frontend Base URL Update

The frontend API client `baseURL` default SHALL be `/api/v1`. Vite dev proxy SHALL rewrite `/api/v1/*` to `http://localhost:3000/api/v1/*`.

#### Scenario: Frontend calls versioned API

- GIVEN `VITE_API_URL` is unset
- WHEN the frontend SPA makes an API call
- THEN the request targets `/api/v1/{endpoint}`

#### Scenario: Vite dev proxy rewrites versioned path

- GIVEN Vite dev server is running
- WHEN the browser requests `/api/v1/auth/me`
- THEN Vite proxies to `http://localhost:3000/api/v1/auth/me`

## ADDED Requirements — Bot Client Migration

### Requirement: Bot Base URL Update

The bot `MLM_BACKEND_URL` default SHALL be `http://backend:3000/api/v1`.

#### Scenario: Bot calls versioned endpoint

- GIVEN `MLM_BACKEND_URL` is set to `/api/v1` path
- WHEN the bot calls `mlmApi.get('/bot/user-by-phone/...')`
- THEN the HTTP request targets `http://backend:3000/api/v1/bot/user-by-phone/...`

## ADDED Requirements — Test Suite Migration

### Requirement: Test URLs Use Versioned Paths

All backend integration tests SHALL use `/api/v1/*` URLs. All route-reference unit tests SHALL reference `/api/v1/*`. CI gate (tsc + jest) MUST pass.

#### Scenario: Integration test hits versioned endpoint

- GIVEN the test server is running
- WHEN an integration test sends `GET /api/v1/auth/me`
- THEN the test receives 200 (or expected status)

#### Scenario: CI gate passes

- GIVEN all tests are updated
- WHEN `pnpm test` and `tsc --noEmit` run in CI
- THEN both exit 0

## Constraints

- `/q/:shortCode` MUST NOT be versioned
- Response formats MUST NOT change — only path prefixes
- Auth/middleware logic MUST NOT change
- Dual-mount MUST exist during deprecation window — legacy removal is a separate future change

## Dependencies

- Sprint 18 (Postman sync) complete — 255-endpoint baseline
- Existing rate limiter configuration in `backend/src/app.ts`
