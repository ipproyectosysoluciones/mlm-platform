# Delta for Sprint 18 — Postman Collection Sync & CI/CD Auto-Deploy

## New Capabilities

### postman-collection-sync

Automated regeneration and maintenance of Postman collection from the Swagger/OpenAPI spec exported by `backend/scripts/export-swagger.mjs`.

---

#### Requirements

| ID | Requirement | Strength |
|----|-------------|----------|
| PCS-1 | The system SHALL regenerate the Postman collection from Swagger export on every sprint cycle | MUST |
| PCS-2 | The regenerated collection SHALL cover 100% of endpoints defined in the Swagger spec | MUST |
| PCS-3 | Every endpoint in the collection SHALL include `pm.test` status code assertions | SHOULD |
| PCS-4 | The Login endpoint SHALL include a pre-request/test script that stores the JWT token in collection variables | MUST |
| PCS-5 | Authenticated endpoints SHALL include the `Authorization: Bearer {{token}}` header automatically | MUST |
| PCS-6 | The collection SHALL use environment variables from `MLM-Development.postman_environment.json` | MUST |

#### Scenarios

**PCS-1: Regeneration via export script**

- GIVEN the backend server is running or `backend/scripts/export-swagger.mjs` can be executed standalone
- WHEN the export script runs (`node scripts/export-swagger.mjs`)
- THEN `backend/swagger.json` is written with the full OpenAPI spec
- AND the path count matches the live API routes

**PCS-2: Postman import from exported Swagger**

- GIVEN `backend/swagger.json` exists and is current
- WHEN the file is imported via Postman Import or `swagger-to-postman` CLI
- THEN the resulting collection contains all endpoints from the spec
- AND endpoint count equals 224 (or current Swagger count)
- AND collection is saved to `postman/MLM-API.postman_collection.json`

**PCS-3: Test scripts for status codes**

- GIVEN any endpoint in the regenerated collection
- WHEN the endpoint response is received
- THEN a `pm.test` assertion verifies the expected HTTP status code (200, 201, 400, 401, 403, 404 as appropriate)

**PCS-4: Login token capture**

- GIVEN the Login endpoint request completes with HTTP 200
- WHEN the test script runs
- THEN `pm.collectionVariables.set('token', data.data.token)` is executed
- AND subsequent authenticated requests can reference `{{token}}`

**PCS-5: Auth header injection**

- GIVEN any endpoint requiring authentication (all `/admin/*`, `/users/me/*`, `/carts/*`, etc.)
- WHEN the request is prepared
- THEN the `Authorization: Bearer {{token}}` header is present

**PCS-6: Environment variables**

- GIVEN the `MLM-Development.postman_environment.json` is loaded
- WHEN requests use `{{baseUrl}}`, `{{token}}`, `{{adminEmail}}`, `{{adminPassword}}`
- THEN values resolve from the environment file
- AND `baseUrl` defaults to `http://localhost:3000/api`

---

### cicd-auto-deploy

Automated deployment pipeline that triggers on `development` branch push, builds Docker images, deploys via SSH, and verifies health.

---

#### Requirements

| ID | Requirement | Strength |
|----|-------------|----------|
| CDA-1 | The CD workflow SHALL trigger on push to the `development` branch | MUST |
| CDA-2 | The existing `release` branch and `v*` tag triggers SHALL remain unchanged | MUST |
| CDA-3 | The workflow SHALL build and push Docker images using existing DockerHub credentials | MUST |
| CDA-4 | The workflow SHALL deploy to the remote server via SSH after image push | MUST |
| CDA-5 | The workflow SHALL verify backend health via `GET /api/health` after deploy | MUST |
| CDA-6 | Required secrets: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `SSH_PRIVATE_KEY`, `DEPLOY_HOST`, `DEPLOY_USER` | MUST |
| CDA-7 | The workflow SHALL NOT block or modify the existing `release` deploy flow | MUST |

#### Scenarios

**CDA-1: Development branch trigger**

- GIVEN a developer pushes to the `development` branch
- WHEN the push event reaches GitHub Actions
- THEN the CD Backend workflow starts
- AND the `build-and-push-backend` job executes

**CDA-2: Release flow preserved**

- GIVEN the `cd-backend.yml` workflow is updated with `development` trigger
- WHEN a push to `release` or a `v*` tag occurs
- THEN the existing build, push, and summary steps execute identically to before

**CDA-3: Docker image build and push**

- GIVEN the workflow runs on `development` or `release`
- WHEN the `build-and-push-backend` job completes
- THEN Docker images are pushed to DockerHub with tags: `${{ github.ref_name }}` and `latest`
- AND build cache is used (`cache-from: type=gha`)

**CDA-4: SSH deploy step**

- GIVEN Docker images are pushed successfully
- WHEN the deploy job starts
- THEN an SSH connection is established to `${{ secrets.DEPLOY_HOST }}` as `${{ secrets.DEPLOY_USER }}`
- AND `docker compose -f docker-compose.prod.yml pull backend && docker compose up -d backend` is executed remotely
- AND `SSH_PRIVATE_KEY` is used for authentication

**CDA-5: Health check verification**

- GIVEN the SSH deploy command completes
- WHEN the health check step runs
- THEN `curl -sf http://${{ secrets.DEPLOY_HOST }}:3000/api/health` returns HTTP 200
- AND the workflow reports success
- IF health check fails after 3 retries (30s intervals), the workflow SHALL fail with descriptive error

**CDA-6: Secret configuration**

- GIVEN the repository has GitHub Actions secrets configured
- WHEN the workflow accesses `secrets.DOCKERHUB_USERNAME`, `secrets.DOCKERHUB_TOKEN`, `secrets.SSH_PRIVATE_KEY`, `secrets.DEPLOY_HOST`, `secrets.DEPLOY_USER`
- THEN secrets are injected securely and never logged
- AND workflow fails early if any required secret is missing

**CDA-7: Rollback strategy**

- GIVEN a failed deploy (health check fails)
- WHEN the deploy step detects failure
- THEN the previous Docker image tag (before this push) remains running
- AND the workflow exits with non-zero status
- AND manual rollback is possible via `./deploy.sh <previous-version>`

---

## Modified Capabilities

None — this change adds new capabilities only.

---

## PR3 — Quick Wins (Documentation & Code Quality)

These are not spec-level capabilities but specific deliverables.

### JSDoc Fix Requirements

| ID | Requirement | Strength |
|----|-------------|----------|
| JW-1 | All `@route` annotations in `CartController.ts` SHALL use `/api/` prefix, not `/api/v1/` | MUST |
| JW-2 | All `@route` annotations in `EmailCampaignController.ts` SHALL use `/api/` prefix, not `/api/v1/` | MUST |

#### Scenarios

**JW-1: CartController JSDoc correction**

- GIVEN `CartController.ts` has `@route` annotations with `/api/v1/carts/...`
- WHEN the file is reviewed post-fix
- THEN all `@route` lines show `/api/carts/...` (no `/v1/` prefix)
- AND affected lines: `getMyCart` (line ~22), `addItemToCart` (line ~55), `removeItemFromCart` (line ~98), `updateCartItemQuantity` (line ~141), `getCartByRecoveryToken` (line ~193), `recoverCartByToken` (line ~241), `listAbandonedCarts` (line ~297)

**JW-2: EmailCampaignController JSDoc correction**

- GIVEN `EmailCampaignController.ts` has `@example` block with `/api/v1/email-templates`
- WHEN the file is reviewed post-fix
- THEN the `@example` shows `/api/email-templates` (no `/v1/` prefix)
- AND all function-level `@param` annotations remain accurate

### CHANGELOG Requirements

| ID | Requirement | Strength |
|----|-------------|----------|
| CL-1 | A new version section SHALL be added to `CHANGELOG.md` following Keep a Changelog format | MUST |
| CL-2 | The section SHALL cover: Postman collection sync, CI/CD auto-deploy, JSDoc fixes, CodeQL re-scan | MUST |
| CL-3 | The version SHALL follow semantic versioning based on scope assessment | SHOULD |

#### Scenarios

**CL-1: CHANGELOG version entry**

- GIVEN `CHANGELOG.md` exists with latest entry `[3.2.0]`
- WHEN the sprint 18 changes are documented
- THEN a new section is added above `[3.2.0]` with version `[3.3.0]` (or appropriate bump)
- AND the section includes `### Added` with subsections for each PR
- AND the format matches existing Keep a Changelog convention used in the file

**CL-2: Content coverage**

- GIVEN the CHANGELOG section is created
- WHEN reviewed for completeness
- THEN it includes: Postman collection regeneration (PR1), CI/CD auto-deploy on development branch (PR2), JSDoc `/v1/` fix (PR3), CodeQL re-scan confirmation (PR3)

---

## Risks

| Risk | Mitigation |
|------|------------|
| Swagger export may be incomplete if routes aren't fully decorated with `@swagger` annotations | Validate endpoint count before and after regeneration |
| SSH key for auto-deploy could be compromised | Use GitHub Secrets, rotate quarterly, limit deploy user permissions |
| Health check could false-positive if backend starts but DB is unreachable | Consider adding DB connectivity to health endpoint in future sprint |
| CHANGELOG version bump may conflict with other concurrent sprints | Coordinate version numbering at sprint planning |
