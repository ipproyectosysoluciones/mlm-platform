# Tasks: Wallet Integration — Continue (Remaining Implementation)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~2,400–2,800 (9 work units) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1→2→3→4→5→6→7→8→9 (feature-branch-chain) |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | WalletService core (createWithdrawal + processDailyPayouts auto + config endpoint + env) | PR 1 | `cd backend && pnpm test` | Real DB + mocked gateway | `WalletService.ts`, `env.ts`, `wallet.routes.ts` — revert removes core logic, config endpoint |
| 2 | Admin approval + notifications (approve/reject/list + WalletNotificationService) | PR 2 | `cd backend && pnpm test` | Supertest integration | `AdminWalletController.ts`, `WalletNotificationService.ts`, `admin-wallet.routes.ts` |
| 3 | Gateway sync (syncFromGateway + webhook + poll + scheduler sweeps) | PR 3 | `cd backend && pnpm test` | Mocked PayPal + webhook raw body | `PayoutWebhookController.ts`, `webhook-payout.routes.ts`, SchedulerService sweeps |
| 4 | Transaction type mapping (backend filter translation) | PR 4 | `cd backend && pnpm test` | Mocked WalletTransaction.findAndCountAll | `WalletService.ts` getTransactions typeMap |
| 5 | Frontend: WithdrawalForm + Config + Types | PR 5 | `cd frontend && pnpm test:run && pnpm lint && tsc -b --noEmit` | MSW `/wallet/config` | `WithdrawalForm.tsx`, `walletStore.ts`, `api/wallet.ts`, `types/wallet.ts` |
| 6 | Frontend: Admin Pages | PR 6 | `cd frontend && pnpm test:run && pnpm lint && tsc -b --noEmit` | MSW admin endpoints | `WalletWithdrawalsPage.tsx`, `WithdrawalApprovalModal.tsx` |
| 7 | Frontend: Integration polish + cleanup | PR 7 | `cd frontend && pnpm test:run && pnpm lint && tsc -b --noEmit && pnpm build` | N/A (polish only) | `walletStore.ts`, `api/wallet.ts` cleanup |
| 8 | E2E Fix #347 + test env flags | PR 8 | `cd frontend && pnpm test:e2e` | Playwright with flags ON | `wallet.spec.ts`, `.env.test` files |
| 9 | Integration verification + production flag check | PR 9 | Full suite: `cd backend && pnpm test && cd ../frontend && pnpm test:run && pnpm test:e2e` | Manual + automated | Docs, CHANGELOG, flag verification |

---

## Phase 1 · PR 1: WalletService Core + Config + Env

**Goal**: `createWithdrawal` validation completa, `processDailyPayouts` modo auto con presupuesto, `GET /wallet/config`, env.ts extendido.

### Tasks

- [x] 1.1 RED: Tests `backend/src/__tests__/unit/wallet/createWithdrawal.validation.test.ts`
  - Casos: INVALID_DESTINATION (email inválido, ausente), LIMIT_EXCEEDED (max por retiro, max diario UTC), INSUFFICIENT_BALANCE, MINIMUM_AMOUNT, destino inmutable (no hay update endpoint)
  - Mock `WithdrawalRequest`, `Wallet`, `WalletTransaction`; tabla de casos Given/When/Then
- [x] 1.2 RED: Tests `backend/src/__tests__/unit/wallet/processDailyPayouts.auto.test.ts`
  - Modo manual: flip approved→paid sin gateway
  - Modo auto: delega en gateway, presupuesto check, en-flight lock, idempotencia (2da corrida no reenvía), presupuesto agotado → queda approved en cola, presupuestos independientes por pasarela
  - Mock `PayoutGateway` (jest.mock `services/payouts`)
- [x] 1.3 GREEN: `backend/src/services/WalletService.ts` — `createWithdrawal(userId, amount, destination)` implementación completa
  - Validación 1-6 (ver spec wallet-payouts delta)
  - Transacción: crear WithdrawalRequest{pending, destination, gateway:'paypal'} + debitar wallet + txs fee/withdrawal
- [x] 1.4 GREEN: `backend/src/services/WalletService.ts` — `processDailyPayouts()` manual|auto + presupuesto + en-flight + lock
  - Auto: FIFO por createdAt, budget check por gateway (paid + en-flight hoy UTC), transacción + SELECT FOR UPDATE re-read, gateway.createPayout, persiste gatewayPayoutId + gatewayStatus='SENT'
  - Error gateway → status=failed + notificar best-effort
- [x] 1.5 GREEN: `backend/src/config/env.ts` — añade `wallet.payoutMode`, `budgetPaypal`, `budgetMercadopago`, `maxWithdrawal`, `maxWithdrawalDailyPerUser`, `pollCron`, `minWithdrawal`, `feePercentage`, `paypalPayoutWebhookId`, `mercadopagoPayoutWebhookId` con defaults
  - Actualizar `.env.example`, `.env.production.example`
- [x] 1.6 GREEN: `backend/src/controllers/WalletController.ts` — `getConfig()` handler + `backend/src/routes/wallet.routes.ts` GET /config (authenticateToken + featureGuard)
- [x] 1.7 Verificar: `cd backend && pnpm test:coverage` (≥65%), `pnpm lint`, `tsc --noEmit -p tsconfig.check.json` limpio

---

## Phase 2 · PR 2: Admin Approval + Notifications

**Goal**: Endpoints admin (list/approve/reject) con SELECT FOR UPDATE, 409 en doble approve, WalletNotificationService (Brevo best-effort + retry sweep).

### Tasks

- [x] 2.1 RED: Supertest `backend/src/__tests__/integration/admin-wallet.routes.test.ts`
  - 403 no-admin, 409 doble aprobación, reject sin razón 400, retry failed→approved, paginación con filtros, destino visible en respuesta
- [x] 2.2 GREEN: `backend/src/services/WalletService.ts` — `approveWithdrawal(id, adminId)` / `rejectWithdrawal(id, adminId, reason)` / `listWithdrawals(params)`
  - approve: transacción + SELECT FOR UPDATE, solo pending→approved o failed→approved, 409 en otra transición, persiste approvedBy/approvedAt
  - reject: transacción + SELECT FOR UPDATE, solo pending→rejected, rejectionReason requerido (400), persiste rejectedBy/rejectedAt/rejectionReason
  - list: paginado + filtros status/gateway + join user + destination
- [x] 2.3 RED: Tests `backend/src/__tests__/unit/wallet/WalletNotificationService.test.ts`
  - notifyWithdrawalStatus: each status (approved/paid/rejected/failed) calls correct Brevo template with correct params
  - Brevo failure: does not throw, state persists, lastNotifiedStatus not updated
  - retryPendingNotifications: finds lastNotifiedStatus ≠ status, retries, updates tracking on success
- [x] 2.4 GREEN: `backend/src/services/WalletNotificationService.ts` (nuevo)
  - `notifyWithdrawalStatus(withdrawal, status)` para approved/paid/rejected/failed
  - Best-effort: try/catch, log warning, NO throw, estado ya persistido
  - Tracking: `lastNotifiedStatus`, `lastNotifiedAt` en WithdrawalRequest
  - `retryPendingNotifications()`: encuentra `lastNotifiedStatus ≠ status`, reintenta
- [x] 2.5 GREEN: `backend/src/controllers/AdminWalletController.ts` + `backend/src/routes/admin-wallet.routes.ts` (featureGuard + authenticate + requireAdmin + adminLimiter) + mount en `backend/src/routes/index.ts`
- [x] 2.6 Verificar: `cd backend && pnpm test && pnpm lint`

---

## Phase 3 · PR 3: Gateway Sync (Webhook + Poll + Scheduler Sweeps)

**Goal**: `syncFromGateway`/`syncPayoutStatuses` idempotentes con lock, `PayoutWebhookController` (firma + idempotencia), webhook routes, SchedulerService sweeps (poll + notif retry).

### Tasks

- [x] 3.1 RED: Tests `backend/src/__tests__/unit/wallet/syncFromGateway.test.ts`
  - paid SOLO con confirmación + lock + gatewayPayoutId matching
  - failed
  - duplicado webhook (WebhookEvent) → ignorado
  - firma inválida → 403
  - transiciones ilegales rechazadas (status ≠ approved, payoutId mismatch)
- [x] 3.2 GREEN: `backend/src/services/WalletService.ts` — `syncFromGateway(payoutId, status)` + `syncPayoutStatuses()`
  - transacción + lock, paid+processedAt/failed, lastGatewaySyncAt
  - syncPayoutStatuses: itera approved con gatewayPayoutId, llama gateway.getStatus, syncFromGateway
- [x] 3.3 GREEN: `backend/src/controllers/PayoutWebhookController.ts` + `backend/src/routes/webhook-payout.routes.ts` (sin featureGuard, raw body) + mount `/payment/paypal/payout-webhook`
  - verifyWebhookSignature (PayPalService)
  - idempotencia WebhookEvent (event_id + provider unique)
  - mapea eventos PAYOUTS.* → syncFromGateway
  - MercadoPago placeholder route → NotImplementedError
- [x] 3.4 GREEN: `backend/src/services/SchedulerService.ts` — añade sweeps condicionales (solo auto mode + feature ON)
  - Poll sweep: `WALLET_PAYOUT_POLL_CRON` → `syncPayoutStatuses()`
  - Notification retry: `*/30 * * * *` → `walletNotificationService.retryPendingNotifications()`
- [x] 3.5 Verificar: `cd backend && pnpm test && pnpm lint`
- [x] 3.6 (Optional split - not needed) Si PR >400 líneas: dividir en 3a (syncFromGateway + webhook) / 3b (poll + scheduler)

---

## Phase 4 · PR 4: Transaction Type Mapping

**Goal**: `getTransactions` mapea `commission`→`commission_earned`, `refund`→`adjustment`. Backend-only — frontend sends legacy values, backend maps transparently (per spec: NO frontend enum change required).

### Tasks

- [x] 4.1 RED: Tests `backend/src/__tests__/unit/wallet/getTransactions.typeMap.test.ts`
  - `commission` → `where.type = 'commission_earned'`
  - `refund` → `where.type = 'adjustment'`
  - `commission_earned` → `where.type = 'commission_earned'` (pass-through)
  - `adjustment` → `where.type = 'adjustment'` (pass-through)
  - sin type → sin filtro
  - Verificar `where.type` en `WalletTransaction.findAndCountAll` mockeado
- [x] 4.2 GREEN: Mapa de tipos en `backend/src/services/WalletService.ts` — `getTransactions()` typeMap implementation
- [x] 4.3 Verificar: `cd backend && pnpm test && pnpm lint`

---

## Phase 5 · PR 5: Frontend — WithdrawalForm + Config + Types

**Goal**: WithdrawalForm con selector pasarela, destino, fee/min/max desde API; WalletConfig type; eliminar hardcodes.

### Tasks

- [x] 5.1 RED: Vitest `frontend/src/__tests__/WithdrawalForm.test.tsx` (MSW `/wallet/config`)
  - Selector pasarela (PayPal visible, MP placeholder disabled)
  - Validación destino por pasarela (email para PayPal)
  - Fee/mínimo/topes desde API (no hardcodes)
  - Envío con `destination: { email }`
  - Backend errors displayed: INVALID_DESTINATION, LIMIT_EXCEEDED, INSUFFICIENT_BALANCE, MINIMUM_AMOUNT
- [x] 5.2 GREEN: `frontend/src/types/wallet.ts` — `WalletConfig`, `WithdrawalDestination`, `WithdrawalStatus` with `'paid'` (not `'processed'`), `AdminListWithdrawalsParams/Response`
- [x] 5.3 GREEN: `frontend/src/services/api/wallet.ts` — `withdraw({amount, destination})`, `getConfig()`, métodos admin (`adminListWithdrawals`, `adminApproveWithdrawal`, `adminRejectWithdrawal`)
- [x] 5.4 GREEN: `frontend/src/stores/walletStore.ts` — `config` state, `fetchWalletConfig()`, `createWithdrawal(amount, destination)`, `useWalletConfig` selector hook
- [x] 5.5 GREEN: `frontend/src/components/WithdrawalForm.tsx` — config-driven (fetches /wallet/config), PayPal email destination field, dynamic min/max/fee from API, backend error mapping
- [x] 5.6 GREEN: `frontend/src/components/WithdrawalModal.tsx` — shows PayPal destination email, passes destination to createWithdrawal
- [x] 5.7 Verificar: `cd frontend && pnpm test:run && pnpm lint && tsc -b --noEmit`

---

## Phase 6 · PR 6: Frontend — Admin Pages

**Goal**: `WalletWithdrawalsPage` (tabla paginada, filtros) + `WithdrawalApprovalModal` (destino prominente, cancel no cambia estado).

### Tasks

- [x] 6.1 RED: Vitest `frontend/src/__tests__/admin/WalletWithdrawalsPage.test.tsx` + `WithdrawalApprovalModal.test.tsx`
  - Page: render tabla, paginación, filtros, botón aprobar abre modal
  - Modal: muestra destino prominente, approvalComment opcional, cancel no llama API
- [x] 6.2 GREEN: `frontend/src/pages/admin/WalletWithdrawalsPage.tsx` (nuevo)
  - Tabla con columnas: user, requestedAmount, feeAmount, netAmount, status, destination, gateway, createdAt, actions
  - Filtros: status, búsqueda usuario
  - Paginación: page/limit, usa `walletService.adminListWithdrawals`
- [x] 6.3 GREEN: `frontend/src/components/admin/WithdrawalApprovalModal.tsx` (nuevo)
  - Detalles: user, amount, fee, net, **destination email grande**, gateway, createdAt
  - approvalComment textarea opcional
  - Confirmar → `walletService.adminApproveWithdrawal(id, { approvalComment })`
  - Cancelar → close sin petición
- [x] 6.4 GREEN: `frontend/src/utils/featureFlags.ts` — doc enablement path (comentario, sin activar)
- [x] 6.5 Verificar: `cd frontend && pnpm test:run && pnpm lint && tsc -b --noEmit`

---

## Phase 7 · PR 7: Frontend — WalletStore + API Integration Polish

**Goal**: Integración completa walletStore + API, tipos consistentes, limpieza de código legacy.

### Tasks

- [x] 7.1 GREEN: `frontend/src/stores/walletStore.ts` — asegurar `createWithdrawal` y `fetchWalletConfig` integrados en UI
- [x] 7.2 GREEN: `frontend/src/services/api/wallet.ts` — types consistentes con backend (WithdrawalRequest, AdminWithdrawalsResponse)
- [x] 7.3 GREEN: Limpiar imports no usados, `// TODO:` comments en código pendiente
- [x] 7.4 Verificar: `cd frontend && pnpm test:run && pnpm lint && tsc -b --noEmit && pnpm build`

---

## Phase 8 · PR 8: E2E Fix #347 + Test Env

**Goal**: `wallet.spec.ts` pasa íntegro con flags ON en test env, assertions reales, sin `.catch` vacuo.

### Tasks

- [x] 8.1 GREEN: `frontend/.env.test` (nuevo) — `VITE_FEATURE_CRYPTO_WALLET=true`
- [x] 8.2 GREEN: Backend test env (CI / `.env.test`) — `FEATURE_CRYPTO_WALLET=true`, `WALLET_PAYOUT_MODE=manual`
- [x] 8.3 GREEN: `frontend/e2e/wallet.spec.ts` fix #347
  - Habilitar flags en test config (playwright.config.ts webServer env o .env.test)
  - Reemplazar tests vacíos con assertions reales:
    - Crear retiro con email destino → verifica 201 + destination en respuesta
    - Listar retiros en admin → verifica destination visible
    - Aprobar retiro → verifica status=approved
    - (modo manual) Verifica job/flip o sync manual → paid
  - Eliminar TODOS los `.catch(() => {})` / `try { } catch { }` vacuos
- [x] 8.4 Verificar: `cd frontend && pnpm test:e2e` (suite wallet pasa completa)
- [x] 8.5 Full test: `cd backend && pnpm test && cd ../frontend && pnpm test:run && pnpm test:e2e` + cobertura ≥65%

---

## Phase 9 · PR 9: Integration Verification + Polish

**Goal**: Verificación end-to-end, flags OFF en producción, docs de enablement, limpieza final.

### Tasks

- [ ] 9.1 Verificación manual: crear retiro → admin aprueba → job auto (si mode=auto) → webhook/poll → paid/failed → emails
- [ ] 9.2 Confirmar flags OFF en producción: `FEATURE_CRYPTO_WALLET` ausente/false, `VITE_FEATURE_CRYPTO_WALLET` ausente → 503 + wallet oculta
- [x] 9.3 Documentar enablement path en README o docs: envs backend+frontend+CI, credenciales PayPal Payouts, `WALLET_PAYOUT_MODE=manual` primero
- [ ] 9.4 Limpieza: eliminar `// TODO:` resueltos, actualizar CHANGELOG.md
- [ ] 9.5 Verificar rollback: flags OFF restaura comportamiento anterior sin errores nuevos
- [x] 9.6 Métricas finales: cobertura ≥65%, 0 lint errors, 0 tsc errors, build OK

---

## Work Unit Mapping to Original Phases

| Original Phase | This Change PRs |
|----------------|-----------------|
| Phase 4 (WalletService Core + Config) | PR 1 |
| Phase 5 (Admin + Notifications) | PR 2 |
| Phase 6 (Sync + Webhooks + Scheduler) | PR 3 |
| Phase 7 (Transaction Type Mapping) | PR 4 |
| Phase 8 (Frontend: destino, config, admin pages) | PRs 5, 6, 7 |
| Phase 9 (E2E Fix #347) | PR 8, 9 |

---

## Chained PR Strategy

- Branch base: `feature/wallet-integration-continue` (from `main`)
- Each PR: `feature/wallet-integration-continue-{pr-number}-{short-name}`
- PR 1 → PR 2 → PR 3 → PR 4 → PR 5 → PR 6 → PR 7 → PR 8 → PR 9
- Auto-merge disabled; cada PR requiere aprobación explícita del usuario
- Si PR >400 líneas en diff real: dividir antes de abrir (split 1a/1b, 3a/3b)

---

## Success Criteria (Aggregate)

- [x] `createWithdrawal` valida: destino, límites (max + diario UTC), saldo, mínimo, inmutable
- [x] `processDailyPayouts` auto: ejecuta vía gateway, respeta presupuesto por pasarela, idempotente
- [x] Admin approve/reject: SELECT FOR UPDATE, 409 doble approve, rejectionReason requerido
- [x] Brevo emails: approved/paid/rejected/failed; retry en sweep si falló
- [x] Webhook: firma válida, idempotencia WebhookEvent, syncFromGateway con lock
- [x] Poll sweep: `WALLET_PAYOUT_POLL_CRON` reconcilia en-flight
- [x] `getTransactions`: commission→commission_earned, refund→adjustment
- [x] Frontend: WithdrawalForm usa API config, gateway selector, destino validado
- [x] Admin pages: WalletWithdrawalsPage + WithdrawalApprovalModal con destino
- [x] E2E wallet.spec.ts: pasa con flags ON, sin `.catch` vacuo, assertions reales
- [ ] Flags OFF en producción verificadas
- [x] Cobertura ≥65% backend + frontend

---

**Change**: wallet-integration-continue
**Branch**: feature/wallet-integration-continue
**Reference**: wallet-integration (openspec/changes/wallet-integration/)
