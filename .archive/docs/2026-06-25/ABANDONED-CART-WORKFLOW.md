# Abandoned Cart Recovery — Implementation Workflow

> Flujo de trabajo de implementación para la recuperación de carritos abandonados.

## Overview / Resumen

This feature detects abandoned carts (inactive for ≥1000 minutes / ≈16.6 hours), sends a recovery email with a one-time tokenized link, and allows users to restore their cart and proceed to checkout.

Esta funcionalidad detecta carritos abandonados (inactivos por ≥1000 minutos / ≈16.6 horas), envía un email de recuperación con un enlace tokenizado de un solo uso, y permite a los usuarios restaurar su carrito y proceder al checkout.

---

## Cart Status Lifecycle / Ciclo de vida del estado del carrito

```
active ──────────────► checked_out     (user completes purchase)
  │
  │  (1000 min inactivity)
  ▼
abandoned ──────────► recovered ──────► checked_out
  │                                      (user recovered + purchased)
  │  (30 days)
  ▼
expired ────────────► deleted          (GDPR cleanup)
```

### Status Descriptions / Descripción de estados

| Status        | Description (EN)                                 | Descripción (ES)                               |
| ------------- | ------------------------------------------------ | ---------------------------------------------- |
| `active`      | Cart is being used by the customer               | El carrito está siendo usado por el cliente    |
| `abandoned`   | No activity for ≥1000 minutes, email sent        | Sin actividad por ≥1000 minutos, email enviado |
| `recovered`   | Customer clicked recovery link and restored cart | El cliente usó el enlace de recuperación       |
| `checked_out` | Purchase completed                               | Compra completada                              |
| `expired`     | 30 days since abandonment, ready for cleanup     | 30 días desde abandono, listo para limpieza    |

---

## Architecture / Arquitectura

### Backend Components / Componentes Backend

| Component                  | File                                               | Purpose                               |
| -------------------------- | -------------------------------------------------- | ------------------------------------- |
| Cart Model                 | `backend/src/models/Cart.ts`                       | Cart Sequelize model (status, totals) |
| CartItem Model             | `backend/src/models/CartItem.ts`                   | Cart items with product FK            |
| CartRecoveryToken Model    | `backend/src/models/CartRecoveryToken.ts`          | One-time recovery tokens (bcrypt)     |
| CartService                | `backend/src/services/CartService.ts`              | Core CRUD + recovery business logic   |
| CartController             | `backend/src/controllers/CartController.ts`        | HTTP endpoint handlers                |
| Cart Routes                | `backend/src/routes/carts.routes.ts`               | Express routes with validation        |
| SchedulerService Extension | `backend/src/services/SchedulerService.ts`         | Cron job (every 15 min)               |
| CartRecoveryEmailService   | `backend/src/services/CartRecoveryEmailService.ts` | Email composition + dispatch          |

### Frontend Components / Componentes Frontend

| Component            | File                                                 | Purpose                         |
| -------------------- | ---------------------------------------------------- | ------------------------------- |
| Cart Store (Zustand) | `frontend/src/stores/cartStore.ts`                   | State management + localStorage |
| Cart Service         | `frontend/src/services/cartService.ts`               | API client for cart operations  |
| RecoverCartPage      | `frontend/src/pages/RecoverCartPage.tsx`             | Recovery landing page           |
| CartPreview          | `frontend/src/components/Cart/CartPreview.tsx`       | Read-only cart display          |
| CartRecoveryNotif    | `frontend/src/components/Cart/CartRecoveryNotif.tsx` | Toast notification              |

---

## API Endpoints / Endpoints de API

### Authenticated Routes (JWT Required)

| Method   | Endpoint                             | Description                    |
| -------- | ------------------------------------ | ------------------------------ |
| `GET`    | `/api/v1/carts/me`                   | Get current user's active cart |
| `POST`   | `/api/v1/carts/me/items`             | Add item to cart               |
| `DELETE` | `/api/v1/carts/me/items/:cartItemId` | Remove item from cart          |
| `PATCH`  | `/api/v1/carts/me/items/:cartItemId` | Update item quantity           |

### Public Routes (No Auth — Token-based Security)

| Method | Endpoint                       | Description                         |
| ------ | ------------------------------ | ----------------------------------- |
| `GET`  | `/api/v1/carts/recover/:token` | Preview cart by recovery token      |
| `POST` | `/api/v1/carts/recover/:token` | Confirm recovery (marks token used) |

### Admin Routes (JWT + Admin Required)

| Method | Endpoint                  | Description                  |
| ------ | ------------------------- | ---------------------------- |
| `GET`  | `/api/v1/carts/abandoned` | List abandoned carts + stats |

---

## Recovery Flow / Flujo de Recuperación

### Step-by-Step / Paso a Paso

```
1. SchedulerService runs every 15 minutes (*/15 * * * *)
   └── Calls CartService.findAbandoned(1000)

2. For each abandoned cart:
   ├── CartService.markAbandoned(cartId)
   ├── CartService.createRecoveryToken(cartId, 7)   // 7-day expiry
   │   └── UUID v4 generated, bcrypt hashed (cost 12), stored in DB
   └── CartRecoveryEmailService.sendRecoveryEmail(cartId, tokenPlain)
       └── Composes HTML email with:
           ├── Item summary table
           ├── Recovery link: /recover-cart?token={uuid}
           ├── Expiry notice (7 days)
           └── Manual code fallback

3. Customer clicks email link:
   ├── GET /api/v1/carts/recover/{token}
   │   └── Validates token (bcrypt compare, expiry check, not used)
   │   └── Returns cart with items (read-only preview)
   └── Frontend shows CartPreview with "Proceed to Checkout"

4. Customer clicks "Proceed":
   ├── POST /api/v1/carts/recover/{token}
   │   └── Marks token as used (used_at = NOW, status = 'used')
   │   └── Updates cart status: abandoned → recovered
   │   └── Sets recovered_at = NOW()
   └── Frontend redirects to /products (or checkout)

5. One-time token enforcement:
   └── Second attempt with same token → 410 Gone ("Token already used")
```

### Security / Seguridad

| Measure          | Implementation                              |
| ---------------- | ------------------------------------------- |
| Token hashing    | bcrypt cost 12 — prevents enumeration       |
| One-time use     | `used_at IS NOT NULL` check prevents replay |
| 7-day expiry     | `expires_at < NOW()` check on validation    |
| No auth required | Token IS the authentication for recovery    |
| Rate limiting    | 10 req/min on recovery endpoints            |

---

## localStorage Persistence / Persistencia localStorage

### Strategy / Estrategia

- **Key**: `mlm_cart_{userId}`
- **Sync frequency**: Debounced every 30 seconds on any cart mutation
- **Recovery**: On app load, restore from localStorage if saved < 24 hours ago
- **Cleanup**: Clear on successful checkout via `clearLocalStorage(userId)`

### Stored Data / Datos Almacenados

```json
{
  "items": [
    {
      "id": "uuid",
      "cartId": "uuid",
      "productId": "uuid",
      "quantity": 2,
      "unitPrice": 9.99,
      "subtotal": 19.98,
      "product": { "name": "Netflix Premium", "platform": "netflix" }
    }
  ],
  "totalAmount": 19.98,
  "itemCount": 1,
  "lastActivityAt": "2026-04-04T10:30:00Z",
  "savedAt": "2026-04-04T10:30:30Z"
}
```

---

## Testing / Pruebas

### Integration Tests (21 tests — all passing)

```bash
cd backend
TEST_DB_NAME=mlm_test SKIP_COMMISSION_CALCULATION=true \
  node_modules/.bin/jest --config=jest.integration.config.cjs \
  --runInBand --testPathPattern=integration/carts
```

Test suites:

- Cart CRUD (create, add, remove, update, get)
- Cart Recovery (token create, validate, recover, replay prevention)
- Abandoned Detection (find, mark, threshold)
- Admin Routes (list abandoned with stats)
- Cleanup (expired cart deletion)

### E2E Tests (4 test stubs — requires running server)

```bash
cd frontend
npx playwright test e2e/carts.spec.ts
```

| Test ID      | Description                             |
| ------------ | --------------------------------------- |
| CART-E2E-001 | Add items to cart and verify state      |
| CART-E2E-002 | Recovery link loads cart preview        |
| CART-E2E-003 | Recovery flow proceeds to checkout      |
| CART-E2E-004 | Expired token shows error with fallback |

---

## Error Codes / Códigos de Error

| Code               | HTTP | Description                     |
| ------------------ | ---- | ------------------------------- |
| CART_NOT_FOUND     | 404  | Cart not found for this user    |
| TOKEN_EXPIRED      | 400  | Recovery token has expired      |
| TOKEN_INVALID      | 400  | Token doesn't match any record  |
| TOKEN_ALREADY_USED | 410  | Token was already used          |
| PRODUCT_NOT_FOUND  | 404  | Product ID not found in catalog |
| EMAIL_SEND_FAILED  | 500  | Email dispatch failed (retry)   |

---

## Environment Variables / Variables de Entorno

```env
ABANDONED_CART_THRESHOLD_MINUTES=1000    # Inactivity threshold
RECOVERY_TOKEN_EXPIRY_DAYS=7             # Token valid for 7 days
BCRYPT_COST_FACTOR=12                    # bcrypt cost for token hashing
```

---

## Monitoring / Monitoreo

### Key Metrics

- Abandoned carts detected (daily)
- Recovery emails sent vs delivered
- Recovery link click-through rate (target: >3%)
- Cart recovery rate (target: >5%)
- Token replay attempts (should be 0)

---

**Document Version**: 1.0
**Created**: 2026-04-04
**Feature**: #21 — Abandoned Cart Recovery
**Sprint**: Sprint 2 (v1.10.0)
