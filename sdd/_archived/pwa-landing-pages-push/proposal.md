# Proposal: PWA Landing Pages y Push Notifications

## Intent

Implementar capacidades PWA avanzadas para la plataforma MLM: Service Worker para funcionamiento offline, landing pages personalizadas para productos de streaming/e-commerce, y sistema de notificaciones push mediante Web Push API con VAPID.

## Scope

### In Scope

- Extender vite-plugin-pwa con estrategias de caching offline (StaleWhileRevalidate para assets, NetworkFirst para API)
- Nueva ruta pública `/landing/product/:id` con template de producto individual
- Extender perfiles públicos de afiliados (`/ref/:code`) con sección de productos
- Sistema Web Push Notifications con VAPID keys: backend guarda subscriptions, frontend envía requests
- Nueva tabla PushSubscription en backend (userId, endpoint, keys, createdAt)

### Out of Scope

- Email notifications (ya existen)
- SMS notifications
- WhatsApp/Telegram bot integrations
- Notificaciones in-app (solo push del navegador)

## Approach

1. **Service Worker**: Ya configurado en vite.config.ts con workbox. Extender con estrategias específicas para offline.
2. **Landing de Productos**: Nueva ruta `/landing/product/:id` que renderiza Product con template dedicado. SEO optimizado.
3. **Push**: Usar Web Push API estándar. Generar VAPID keys con `web-push`. Backend store subscriptions en SQLite/PostgreSQL.

## Affected Areas

| Area                                    | Impact   | Description                                                  |
| --------------------------------------- | -------- | ------------------------------------------------------------ |
| `frontend/vite.config.ts`               | Modified | Ya tiene PWA config, agregar estrategias offline específicas |
| `frontend/public/manifest.json`         | Modified | Agregar `push` a shortcuts si aplica                         |
| `frontend/src/pages/LandingPages.tsx`   | Modified | Agregar template "product" para landing pages                |
| `frontend/src/pages/PublicProfile.tsx`  | Modified | Agregar sección de productos del afiliado                    |
| `frontend/src/pages/ProductLanding.tsx` | New      | Nueva página para `/landing/product/:id`                     |
| `backend/src/models/`                   | New      | PushSubscription model                                       |
| `backend/src/routes/push.ts`            | New      | Endpoints: subscribe, unsubscribe, send                      |
| `backend/src/utils/vapid.ts`            | New      | VAPID key management                                         |

## Risks

| Risk                              | Likelihood | Mitigation                                       |
| --------------------------------- | ---------- | ------------------------------------------------ |
| Push requiere HTTPS en producción | High       | Usar proxy/wrapper en dev o forzar HTTPS en prod |
| Service Worker complica debugging | Medium     | Deshabilitar en dev mode con conditional         |
| VAPID keys expiran                | Low        | Rotación anual, guardar en env                   |

## Rollback Plan

1. Revertir cambios en `vite.config.ts` (remover estrategia PWA)
2. Eliminar `ProductLanding.tsx` y rutas asociadas
3. Eliminar tabla PushSubscription + endpoints de backend
4. Remover manifest keys relacionados con push

## Dependencies

- `vite-plugin-pwa` (ya instalado)
- `web-push` npm package
- VAPID keys generados (público/privado)

## Success Criteria

- [ ] App funciona offline (cache strategy StaleWhileRevalidate)
- [ ] Landing de productos accesible públicamente en `/landing/product/:id`
- [ ] Push notifications enviadas y recibidas en navegador
- [ ] Perfil público muestra productos del afiliado
