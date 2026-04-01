# Technical Design: PWA Landing Pages y Push Notifications

**Change**: pwa-landing-pages-push  
**Phase**: Design  
**Created**: 2026-03-31  
**Status**: Draft

---

## 1. Technical Approach

### 1.1 Service Worker & PWA (Offline Capabilities)

**Stack**: `vite-plugin-pwa` (ya instalado) + Workbox

**Current State**:

- El proyecto YA tiene vite-plugin-pwa configurado en `frontend/vite.config.ts`
- Manifiesto configurado con icons, shortcuts, screenshots
- Workbox con caching strategies configurado

**Extensión Requerida**:

| Recurso                | Estrategia Actual    | Estrategia Propuesta                  | Justificación                       |
| ---------------------- | -------------------- | ------------------------------------- | ----------------------------------- |
| API calls              | NetworkFirst         | **NetworkFirst** (sin cambio)         | Datos dinámicos requieren freshness |
| Static assets (JS/CSS) | StaleWhileRevalidate | **StaleWhileRevalidate** (sin cambio) | Actualización en background         |
| Imágenes               | CacheFirst           | **CacheFirst** (sin cambio)           | Imágenes cambian poco               |
| Landing pages          | N/A                  | **NetworkFirst** + offline fallback   | Contenido dinámico pero cacheable   |
| Fonts                  | CacheFirst           | **CacheFirst** (sin cambio)           | Archivos estáticos                  |

**Nuevas características a agregar**:

```typescript
// frontend/vite.config.ts - Extensiones propuestas
VitePWA({
  registerType: 'autoUpdate',
  // Agregar:
  devOptions: {
    enabled: process.env.NODE_ENV !== 'production', // Disable SW in dev
  },
  workbox: {
    // Offline fallback para páginas específicas
    offlineFallback: {
      page: '/offline', // Usar página offline existente
    },
    // Precaching para assets críticos
    precacheManifest: ['/', '/dashboard', '/offline'],
    // Runtime caching extendido para landing pages
    runtimeCaching: [
      // Landing pages del sitio
      {
        urlPattern: /\/landing(\/.*)?$/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'landing-pages-cache',
          networkTimeoutSeconds: 10,
          expiration: {
            maxEntries: 20,
            maxAgeSeconds: 60 * 60 * 24, // 24 hours
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // Perfiles públicos
      {
        urlPattern: /\/ref\/[A-Z0-9]+$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'public-profiles-cache',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60, // 1 hour
          },
        },
      },
    ],
  },
});
```

### 1.2 Landing Pages para Productos

**Ruta nueva**: `/landing/product/:id`

**Arquitectura**:

- Página pública (no requiere auth)
- Template dedicado para productos de streaming/e-commerce
- SEO optimizado con metadata dinámica

**Componente**: `frontend/src/pages/ProductLanding.tsx` (nuevo)

```typescript
interface ProductLandingData {
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    platform: 'subscription' | 'streaming' | 'one-time';
    features: string[];
    imageUrl: string;
    isActive: boolean;
  };
  affiliate?: {
    referralCode: string;
    fullName: string;
    level: number;
  };
}
```

**Template de producto** (variación del existente LandingPageBuilder):

- Hero con imagen del producto
- Features list
- Pricing display
- CTA con código de referido del afiliado
- Stats opcionales (views del producto)

### 1.3 Perfil Público con Sección de Productos

**Ruta existente**: `/ref/:code`  
**Extensión**: Agregar sección de productos del afiliado

**Cambios en** `frontend/src/pages/PublicProfile.tsx`:

```typescript
// Nuevo estado
const [products, setProducts] = useState<Product[]>([]);
const [showProducts, setShowProducts] = useState(false);

// Fetch adicional en useEffect
if (profile) {
  const productsRes = await api.get(`/public/profile/${code}/products`);
  setProducts(productsRes.data.data);
}
```

**UI**: Grid de productos tipo "featured products" del afiliado

### 1.4 Push Notifications con Web Push API + VAPID

**Stack**: `web-push` npm package

**Flujo**:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Browser    │     │  Frontend   │     │   Backend   │
│  (Client)   │     │             │     │             │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │ 1. Service Worker │                   │
       │    Registration │                   │
       │────────────────>│                   │
       │                   │                   │
       │                   │ 2. Subscribe     │
       │                   │    + VAPID keys    │
       │                   │─────────────────>│
       │                   │                   │
       │                   │                   │ 3. Store
       │                   │                   │    subscription
       │                   │                   │────────────────> DB
       │                   │                   │
       │                   │                   │ 4. Trigger
       │                   │    (admin/event)  │<──────────────
       │                   │                   │
       │                   │                   │ 5. Send push
       │                   │                   │───────> Push Service
       │                   │                   │             │
       │                   │                   │             │ 6. Deliver
       │<─────────────────────────────────────│             │
       │    Push Event                        │             │
```

---

## 2. Architecture Decisions

### 2.1 Caching Strategy

| Tipo de contenido | Estrategia           | TTL      | Justificación                       |
| ----------------- | -------------------- | -------- | ----------------------------------- |
| API responses     | NetworkFirst         | 1 min    | Datos frecuentemente actualizados   |
| Static JS/CSS     | StaleWhileRevalidate | 7 days   | Balance entre updates y performance |
| Imágenes          | CacheFirst           | 30 days  | Raramente cambian                   |
| Landing pages     | NetworkFirst         | 24 hours | Contenido semi-estático             |
| Perfiles públicos | StaleWhileRevalidate | 1 hour   | Datos relativamente estáticos       |

### 2.2 VAPID Keys Storage

**Generación**: One-time al inicializar el backend

```bash
# Generación de keys (solo una vez)
npx web-push generate-vapid-keys
```

**Almacenamiento**:

| Entorno     | Ubicación             | Seguridad      |
| ----------- | --------------------- | -------------- |
| Development | `backend/.env`        | NO committing  |
| Production  | Environment variables | Secret manager |

**Estructura en .env**:

```
VAPID_PUBLIC_KEY=B2d2...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:admin@mlm-platform.com
```

### 2.3 Push Subscription Storage

**Tabla Nueva**: `push_subscriptions`

```sql
CREATE TABLE push_subscriptions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  endpoint TEXT NOT NULL,
  keys_public TEXT NOT NULL,
  keys_auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX idx_push_user ON push_subscriptions(user_id);
CREATE INDEX idx_push_endpoint ON push_subscriptions(endpoint);
```

---

## 3. Data Flow

### 3.1 Push Subscription Flow

```
Frontend (User opt-in)
│
├─> 1. get subscription from Service Worker
│    navigator.serviceWorker.ready.then(reg =>
│      reg.pushManager.subscribe({ ... }))
│
├─> 2. Send to backend
│    POST /api/push/subscribe
│    { endpoint, keys: { p256dh, auth } }
│
Backend
│
├─> 3. Validate subscription format
│
├─> 4. Store in push_subscriptions table
│
└─> 5. Return success
```

### 3.2 Sending Push Notifications

```
Trigger Event (Admin/Automated)
│
├─> 1. Fetch subscriptions for user(s)
│    SELECT * FROM push_subscriptions WHERE user_id = ?
│
Backend Push Service
│
├─> 2. Encrypt payload with VAPID keys
│    webPush.sendNotification(subscription, payload)
│
├─> 3. Handle errors:
│    - 410 Gone → Delete subscription
│    - 401/403 → Regenerate VAPID keys
│    - 429 → Rate limit / retry
│
└─> 4. Log delivery status
```

### 3.3 Landing Page Data Flow

```
GET /landing/product/:id
│
├─> 1. Fetch product from database
│    ProductService.getById(id)
│
├─> 2. Check referral code in query (?ref=CODE)
│    If present, fetch affiliate profile
│
├─> 3. Track view (async, no blocking)
│    ProductService.trackView(id)
│
└─> 4. Render ProductLanding component
    - Product details
    - Affiliate info (if ref provided)
    - SEO metadata
```

---

## 4. File Changes

### 4.1 Frontend

| File                                      | Action  | Description                         |
| ----------------------------------------- | ------- | ----------------------------------- |
| `frontend/vite.config.ts`                 | Modify  | Extender estrategias de caching     |
| `frontend/src/pages/ProductLanding.tsx`   | **NEW** | Landing page para productos         |
| `frontend/src/pages/PublicProfile.tsx`    | Modify  | Agregar sección de productos        |
| `frontend/src/App.tsx`                    | Modify  | Agregar ruta `/landing/product/:id` |
| `frontend/src/services/pushService.ts`    | **NEW** | Push subscription management        |
| `frontend/src/services/productService.ts` | Modify  | Agregar método getForLanding        |
| `frontend/public/manifest.json`           | (auto)  | Regenerado por vite-plugin-pwa      |

### 4.2 Backend

| File                                                                   | Action  | Description          |
| ---------------------------------------------------------------------- | ------- | -------------------- |
| `backend/src/models/PushSubscription.ts`                               | **NEW** | Sequelize model      |
| `backend/src/routes/push.routes.ts`                                    | **NEW** | Endpoints de push    |
| `backend/src/services/PushService.ts`                                  | **NEW** | Push sending logic   |
| `backend/src/utils/vapid.ts`                                           | **NEW** | VAPID key management |
| `backend/src/routes/index.ts`                                          | Modify  | Agregar push routes  |
| `backend/src/server.ts`                                                | Modify  | Registrar rutas      |
| `backend/database/migrations/<timestamp>-create-push-subscriptions.js` | **NEW** | Migration            |

### 4.3 Database

| Operation    | Description          |
| ------------ | -------------------- |
| CREATE TABLE | `push_subscriptions` |

---

## 5. Interfaces / Contracts

### 5.1 API Endpoints - Push

#### POST /api/push/subscribe

**Auth**: Required (JWT)

**Request**:

```typescript
{
  endpoint: string;
  keys: {
    p256dh: string;  // Base64
    auth: string;    // Base64
  };
  userAgent?: string;
}
```

**Response** (200):

```typescript
{
  success: true;
  data: {
    id: string;
    createdAt: string;
  }
}
```

#### DELETE /api/push/unsubscribe

**Auth**: Required (JWT)

**Request**:

```typescript
{
  endpoint: string;
}
```

**Response** (200):

```typescript
{
  success: true;
}
```

#### GET /api/push/vapid-public-key

**Auth**: None (public)

**Response** (200):

```typescript
{
  success: true;
  data: {
    publicKey: string;
  }
}
```

### 5.2 API Endpoints - Product Landing

#### GET /api/public/landing/product/:id

**Auth**: None (public)

**Query Params**:

- `ref` (optional): Affiliate referral code

**Response** (200):

```typescript
{
  success: true;
  data: {
    product: {
      id: string;
      name: string;
      description: string;
      price: number;
      currency: string;
      platform: string;
      features: string[];
      imageUrl: string;
    };
    affiliate?: {
      referralCode: string;
      fullName: string;
    };
  };
  meta: {
    title: string;
    description: string;
    ogImage?: string;
  }
}
```

### 5.3 API Endpoints - Public Profile Products

#### GET /api/public/profile/:code/products

**Auth**: None (public)

**Response** (200):

```typescript
{
  success: true;
  data: Product[];  // Array de productos destacados
}
```

### 5.4 TypeScript Interfaces

```typescript
// frontend/src/types/push.ts
export interface PushSubscription {
  id: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  createdAt: string;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
  actions?: Array<{
    action: string;
    title: string;
  }>;
}

// frontend/src/types/product.ts (extensión)
export interface ProductLanding {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  platform: 'subscription' | 'streaming' | 'one-time';
  features: string[];
  imageUrl: string;
  metaTitle?: string;
  metaDescription?: string;
}
```

---

## 6. Testing Strategy

### 6.1 Unit Tests

| Module                     | Coverage Target                    | Framework                       |
| -------------------------- | ---------------------------------- | ------------------------------- |
| `pushService.ts`           | Subscription subscribe/unsubscribe | Vitest                          |
| `PushService.ts` (backend) | Encryption, error handling         | Jest                            |
| `ProductLanding.tsx`       | Rendering, SEO hooks               | Vitest + @testing-library/react |
| `vapid.ts`                 | Key generation, validation         | Jest                            |

### 6.2 Integration Tests

| Test                    | Endpoint                               | Validation              |
| ----------------------- | -------------------------------------- | ----------------------- |
| Push subscription flow  | POST /api/push/subscribe               | Subscription stored     |
| Push unsubscription     | DELETE /api/push/unsubscribe           | Subscription removed    |
| Product landing fetch   | GET /api/public/landing/product/:id    | Correct data returned   |
| Public profile products | GET /api/public/profile/:code/products | Products linked to user |
| VAPID key retrieval     | GET /api/push/vapid-public-key         | Valid base64 key        |

### 6.3 E2E Tests (Playwright)

| Test                    | Flow                                                        |
| ----------------------- | ----------------------------------------------------------- |
| PWA install             | Install app as PWA, verify offline works                    |
| Push permission flow    | Grant push permission, subscribe, receive test notification |
| Product landing SEO     | Verify meta tags present                                    |
| Public profile products | Verify products section renders                             |

### 6.4 Offline Testing

```typescript
// Test offline capabilities
test('app works offline', async ({ page }) => {
  // Enable airplane mode
  const context = await page.context();
  await context.setOffline(true);

  // Navigate and verify cache fallback
  await page.goto('/dashboard');
  await expect(page.locator('.offline-banner')).toBeVisible();

  await context.setOffline(false);
});
```

---

## 7. Migration / Rollout

### 7.1 Migration Steps

1. **Pre-deployment**:
   - Generar VAPID keys
   - Agregar a environment variables
   - Crear migración de base de datos

2. **Backend deployment**:
   - Aplicar migración
   - Deploy nuevo código
   - Verificar endpoints responding

3. **Frontend deployment**:
   - Deploy con nuevas estrategias PWA
   - Service worker se actualiza automáticamente

### 7.2 Rollback Plan

| Step | Action                                                      |
| ---- | ----------------------------------------------------------- |
| 1    | Revertir cambios en vite.config.ts (usar estrategia básica) |
| 2    | Eliminar ProductLanding.tsx                                 |
| 3    | Eliminar tabla push_subscriptions                           |
| 4    | Revertir endpoints de push.routes.ts                        |
| 5    | Eliminar manifest keys relacionados                         |

### 7.3 Feature Flags

```typescript
// Control de features via environment
export const features = {
  pwaOffline: process.env.VITE_PWA_OFFLINE === 'true',
  productLanding: process.env.VITE_PRODUCT_LANDING === 'true',
  pushNotifications: process.env.VITE_PUSH_NOTIFICATIONS === 'true',
};
```

---

## 8. Open Questions

### 8.1 Pendientes de decisión

| Question                                      | Options                              | Recommendation                             |
| --------------------------------------------- | ------------------------------------ | ------------------------------------------ |
| ¿Push notifications automáticas o manuales?   | Auto (event-triggered) + Admin panel | Empezar con automáticas, admin panel en v2 |
| ¿Cuántos productos mostrar en perfil público? | 3, 6, todos                          | Empezar con 6 (limitar por performance)    |
| ¿Estrategia para productos descontinuados?    | 404, redirect, show inactive         | 404 con mensaje friendly                   |
| ¿Notifications por nivel de usuario?          | Todos, solo premium, solo admins     | Todos por defecto, settings por usuario    |

### 8.2 Dependencies externally hosted

| Service                    | Purpose                   | Fallback             |
| -------------------------- | ------------------------- | -------------------- |
| Web Push Service (browser) | Entrega de notificaciones | Email como fallback  |
| VAPID keys                 | Autenticación             | Regenerar si expiran |

---

## 9. Security Considerations

### 9.1 Push Security

- ✅ VAPID authentication previene spoofing
- ✅ Subscription linked a usuario autenticado
- ✅ Endpoint validation antes de guardar
- ✅ Rate limiting en endpoint de subscribe

### 9.2 PWA Security

- ✅ HTTPS requerido en producción
- ✅ Service Worker solo sirve assets del mismo origen
- ⚠️ Considerar Content Security Policy para inline scripts del SW

---

## 10. Performance Impact

| Aspecto                         | Impact                     | Mitigation                      |
| ------------------------------- | -------------------------- | ------------------------------- |
| Storage (SW cache)              | ~5-10MB adicional          | Workbox cleanup策略             |
| API calls extra                 | +1 por visit (precaching)  | Minimal, solo assets críticos   |
| DB storage (push subscriptions) | ~500 bytes por user        | TTL para subscriptions inactive |
| Push delivery latency           | Variable (red del usuario) | Async, no blocking              |

---

## 11. Related Documentation

- [Proposal Document](./proposal.md)
- [vite-plugin-pwa documentation](https://vite-pwa-org.netlify.app/)
- [Web Push API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [web-push npm](https://www.npmjs.com/package/web-push)

---

## 12. Implementation Checklist

- [ ] Generate VAPID keys
- [ ] Add VAPID keys to environment
- [ ] Create push_subscriptions migration
- [ ] Create PushSubscription model
- [ ] Create PushService (backend)
- [ ] Create push routes
- [ ] Extend vite.config.ts with offline strategies
- [ ] Create ProductLanding page
- [ ] Create pushService (frontend)
- [ ] Add public profile products endpoint
- [ ] Update PublicProfile with products section
- [ ] Unit tests for new services
- [ ] Integration tests for endpoints
- [ ] E2E tests for PWA + Push
