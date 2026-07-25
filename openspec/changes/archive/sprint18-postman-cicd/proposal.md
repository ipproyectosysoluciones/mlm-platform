# Proposal: Sprint 18 - Postman Collection Sync & CI/CD Auto-Deploy

## Intent
- **Problem**: Postman collection is 56% synced (126/224 endpoints), 10 sprints behind, causing manual testing gaps and API contract drift. CI/CD only deploys on `release` branch/tags, delaying development feedback loops.
- **Opportunity**: Automate collection regeneration from Swagger and enable auto-deploy on `development` branch to improve developer velocity and API quality.
- **Why now**: Technical debt accumulation risk; development team blocked on manual Postman updates; deployment friction slows feature validation.

## Scope

### In Scope
- **PR1: Postman Collection Regeneration**
  - Regenerate full collection from Swagger export using swagger-to-postman or Postman import
  - Add test scripts (pm.test assertions), pre-request scripts, variable chaining
  - Update environment file if needed
- **PR2: CI/CD Auto-Deploy**
  - Add `development` branch trigger to cd-backend.yml
  - Add SSH deploy step (appleboy/ssh-action)
  - Add health check verification after deploy
  - Keep existing `release` branch flow untouched
- **PR3: Quick Wins**
  - Fix misleading `/v1/` JSDoc comments in CartController and EmailCampaignController
  - Run CodeQL re-scan to confirm zero open alerts
  - Update CHANGELOG.md with API breaking changes section

### Out of Scope
- API Versioning (`/api/v1/` prefix) - deferred to Sprint 19
- Postman collection test coverage expansion beyond assertion basics
- Production deployment changes
- Performance optimization of deploy pipeline

## Capabilities

### New Capabilities
- `postman-collection-sync`: Automated regeneration and maintenance of Postman collection from OpenAPI/Swagger source
- `cicd-auto-deploy`: Automated deployment pipeline for development branch with health verification

### Modified Capabilities
- None (this change adds new capabilities, doesn't modify existing spec-level behavior)

## Approach
1. **Postman Sync**: Export Swagger from running app, use swagger-to-postman to regenerate collection, add test scripts for critical endpoints
2. **CI/CD Auto-Deploy**: Extend GitHub Actions workflow with `development` branch trigger, SSH deployment step, and post-deploy health check
3. **Quick Wins**: Direct code fixes and documentation updates in separate PR

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `postman/MLM-API.postman_collection.json` | Modified | Regenerated collection with full endpoint coverage |
| `postman/MLM-Development.postman_environment.json` | Modified | Updated environment variables if needed |
| `.github/workflows/cd-backend.yml` | Modified | Added development branch trigger and auto-deploy steps |
| `backend/app/Http/Controllers/CartController.php` | Modified | Fix JSDoc comments |
| `backend/app/Http/Controllers/EmailCampaignController.php` | Modified | Fix JSDoc comments |
| `CHANGELOG.md` | Modified | Add API breaking changes section |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Swagger export incomplete/inaccurate | Medium | Validate collection against actual API behavior, manual spot checks |
| SSH key compromise for auto-deploy | Low | Use GitHub Secrets, rotate keys regularly, limit SSH permissions |
| Health check false positives/negatives | Medium | Implement robust health endpoint, add retry logic, monitor deploy success rates |
| Breaking existing Postman workflows | Low | Maintain backward compatibility in collection structure |

## Rollback Plan
- **Postman**: Revert collection file to previous version; no runtime impact
- **CI/CD**: Revert cd-backend.yml changes; auto-deploy stops, manual deploy continues
- **Quick Wins**: Revert individual commits; no system impact

## Dependencies
- Swagger/OpenAPI endpoint accessible and accurate
- SSH keys configured for deployment server
- GitHub repository permissions for workflow modifications

## Success Criteria
- [ ] Postman collection covers 100% of Swagger endpoints (224/224)
- [ ] Auto-deploy triggers on `development` branch push and completes successfully
- [ ] Health check passes after development deployment
- [ ] Zero CodeQL alerts confirmed
- [ ] JSDoc comments corrected in specified controllers
- [ ] CHANGELOG updated with API breaking changes section

## Proposal question round
*Assumptions needing user review:*
1. Swagger export is current and accurate - should we validate before regeneration?
2. SSH deploy target is production-ready for development branch - is this intentional?
3. Health check endpoint exists and is reliable - need confirmation
4. JSDoc fixes are limited to two controllers - any other controllers with similar issues?
5. CHANGELOG breaking changes section format - any preferred structure?

*User can skip, correct framing, or request second round.*