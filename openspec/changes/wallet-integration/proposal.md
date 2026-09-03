# Proposal: Wallet Integration — Payouts Reales (PayPal Payouts + MercadoPago Money-Out)

## Intent

La wallet de Nexo Real es hoy un ledger interno DB-only: `processDailyPayouts()` (WalletService.ts ~L355) **no ejecuta ningún pago real** — solo flipea `APPROVED → PAID` ("For MVP, we just mark as paid"). Además:

- **Sin destino de retiro**: `WithdrawalRequest` no tiene columna `destination` → el usuario no puede indicar dónde cobrar.
- **Sin aprobación admin**: `APPROVED` solo se setea en tests; el lifecycle queda atascado en `pending`.
- **Feature oculta**: `FEATURE_CRYPTO_WALLET` (backend, 503 FEATURE_DISABLED) y `VITE_FEATURE_CRYPTO_WALLET` (frontend, ruta/nav/dashboard ocultos) no están en ningún env.
- **E2E roto**: `frontend/e2e/wallet.spec.ts` (issue GitHub #347) — 7 tests fallan por flag apagada, 2 pasan vacíos (patrón `.catch` que skipea silenciosamente).
- **Bug real**: `WalletService.getTransactions()` aplica el filtro `type` verbatim; el frontend envía `commission`/`refund` pero el enum es `commission_earned`/`adjustment` → filtros siempre vacíos.

Este cambio prepara el money-out real vía las pasarelas ya operativas (PayPal sandbox + MercadoPago TEST) **sin encender producción**: toda la implementación queda lista y el switch final se decide al merge. Las decisiones de producto (sección abajo) son vinculantes.

## Scope

### In Scope
- **Schema**: migración que agrega `destination` (JSONB: `email` para PayPal, cuenta MP para MercadoPago) a `withdrawal_requests` + validación por pasarela.
- **Backend admin**: endpoints de aprobar/rechazar retiros (paginado, filtros), con **presupuesto diario configurable por pasarela** y **switch manual→auto** vía config (sin reescritura). El modal de aprobación muestra el destino para confirmación visual antes de aprobar.
- **Topes de retiro**: `WALLET_MAX_WITHDRAWAL` (por retiro) + tope diario por usuario, ambos configurables por env; además del mínimo existente `WALLET_MIN_WITHDRAWAL=20`.
- **PayoutService**: abstracción `PayoutGateway` con 2 adapters — PayPal **Payouts API** (REST, complementa PayPalService existente) y MercadoPago **money-out** (SDK 2.12.0 ya instalado). Sustituye el flip simulado manteniendo el modo manual como default.
- **Sync de estados**: webhook/poll por pasarela → `paid`/`failed`; fallos quedan `failed` con retry manual admin.
- **Notificaciones Brevo**: email al usuario cuando su retiro cambia de estado (aprobado/pagado/rechazado/fallido).
- **Bug filtros**: corregir semántica `type` en `getTransactions` + alinear frontend.
- **Frontend**: `WithdrawalForm` con campo destino según pasarela y validación; fee/mínimo leídos de API (quitar hardcode `MIN_WITHDRAWAL=20`/`FEE_PERCENTAGE=5`).
- **E2E**: reparar `wallet.spec.ts` (#347) — correr con flags ON en test env, eliminar el `.catch` vacuo.
- **Env/credenciales**: credenciales sandbox/TEST en env, documentación del enablement path.

### Out of Scope
- Encender flags en producción (decisión al merge — las implementaciones quedan listas para `FEATURE_CRYPTO_WALLET` + `VITE_FEATURE_CRYPTO_WALLET`).
- Exchange cripto: CoinGecko ya integrado **solo para precios** (CryptoPriceService, sin key) — NO es pasarela de payout.
- Recarga de wallet (depósitos), multi-moneda avanzada (USD base).
- Refunds automáticos de payout (solo estados `failed`/`rejected` manual).
- Payouts en tiempo real (solo job diario + sync de estado).

## Capabilities

> Contrato proposal → specs. La fase sdd-spec creará/actualizará estos specs.

### New Capabilities
- `wallet-payouts`: ejecución de retiros reales (PayPal Payouts + MercadoPago money-out), destino por pasarela, aprobación admin con presupuesto configurable, switch manual→auto, sync de estados y retry.
- `wallet-transactions`: semántica correcta de filtros de transacciones (enum `commission_earned`/`adjustment`) y consistencia frontend/backend.

### Modified Capabilities
- `backend`: comportamiento de los endpoints `/wallet/*` — columna `destination`, admin approve/reject, enablement path del featureGuard.
- `frontend`: Wallet UI — destino en formulario, validación por pasarela, enablement path de la flag, E2E #347.

## Approach

1. **Migración**: agregar `destination` JSONB a `withdrawal_requests` (validación: email para PayPal, cuenta MP para MercadoPago, según pasarela del retiro).
2. **PayoutService** (`backend/src/services/payouts/`): interfaz `PayoutGateway` (createPayout / getStatus / verifyWebhook) con `PayPalPayoutsGateway` (REST Payouts API) y `MercadoPagoMoneyOutGateway` (SDK existente). Ambos detrás de `authenticateToken` + `featureGuard('cryptoWallet')`.
3. **Admin**: `POST /api/admin/wallet/withdrawals/:id/approve|reject`, `GET /api/admin/wallet/withdrawals` (paginado). Presupuestos `WALLET_PAYOUT_BUDGET_PAYPAL` y `WALLET_PAYOUT_BUDGET_MERCADOPAGO` (diarios, independientes por pasarela); exceso → cola para el siguiente ciclo. `WALLET_PAYOUT_MODE=manual|auto`: en `auto`, `processDailyPayouts()` delega en el gateway y actualiza estado real; en `manual`, conserva el flujo actual. Topes: `WALLET_MAX_WITHDRAWAL` (por retiro) y `WALLET_MAX_WITHDRAWAL_DAILY_PER_USER` (diario por usuario).
4. **Bug filtros**: `getTransactions()` mapea valores frontend al enum backend; `TransactionHistory.tsx` usa los valores correctos.
5. **Frontend**: `WithdrawalForm` agrega selector de destino (email PayPal / cuenta MP) + validación; constants de fee/mínimo/topes consumidas de la API. El modal de aprobación admin muestra el destino antes de confirmar.
6. **Notificaciones Brevo**: `WalletNotificationService` envía email al usuario en cada transición de estado (aprobado/pagado/rechazado/fallido) reusando el servicio de email existente.
7. **E2E**: `wallet.spec.ts` con flags activas en test env, assertions reales, sin `.catch` silencioso.
8. **Flags**: nada se enciende en producción; documentación del paso de activación (envs backend + frontend + Vercel/CI).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `backend/src/models/WithdrawalRequest.ts` | Modified | Columna `destination` (JSONB) + validación |
| `backend/src/database/migrations/` | New | Migración `add-destination-to-withdrawal-requests` |
| `backend/src/services/WalletService.ts` | Modified | `processDailyPayouts()` con modo manual/auto; fix filtro `type`; mínimo/fee/topes desde config |
| `backend/src/services/payouts/` | New | `PayoutGateway` + adapters PayPal/MercadoPago |
| `backend/src/services/WalletNotificationService.ts` | New | Emails Brevo de cambio de estado de retiro |
| `backend/src/services/PayPalService.ts` | Modified | Reuso de cliente REST/auth; suma Payouts API |
| `backend/src/services/MercadoPagoService.ts` | Modified | Suma money-out (sin tocar checkout) |
| `backend/src/routes/wallet.routes.ts` | Modified | Destino en POST /withdraw, validación + topes |
| `backend/src/routes/admin-wallet.routes.ts` | New | Approve/reject (con confirmación de destino) + listado con presupuesto |
| `backend/src/routes/index.ts` | Modified | Montaje de rutas admin-wallet (featureGuard) |
| `backend/src/services/SchedulerService.ts` | Modified | Job diario con modo auto |
| `backend/.env*` / `.env.production` | Modified | Credenciales sandbox/TEST, `WALLET_PAYOUT_MODE`, presupuestos por pasarela, topes |
| `frontend/src/components/WithdrawalForm.tsx` | Modified | Campo destino por pasarela + validación, fee/mínimo desde API |
| `frontend/src/components/TransactionHistory.tsx` | Modified | Valores de filtro `type` correctos |
| `frontend/src/services/api/wallet.ts` | Modified | Tipos/requests de destino |
| `frontend/src/utils/featureFlags.ts` | Modified | Enablement path documentado (sin encender) |
| `frontend/e2e/wallet.spec.ts` | Modified | Fix #347: flags ON en test, sin `.catch` vacuo |
| `frontend/.env.development` / `.env.production` | Modified | Valores de flag para test/CI (no producción) |

## Product Decisions (vinculantes)

1. **Pasarelas de retiro: AMBAS** — PayPal Payouts + MercadoPago money-out. Justificación: ambas ya están integradas y operativas (pagos de reservas, credenciales sandbox/TEST); cubren el mercado LATAM (MP) e internacional (PayPal) sin agregar proveedor nuevo. CoinGecko queda documentado como fuente de precios, NO pasarela.
2. **Flags OFF en producción esta iteración** — el SDD prepara todo; el switch se decide al merge. Justificación: control de riesgo operativo/monetario; evita exponer money-out sin supervisión y sin QA real.
3. **Aprobación manual con presupuesto configurable + switch a automático** — el diseño (modo manual/auto en una config) permite migrar sin reescritura. Justificación: control humano del flujo de dinero mientras se valida; el presupuesto limita exposición por ciclo.
4. **Destino dinámico según pasarela** — email PayPal / cuenta MP, con validación por pasarela. Justificación: cada proveedor exige un identificador distinto; el schema JSONB lo soporta sin normalizar por proveedor.
5. **Presupuesto diario POR PASARELA** — `WALLET_PAYOUT_BUDGET_PAYPAL` y `WALLET_PAYOUT_BUDGET_MERCADOPAGO` independientes. Justificación: cada proveedor tiene límites y exposición distintos; permite controlar riesgo por canal sin acoplar topes.
6. **Topes por retiro + diario por usuario** — `WALLET_MAX_WITHDRAWAL` (por retiro) y `WALLET_MAX_WITHDRAWAL_DAILY_PER_USER` (diario por usuario), además del mínimo $20 existente. Justificación: limita la exposición por usuario y por operación.
7. **Confirmación de destino en el modal admin** — el admin ve el destino (email/cuenta) antes de aprobar. Justificación: mitiga desvío de pago a cuenta ajena.
8. **Notificaciones Brevo incluidas** — email al usuario en cada cambio de estado del retiro. Justificación: transparencia del flujo de dinero; Brevo ya está operativo.

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Error real al ejecutar payout (solo simulado hoy) | High | Modo manual default; sandbox/TEST primero; estados `failed` con retry manual admin |
| Doble pago por retry/desync de estados | High | Idempotencia por `withdrawalId` en el gateway; transacción DB + lock; sync por webhook y verificación de estado antes de marcar `paid` |
| Exposición monetaria sin supervisión | Med | Presupuesto diario por pasarela + topes por retiro/usuario; aprobación manual; flags OFF en producción |
| Desvío de pago a cuenta ajena (destination no verificado) | Med | Validación por pasarela + confirmación visual del destino en el modal de aprobación admin |
| Regresión en checkout PayPal/MP existente | Med | Adapters aislados; tests de regresión del flujo de reservas |
| E2E sigue fallando por env (flags de test) | Med | CI usa env de test con flags ON; issue #347 como criterio de cierre |
| Fallo de envío de email Brevo | Low | Transición de estado persiste en DB aunque el email falle; reintento en el job siguiente |
| Costo/limites de API por pasarela (quota) | Low | Manejo de errores del gateway → estado `failed`; límite por ciclo |

## Rollback Plan

1. **Feature**: apagar flags (`FEATURE_CRYPTO_WALLET=false`, `VITE_FEATURE_CRYPTO_WALLET` ausente) → vuelve el comportamiento actual (503/oculto). No requiere deploy de código si la config se lee en runtime; de lo contrario revertir el commit de envs.
2. **DB**: `sequelize-cli migration:undo` de `add-destination-to-withdrawal-requests` (columna nullable/JSONB, sin datos críticos; las solicitudes existentes no tienen destino).
3. **Código**: revertir PRs encadenados en orden inverso (frontend → admin → payouts → schema). Los retiros ya pagados no se revierten: quedan en el ledger con su estado real.
4. **Verificación post-rollback**: suite backend + frontend + E2E (wallet con flag off debe volver a los 7 fallos esperados por feature oculta — no a errores nuevos).

## Dependencies

- Pasarelas ya operativas: `PayPalService.ts` (REST, sandbox) y `MercadoPagoService.ts` (SDK 2.12.0, TEST) — solo se extienden, no se reemplazan.
- Credenciales sandbox/TEST en `backend/.env` y `.env.production` raíz (untracked) — ampliar con permisos de Payouts/money-out.
- CoinGecko (precios, sin key) — NO es dependencia de payout; documentado.
- DB Postgres en docker (`mlm-postgres-1`) — schema existe, datos dormidos (0 withdrawals); sin migración de datos.

## Delivery & Review

- Entrega en **PRs encadenados** (auto-chain, presupuesto ~400 líneas por PR) con unidades de trabajo autónomas: (1) schema+migración, (2) PayoutService+gateways, (3) admin approve/reject+presupuesto, (4) fix filtros, (5) frontend destino+validación, (6) E2E #347.
- **Regla del proyecto**: TODOS los PRs se asignan al usuario para review ANTES de merge. Ninguna issue/PR se cierra ni mergea sin su aprobación explícita.
- Convención `// TODO:` + comentario para pendientes en código (extensión todo-tree).

## Success Criteria

- [ ] Migración `destination` aplicada; `POST /wallet/withdraw` persiste y valida destino por pasarela, con topes por retiro y diario por usuario.
- [ ] Admin aprueba/rechaza retiros (con confirmación visual del destino); presupuestos diarios por pasarela bloquean excesos y encolan.
- [ ] Modo `auto`: payout ejecutado vía gateway real (sandbox/TEST) y estado sincronizado (`paid`/`failed`); modo `manual` conserva comportamiento actual.
- [ ] Fix filtros: `GET /wallet/transactions?type=commission_earned|adjustment` devuelve datos correctos.
- [ ] Emails Brevo enviados en cada transición de estado del retiro (aprobado/pagado/rechazado/fallido).
- [ ] `wallet.spec.ts` (#347) pasa íntegro con flags ON en test env; sin `.catch` vacuo.
- [ ] Flags OFF en producción verificadas tras merge (503/oculto intactos).
- [ ] Tests: suite backend + frontend verdes (tdd:true); cobertura ≥65%.

## Proposal Question Round

Supuestos asumidos: presupuestos diarios en USD configurados por env y **separados por pasarela**; retiros aprobados se procesan en el job diario (lote); fallos de gateway requieren retry manual admin (no automático).

Preguntas abiertas — **RESUELTAS por el usuario (2026-08-01)**:
1. ✅ Presupuesto: **por pasarela** (`WALLET_PAYOUT_BUDGET_PAYPAL` / `WALLET_PAYOUT_BUDGET_MERCADOPAGO`).
2. ✅ Límites: **ambos topes** — por retiro (`WALLET_MAX_WITHDRAWAL`) y diario por usuario (`WALLET_MAX_WITHDRAWAL_DAILY_PER_USER`).
3. ✅ Confirmación admin: **sí**, el modal de aprobación muestra el destino antes de confirmar.
4. ✅ Notificaciones: **incluir emails Brevo** en cada cambio de estado del retiro.

---

## Continuation

> **2026-09-03 — `wallet-integration-continue` (archived `2026-09-03-wallet-integration-continue`)**
> The 29 remaining tasks (phases 3–9) omitted from the initial implementation were continued in
> `openspec/changes/wallet-integration-continue/` and are now **archived**.
> Reference: `openspec/changes/archive/2026-09-03-wallet-integration-continue/` (proposal, design, 8 specs, tasks).
> Original schema + PayPal gateway (PRs 0–2a) remain the source of truth for infrastructure; this continuation
> delivered WalletService core, admin approval, notifications, sync/webhook, config API, frontend, and E2E fix #347.
> Future wallet work SHOULD branch from `main` post-2026-09-03 and cite both changes.

---

**Change**: wallet-integration
**Branch**: feature/wallet-integration
**Mode**: HYBRID (engram + openspec)
