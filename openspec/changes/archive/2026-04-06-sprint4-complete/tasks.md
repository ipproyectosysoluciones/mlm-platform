# Tasks: Sprint 4 — Nexo Bot MVP + Backend Hardening + v2.0.0

## Phase 1: Infrastructure & Bootstrap

- [x] 1.1 Create `bot/` directory with `package.json` (CommonJS, ESM=false, BuilderBot + Baileys + openai + axios)
- [x] 1.2 Create `bot/Dockerfile` with Node 20 LTS base image, WORKDIR /app, EXPOSE 3002
- [x] 1.3 Create `bot/src/app.ts` — bootstrap BaileysProvider, HttpServer, register all flows, listen on port 3002
- [x] 1.4 Configure `experimentalStore=true` and `timeRelease=10800000` (3h session) in BaileysProvider
- [x] 1.5 Add nexo-bot service to `docker-compose.yml` on `mlm-network`
- [x] 1.6 Create `bot/.env.example` with all required env vars (OPENAI_API_KEY, BOT_SECRET, BACKEND_URL, N8N_WEBHOOK_URL)

## Phase 2: Bot Services

- [x] 2.1 Create `bot/src/services/mlm-api.service.ts` — axios HTTP client for backend REST API (getWalletBalance, getNetwork, getCommissions)
- [x] 2.2 Create `bot/src/services/n8n.service.ts` — axios HTTP client for n8n webhooks (scheduleVisit, humanHandoff)
- [x] 2.3 Create `bot/src/services/ai.service.ts` — OpenAI SDK client, GPT-4o, load system prompts from `prompt_kb/`, select Sophia (ES) or Max (EN) based on detected language

## Phase 3: Bot Flows

- [x] 3.1 Create `bot/src/flows/language.flow.ts` — detect language from first message (ES/EN keyword matching), allow explicit language change
- [x] 3.2 Create `bot/src/flows/welcome.flow.ts` — greeting + numbered main menu (ES + EN variants)
- [x] 3.3 Create `bot/src/flows/balance.flow.ts` — call mlm-api.service.getWalletBalance(), format "$X.XX USD", handle API errors gracefully
- [x] 3.4 Create `bot/src/flows/network.flow.ts` — call mlm-api.service.getNetwork() + getCommissions(), format downline counts and commission totals
- [x] 3.5 Create `bot/src/flows/support.flow.ts` — FAQ menu + keyword matching against KB, offer escalation option
- [x] 3.6 Create `bot/src/flows/schedule.flow.ts` — conversational form (name → email → property → date → time → confirm), call n8n.service.scheduleVisit() on confirm
- [x] 3.7 Create `bot/src/flows/handoff.flow.ts` — collect reason/context, call n8n.service.humanHandoff(), confirm to user that agent will respond
- [x] 3.8 Create `bot/src/flows/agent.flow.ts` — GPT-4o fallback: call ai.service with user message + KB context, return AI response; if AI unsure → trigger handoff

## Phase 4: n8n Automation

- [x] 4.1 Configure n8n webhook `POST /webhook/schedule-visit` workflow — receive payload, create Google Calendar event, create Notion CRM lead, return 200
- [x] 4.2 Configure n8n webhook `POST /webhook/human-handoff` workflow — receive payload, create Notion CRM escalation record, send agent notification, return 200
- [x] 4.3 Create `docs/N8N-SETUP.md` — complete setup guide for n8n workflows, Google Calendar OAuth, Notion API token, env vars required

## Phase 5: Backend Additions

- [x] 5.1 Create `backend/src/middleware/bot.middleware.ts` — validate `x-bot-secret` header against `process.env.BOT_SECRET`, return 401 if invalid
- [x] 5.2 Create `backend/src/routes/bot.routes.ts` — `POST /bot/notify` (proactive message), `GET /bot/status` (bot health), all protected by bot.middleware
- [x] 5.3 Create `backend/src/controllers/BotController.ts` — handlers: notifyUser() sends message via bot HTTP API, getStatus() returns bot health
- [x] 5.4 Create `backend/src/routes/achievement.routes.ts` — `GET /achievements` (all), `GET /achievements/:userId` (user achievements), auth required
- [x] 5.5 Create `backend/src/routes/leaderboard.routes.ts` — `GET /leaderboard` with pagination (page, limit, period), auth required
- [x] 5.6 Modify `backend/src/models/index.ts` — add Achievement.hasMany(UserAchievement), UserAchievement.belongsTo(Achievement), Badge associations, User.hasMany(UserAchievement)
- [x] 5.7 Register achievement, leaderboard and bot routes in `backend/src/routes/index.ts`

## Phase 6: Frontend Tests

- [x] 6.1 Create `frontend/src/components/leaderboard/__tests__/Podium.test.tsx` — 12 tests: renders podium, top 3 positions, <3 users case, avatars, scores, tie scenarios
- [x] 6.2 Create `frontend/src/components/leaderboard/__tests__/RankingTable.test.tsx` — 12 tests: row rendering, pagination, current user row highlight, all columns present, empty state
- [x] 6.3 Create `frontend/src/components/leaderboard/__tests__/UserRankBanner.test.tsx` — 8 tests: user data display, rank position, rank change up/down/neutral, loading state
- [x] 6.4 Create `frontend/src/pages/__tests__/AchievementsPage.test.tsx` — 12 tests: page renders, achievement list, locked vs unlocked state, badge display, loading state, error state
- [x] 6.5 Extend `frontend/src/__tests__/services.test.ts` — add 9 tests for achievement service (getAchievements, getUserAchievements) and leaderboard service (getLeaderboard with pagination)
- [x] 6.6 Modify `frontend/vitest.config.ts` — add `singleFork: true` to fix Vitest 4 test isolation issue
- [x] 6.7 Verify all 210 frontend tests pass with `pnpm test` in frontend workspace

## Phase 7: Architecture Docs & Release

- [x] 7.1 Update `docs/ARCHITECTURE.md` — add Sprint 4 section: Nexo Bot architecture, n8n integration, bot ↔ backend communication, version bumped to v2.0.0
- [x] 7.2 Merge `development → release → main` via PR workflow
- [x] 7.3 Create tag `v2.0.0` on main
- [x] 7.4 Publish GitHub Release v2.0.0 with changelog

---

## Summary

| Phase | Tasks | Status |
|-------|-------|--------|
| 1. Infrastructure | 6 | ✅ All complete |
| 2. Bot Services | 3 | ✅ All complete |
| 3. Bot Flows | 8 | ✅ All complete |
| 4. n8n Automation | 3 | ✅ All complete |
| 5. Backend Additions | 7 | ✅ All complete |
| 6. Frontend Tests | 7 | ✅ All complete |
| 7. Docs & Release | 4 | ✅ All complete |
| **Total** | **38** | **✅ 38/38** |

## PRs Merged

- **#52** — `fix(backend): sprint4 backend fixes and integration tests`
- **#53** — `test(frontend): increase test coverage from 155 to 210 tests`
- **#54** — `docs(architecture): update ARCHITECTURE.md for v2.0.0`

## Implementation Notes

- Bot is CommonJS (not ESM) per `openspec/config.yaml` rule `apply.bot-code-must-be-commonjs`
- GPT-4o agents use private KB files in `prompt_kb/` (gitignored)
- n8n runs on `mlm-network` Docker network, port 5678 (internal only)
- `singleFork: true` was the critical fix to get Vitest 4 tests to pass reliably in CI
- Achievement/Badge/UserAchievement model associations were missing from Sprint 3 implementation
