# Delta for Swagger Coverage

## ADDED Requirements

### Requirement: Complete Swagger Annotations for Undocumented Endpoints

The system SHALL add `@swagger` JSDoc annotations to all undocumented API endpoints. Annotations MUST include: summary, description, tags, security (where auth required), parameters, requestBody (where applicable), and responses.

#### Scenario: admin-contract — GET /users/:userId documented

- GIVEN `admin-contract.routes.ts` has `router.get('/users/:userId', ...)` without `@swagger`
- WHEN the annotation is added
- THEN it includes tags `[admin/contracts]`, security `bearerAuth`, path param `userId` (string), and 200/401/403/404 responses

#### Scenario: admin-contract — POST /:id/revoke/:userId documented

- GIVEN `admin-contract.routes.ts` has `router.post('/:id/revoke/:userId', ...)` without `@swagger`
- WHEN the annotation is added
-THEN it includes tags `[admin/contracts]`, security `bearerAuth`, path params `id` and `userId`, and 200/401/403/404 responses

#### Scenario: wallet — GET /:userId documented

- GIVEN `wallet.routes.ts` has `router.get('/:userId', ...)` (test compat) without `@swagger`
- WHEN the annotation is added
-THEN it includes tags `[wallet]`, security `bearerAuth`, path param `userId` (string), and 200/401 responses

#### Scenario: wallet — GET /:userId/transactions documented

- GIVEN `wallet.routes.ts` has `router.get('/:userId/transactions', ...)` (test compat) without `@swagger`
- WHEN the annotation is added
- THEN it includes tags `[wallet]`, security `bearerAuth`, path param `userId`, query params (page, limit, type, startDate, endDate), and 200/401 responses

#### Scenario: admin-property — POST /:id/images documented

- GIVEN `admin-property.routes.ts` has `router.post('/:id/images', uploadImages, uploadPropertyImages)` without `@swagger`
- WHEN the annotation is added
- THEN it includes tags `[admin-properties]`, security `bearerAuth`, path param `id`, `multipart/form-data` requestBody for images, and 200/400/401/403/404 responses

#### Scenario: admin-property — DELETE /:id/images/:imageIndex documented

- GIVEN `admin-property.routes.ts` has `router.delete('/:id/images/:imageIndex', ...)` without `@swagger`
- WHEN the annotation is added
- THEN it includes tags `[admin-properties]`, security `bearerAuth`, path params `id` and `imageIndex` (integer), and 200/401/403/404 responses

#### Scenario: admin-tour — POST /:id/images documented

- GIVEN `admin-tour.routes.ts` has `router.post('/:id/images', uploadImages, uploadTourImages)` without `@swagger`
- WHEN the annotation is added
- THEN it includes tags `[admin-tours]`, security `bearerAuth`, path param `id`, `multipart/form-data` requestBody for images, and 200/400/401/403/404 responses

#### Scenario: admin-tour — DELETE /:id/images/:imageIndex documented

- GIVEN `admin-tour.routes.ts` has `router.delete('/:id/images/:imageIndex', ...)` without `@swagger`
- WHEN the annotation is added
- THEN it includes tags `[admin-tours]`, security `bearerAuth`, path params `id` and `imageIndex` (integer), and 200/401/403/404 responses

#### Scenario: landing-public — GET /product/debug/:id documented

- GIVEN `landing-public.routes.ts` has `router.get('/product/debug/:id', ...)` without `@swagger`
- WHEN the annotation is added
- THEN it includes tags `[public]`, no security, path param `id`, and 200 responses

### Requirement: Swagger Annotation Consistency

All new `@swagger` annotations MUST follow the existing project convention: bilingual summaries (English/Spanish), `bearerAuth` security where auth middleware is present, and response codes matching actual controller behavior.

#### Scenario: Bilingual summary format

- GIVEN a new annotation is added to an admin endpoint
- WHEN the summary field is written
- THEN it uses the format: `"Summary in English / Resumen en español"`

#### Scenario: Security annotation matches auth middleware

- GIVEN an endpoint applies `authenticate` and `requireAdmin` middleware
- WHEN the `@swagger` security block is written
- THEN it includes `security: [{ bearerAuth: [] }]`

## REMOVED Requirements

None.

## RENAMED Requirements

None.
