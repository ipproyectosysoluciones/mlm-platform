# Design: Sprint 18 — Postman Collection Sync & CI/CD Auto-Deploy

## Technical Approach

Three independent PRs addressing API contract drift and deployment friction. PR1 regenerates the Postman collection from Swagger using `swagger-to-postman` CLI with test script injection. PR2 extends `cd-backend.yml` with `development` branch triggers, SSH deployment via `appleboy/ssh-action`, and post-deploy health verification. PR3 fixes misleading `/v1/` JSDoc annotations and adds a CHANGELOG entry.

## Architecture Decisions

### Decision: Postman Regeneration Strategy

| Option | Tradeoff | Decision |
|--------|----------|----------|
| A: Postman app import | Manual, one-time, not repeatable | Rejected |
| B: `swagger-to-postman` CLI | Scriptable, CI-integrable, idempotent | **Chosen** |
| C: Postman API collection | Requires API keys, complex auth setup | Rejected |

**Rationale**: Option B is the only approach that survives the next sprint. Add `swagger-to-postman` as a devDependency, write a `scripts/generate-postman.sh` that: (1) starts backend, (2) curls `/api-docs/swagger.json`, (3) runs `swagger-to-postman`, (4) injects test scripts via post-processing, (5) stops backend. This can run locally or in CI.

### Decision: CI/CD Deploy Method

| Option | Tradeoff | Decision |
|--------|----------|----------|
| docker-compose SSH pull | Simple, but no build verification | Rejected |
| `appleboy/ssh-action` | Dedicated GH Action, SSH key auth, timeout control | **Chosen** |
| Self-hosted runner | Full control, but infrastructure overhead | Rejected |

**Rationale**: `appleboy/ssh-action` is the industry standard for SSH-based GitHub Actions deploys. It handles key management, connection pooling, and timeout. The prod server already runs `docker-compose.prod.yml`, so we SSH in, pull the new image tag, and restart.

### Decision: Docker Image Naming

**Current state**: `cd-backend.yml` uses `${{ secrets.DOCKERHUB_USERNAME }}/mlm-backend`, but `docker-compose.prod.yml` and `deploy-backend.sh` use `ipproyectos/mlm-backend`. This mismatch means the CD workflow pushes to a different image than what prod pulls.

**Choice**: Standardize on `${{ secrets.DOCKERHUB_USERNAME }}/mlm-backend` in both workflow and compose. Update `docker-compose.prod.yml` to use a `${BACKEND_IMAGE}` variable.

## Data Flow

```
Push to development
    │
    ▼
cd-backend.yml triggers
    │
    ├── Build TypeScript (pnpm build)
    ├── Docker build + push (tag: development)
    │
    ▼
SSH to prod server
    │
    ├── docker pull $IMAGE:development
    ├── docker compose up -d backend
    │
    ▼
Health check (curl /api/health, retry 3x)
    │
    ├── 200 → success
    └── !200 → fail job, alert
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `scripts/generate-postman.sh` | Create | Swagger-to-Postman generation script |
| `postman/MLM-API.postman_collection.json` | Modify | Regenerated collection (224 endpoints) |
| `postman/MLM-Development.postman_environment.json` | Modify | Updated env vars if needed |
| `.github/workflows/cd-backend.yml` | Modify | Add development trigger, SSH deploy, health check |
| `docker-compose.prod.yml` | Modify | Parameterize `BACKEND_IMAGE` variable |
| `backend/src/controllers/CartController.ts` | Modify | Fix `/v1/` → `/api/` in 7 JSDoc `@route` lines |
| `backend/src/controllers/EmailCampaignController.ts` | Modify | Fix `/v1/` → `/api/` in 2 JSDoc lines |
| `CHANGELOG.md` | Modify | Add Sprint 18 API breaking changes section |

## Interfaces / Contracts

### CD Workflow Environment

```yaml
# Required GitHub Secrets for SSH deploy
SSH_PRIVATE_KEY: # RSA/ED25519 private key
PROD_HOST: # Production server IP/hostname
PROD_USER: # SSH user (e.g., deploy)
PROD_PATH: # Path to project on server (e.g., /opt/mlm)
```

### Health Check Contract

```bash
# Expected behavior
curl -sf http://localhost:3000/api/health
# Success: HTTP 200, body contains { status: "ok" }
# Failure: HTTP !200 or timeout → job fails
```

### Postman Generation Script Contract

```bash
# Input: running backend on localhost:3000
# Output: postman/MLM-API.postman_collection.json
# Requires: swagger-to-postman (npm), running backend
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Postman | Collection covers all Swagger endpoints | Compare endpoint count: `jq '.item[].item[].request.url.raw' collection.json \| wc -l` vs Swagger path count |
| CI/CD | Workflow triggers on development push | Push test commit to development, verify Actions run |
| CI/CD | SSH deploy completes | Verify health check passes in Actions log |
| Quick wins | JSDoc `/v1/` removed | `grep -r '/api/v1/' backend/src/controllers/` returns 0 results |
| Quick wins | CHANGELOG updated | Verify Sprint 18 section exists |

## Threat Matrix

This change involves **SSH deployment** and **VCS/PR automation** (GitHub Actions workflow modification).

| Boundary | Applicability | Design Response | RED Test |
|----------|--------------|-----------------|----------|
| Documentation-like paths | N/A — no executable Markdown/MDX paths | — | — |
| Git repository selection | N/A — workflow uses `actions/checkout@v4` default | — | — |
| Commit state | N/A — workflow triggers on push, not manual commit | — | — |
| Push state | **Applicable** — workflow triggers on branch push to `development` | Validate branch name matches `development` exactly; reject pattern wildcards | Test: push to `develop` (no 'ment') does NOT trigger deploy |
| PR commands | N/A — no explicit PR commands in workflow | — | — |
| Shell commands (SSH) | **Applicable** — SSH exec on prod server | Limit SSH commands to: `docker pull`, `docker compose up`, `curl health`. No arbitrary shell. Timeout 5min. | Test: verify SSH step fails on timeout, does not hang indefinitely |
| Subprocess (Docker) | **Applicable** — `docker compose up -d` on prod | Use `--detach` only, no `--rm`, pinned image tag. Verify container starts before health check. | Test: verify rollback if health check fails (docker compose down + previous image) |

## Migration / Rollout

1. **PR1 (Postman)**: No migration. Collection file replaces existing. Backward-compatible — users re-import.
2. **PR2 (CI/CD)**: Requires GitHub Secrets (`SSH_PRIVATE_KEY`, `PROD_HOST`, `PROD_USER`, `PROD_PATH`) to be configured BEFORE merge. Document in PR description. First deploy to development validates the pipeline.
3. **PR3 (Quick wins)**: No migration. JSDoc changes are documentation-only.

**Rollback**: All PRs are independently revertible. CI/CD revert stops auto-deploy; manual deploy continues.

## Open Questions

- [ ] Confirm SSH credentials exist for prod server — who has access?
- [ ] Should health check failure trigger automatic rollback (docker compose down + previous tag)?
- [ ] Is `ipproyectos/mlm-backend` the correct Docker Hub org, or should we migrate to `${{ secrets.DOCKERHUB_USERNAME }}` everywhere?
- [ ] Does the development server have the same `/api/health` endpoint as production?
