# Roadmap — Nexo Real

> Hoja de ruta completa para la plataforma **Nexo Real** — Servicios Inmobiliarios, Turismo/Hospitalidad y Afiliaciones.  
> _"Conectamos tu negocio con el mundo."_

**Versión actual**: v2.4.0 — Sprint 8 Completado ✅  
**Última actualización**: 2026-04-10  
**Estado**: Activo - Desarrollo intensivo  
**Meta**: v3.0.0 — expansión México + Argentina

---

## 📊 Estado Actual del Proyecto

### ✅ Lo que YA está implementado (v2.4.0)

| Área                     | Funcionalidad                                                               | Estado |
| ------------------------ | --------------------------------------------------------------------------- | ------ |
| **Auth**                 | JWT, 2FA, Roles                                                             | ✅     |
| **MLM**                  | Unilevel con Closure Table                                                  | ✅     |
| **Comisiones**           | 5 niveles configurables                                                     | ✅     |
| **E-commerce**           | Productos streaming (MVP ejemplo)                                           | ✅     |
| **Wallet**               | Balance, transacciones, retiros                                             | ✅     |
| **CRM**                  | Leads, Tasks, Communications                                                | ✅     |
| **Notificaciones**       | Email (Brevo), Push (Web)                                                   | ✅     |
| **PWA**                  | Offline, instalable, shortcuts                                              | ✅     |
| **Landing Pages**        | Productos con SEO                                                           | ✅     |
| **Dashboard**            | Stats, tree view, perfil                                                    | ✅     |
| **i18n**                 | Español + Inglés (sin claves huérfanas)                                     | ✅     |
| **Pagos**                | PayPal + MercadoPago                                                        | ✅     |
| **Gamificación**         | Leaderboards + Achievements                                                 | ✅     |
| **Gift Cards**           | CRUD, redeem, balance, admin                                                | ✅     |
| **Cart Recovery**        | Persistence, tokens, emails                                                 | ✅     |
| **Email Auto**           | Templates, campaigns, scheduling                                            | ✅     |
| **Security**             | SSRF, XSS, pino-http, Docker hardening, CodeQL fixes                        | ✅     |
| **Products**             | Generic products + inventory + categories                                   | ✅     |
| **Marketplace**          | Multi-vendor, commission split 3-way                                        | ✅     |
| **Delivery**             | Shipping addresses, providers, tracking                                     | ✅     |
| **Contracts**            | Affiliate contracts MVP con hash/IP                                         | ✅     |
| **Real Estate Frontend** | PropertiesPage, PropertyDetailPage, filtros, galería                        | ✅     |
| **Tourism Frontend**     | ToursPage, TourDetailPage, itinerario, disponibilidad                       | ✅     |
| **Reservation Wizard**   | Wizard 3 pasos + MisReservasPage + reservationStore                         | ✅     |
| **Admin Dashboard CRUD** | AdminPropertiesPage + AdminToursPage + AdminReservationsPage                | ✅     |
| **Nexo Bot Flows**       | propertiesFlow + toursFlow (ES/EN, limit 5)                                 | ✅     |
| **network_balance**      | Migración `binary_balance` → `network_balance`                              | ✅     |
| **Build Hardening**      | Sin `.map` en producción, logs de tamaño                                    | ✅     |
| **SEO Frontend**         | Helmet dinámico + OG tags + JSON-LD (Property + Tour) + social proof badges | ✅     |
| **Tests**                | ~1,236 tests (Backend 39/528 + Frontend Unit 34/446 + E2E 22/262)           | ✅     |
| **RBAC 9 Roles**         | super_admin, admin, finance, sales, advisor, vendor, user, guest, bot       | ✅     |
| **Register Guest**       | `POST /api/auth/register/guest` — registro público sin sponsor              | ✅     |
| **Update User Role**     | `PATCH /api/admin/users/:id/role` — solo super_admin/admin                  | ✅     |
| **Seed Nexo Real**       | Datos colombianos (Medellín, Bogotá, Cartagena), árbol Unilevel completo    | ✅     |

---

## 🚀 Sprint 6 — v2.2.0 (Completado 2026-04-07)

### Objetivos cumplidos

| Fase   | Área                                                             | Estado        |
| ------ | ---------------------------------------------------------------- | ------------- |
| Fase 0 | Setup: Issues + ramas                                            | ✅            |
| Fase 9 | Security: CodeQL #39 #40 fix                                     | ✅ PR #88     |
| Fase 1 | Migration + Build hardening                                      | ✅ PR #89     |
| Fase 2 | i18n cleanup + DashboardStreaming removal                        | ✅ PR #90     |
| Fase 3 | Backend bot endpoints (incluido en PR #89)                       | ✅            |
| Fase 4 | Admin Dashboard CRUD frontend                                    | ✅ PR #91     |
| Fase 5 | Nexo Bot flows (properties + tours)                              | ✅ PR #92     |
| Fase 6 | Documentación (Swagger v2.2.0 + CHANGELOG)                       | ✅            |
| Fase 7 | Testing: migration tests + AdminPropertiesPage integration tests | ✅ PR commits |
| Fase 8 | SEO/Content: meta tags + JSON-LD + social proof badges           | ✅ PR #95     |

---

## 🎯 Visión del Proyecto

### Modelo de Negocio — Nexo Real

Plataforma SaaS multi-tenant para agencias inmobiliarias, hoteles, hosterías y operadores turísticos en LATAM, con sistema MLM Unilevel y agente AI por WhatsApp.

### Servicios Principales

```
Real Estate (Bienes Raíces)
├── Rentals (arrendamiento de aptos, casas, fincas)
├── Sales (venta de inmuebles)
└── Property Management (administración y mantenimiento)

Tourism & Hospitality
├── Hospitality (hoteles, hosterías, posadas)
└── Travel Packages (paquetes turísticos)
```

### Nexo Bot — AI WhatsApp Agent

```
Stack: BuilderBot + Baileys + OpenAI GPT-4o
Agentes: Sophia (♀ atiende hombres) + Max (♂ atiende mujeres)
Idiomas: Español + Inglés (detección automática)
Integraciones: n8n → Google Calendar + Notion + Notificación humana
```

### Mercados Objetivo

```
🟢 Colombia  — base actual (Bogotá, Medellín, Cartagena)
🟡 México    — próximo (CDMX, Cancún, Guadalajara)
🟡 Argentina — próximo (Buenos Aires, Córdoba, Mendoza)
🔲 LATAM     — expansión Fase 3
```

---

## 📋 GitHub Project

**URL**: https://github.com/users/ipproyectosysoluciones/projects/4

### Issues Creados

| #   | Sprint   | Task                                        | Priority  | Estado |
| --- | -------- | ------------------------------------------- | --------- | ------ |
| 17  | Sprint 1 | Pagos: Integrar PayPal SDK                  | 🔴 High   | ✅     |
| 18  | Sprint 1 | Pagos: Integrar MercadoPago SDK             | 🔴 High   | ✅     |
| 19  | Sprint 1 | Gamificación: Leaderboards                  | 🔴 High   | ✅     |
| 20  | Sprint 1 | Gamificación: Achievements y Badges         | 🔴 High   | ✅     |
| 21  | Sprint 2 | E-commerce: Carrito Abandonado              | 🟡 Medium | ✅     |
| 22  | Sprint 2 | Email: Automation Sequences con Brevo       | 🟡 Medium | ✅     |
| 23  | Sprint 2 | E-commerce: Gift Cards                      | 🟡 Medium | ✅     |
| 25  | Sprint 3 | Marketplace: Multi-vendor Support           | 🟡 Medium | ✅     |
| 26  | Sprint 3 | Delivery: Pickup + Ride-hailing             | 🟡 Medium | ✅     |
| 27  | Sprint 3 | E-commerce: Productos Genéricos + Inventory | 🔴 High   | ✅     |
| 29  | Sprint 3 | CodeQL: SSRF Fix                            | 🔴 High   | ✅     |
| 30  | Sprint 3 | CodeQL: SSRF Fix                            | 🔴 High   | ✅     |
| 36  | Sprint 3 | CodeQL: DOM XSS Fix                         | 🔴 High   | ✅     |
| 28  | Sprint 4 | QA: Test Coverage Expansion                 | 🔴 High   | 📋     |
| 39  | Sprint 2 | PR: Sprint 2 v1.10.0 (merged)               | 🔴 High   | ✅     |

---

## 🗓️ Timeline - 4 Semanas

```
╔══════════════════════════════════════════════════════════════════════╗
║                    MES 1: HASTA 2026-05-03                         ║
╠══════════════════════════════════════════════════════════════════════╣
║  ✅ SEMANA 1 (Mar 30 - Abr 5): MONETIZACIÓN — v1.9.0             ║
║  ├── ✅ Pagos: PayPal SDK                                         ║
║  ├── ✅ Pagos: MercadoPago SDK                                    ║
║  └── ✅ Gamificación: Leaderboards + Achievements                 ║
╠══════════════════════════════════════════════════════════════════════╣
║  ✅ SEMANA 2 (Abr 6 - Abr 12): E-COMMERCE + AUTOMATION — v1.10.0 ║
║  ├── ✅ Gift Cards (#23)                                          ║
║  ├── ✅ Carrito Abandonado (#21)                                   ║
║  └── ✅ Email Automation (#22)                                     ║
╠══════════════════════════════════════════════════════════════════════╣
║  ✅ SEMANA 3 (Abr 13 - Abr 19): MULTI-VENDOR + DELIVERY — v1.11.0║
║  ├── ✅ Security Hardening (#29, #30, #36)                        ║
║  ├── ✅ Productos Genéricos + Inventario                          ║
║  ├── ✅ Multi-vendor Support + Affiliate Contracts                ║
║  └── ✅ Delivery: Shipping Addresses + Tracking                   ║
╠══════════════════════════════════════════════════════════════════════╣
║  SEMANA 4 (Abr 20 - Abr 26): QA + RELEASE                        ║
║  ├── Test Coverage Expansion (90%+)                                ║
║  ├── Integration Testing                                           ║
║  ├── Documentation                                                 ║
║  └── v2.0.0 RELEASE (Abr 27)                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## 📋 Detalle de Sprints

### ✅ SPRINT 1: Monetización (Semana 1-2) — COMPLETADO (v1.9.0)

#### 1.1 Pagos: PayPal + MercadoPago

```
✅ PayPal SDK (@paypal/react-paypal-js)
  ├── Crear PayPalService
  ├── Flujo: Create Order → Capture
  └── Webhook handler

✅ MercadoPago SDK (@mercadopago/sdk-react)
  ├── Crear MercadoPagoService
  ├── Flujo: Preference → Checkout Pro
  └── Webhook handler

⚠️ Colombia: Stripe NO disponible
✅ PayPal: Funciona en Colombia
✅ MercadoPago: Funciona en Colombia
```

#### 1.2 Gamificación

```
✅ Leaderboards
  ├── Rankings semanales (reset lunes)
  ├── Rankings mensuales (reset día 1)
  └── Rankings all-time
  └── Por: ventas ($), referidos (cantidad)

✅ Achievements (15+)
  ├── first_referral - Primer referido
  ├── team_10 - 10 referidos
  ├── team_50 - 50 referidos
  ├── first_sale - Primera compra
  ├── sales_1000 - $1000 en ventas
  ├── sales_10000 - $10000 en ventas
  ├── consistency_30 - 30 días login
  └── binary_balanced - 10 izq + 10 der
```

---

### ✅ SPRINT 2: E-commerce + Automation (Semana 3) — COMPLETADO (v1.10.0)

> **Stats**: 31 tareas, 65.5 story points, 104 archivos modificados, ~26,755 líneas añadidas  
> **Tests**: 237 backend (Jest) + 132 frontend (Vitest) + 13 E2E (Playwright) = **382 total**  
> **PR**: #39 merged | 52/54 spec scenarios compliant (96.3%)  
> **Issues**: #23 Gift Cards, #21 Abandoned Cart, #22 Email Automation

#### 2.1 Carrito Abandonado (#21) ✅

```
Flujo de recuperación:
├── 0 min: Usuario agrega al carrito
├── 1 hr: Email recordatorio #1
├── 24 hr: Email recordatorio #2 + 10% descuento
└── 72 hr: Email final + 15% descuento

Features implementados:
✅ Cart persistence (localStorage + backend sync)
✅ Recovery tokens con expiración
✅ Email notifications (3-step sequence)
✅ Admin dashboard para tracking
```

#### 2.2 Email Automation (#22) ✅

```
Secuencias:
✅ Welcome Series (4 emails, Días 0-7)
✅ Onboarding (7 emails, Días 1-7)
✅ Cumpleaños (2 emails, Anual)
✅ Carrito Abandonado (3 emails)
✅ Inactividad (3 emails, 7/14/30 días)
✅ Commission Alert (inmediato)

Features implementados:
✅ Email templates (CRUD + preview)
✅ Campaign management & scheduling
✅ Recipient management & segmentation
```

#### 2.3 Gift Cards (#23) ✅

```
✅ Comprar gift cards (pagadas)
✅ Redimir en checkout
✅ Email de entrega
✅ Dashboard admin: ver/gestionar
✅ Activación/desactivación
✅ Balance tracking
```

---

### ✅ SPRINT 3: Multi-vendor + Delivery + Security Hardening — COMPLETADO (v1.11.0)

> **Stats**: 6 fases completadas, 307 tests totales (eran 195 antes del Sprint 3)  
> **Issues**: #25 Marketplace, #26 Delivery, #27 Productos Genéricos, #29/#30 SSRF, #36 DOM XSS

#### 3.0 Security Hardening ✅

```
✅ CodeQL Fixes
  ├── #29 SSRF vulnerability (backend) — URL validation
  ├── #30 SSRF vulnerability (backend) — URL validation
  └── #36 DOM XSS vulnerability (frontend) — HTML sanitization

✅ pino-http secure logging (redacta tokens/cookies)
✅ Docker hardening (non-root, read-only, no-new-privileges)
```

#### 3.1 Generic Products + Inventory ✅

```
✅ Category model (nombre, slug único, parent_id, soft-delete)
✅ Product model (SKU, tipo digital/physical/service/membership, metadatos JSON)
✅ Inventory model (stock, minStock, movimientos)
✅ Admin CRUD: /api/admin/categories, /api/admin/products
✅ Admin inventory: /api/admin/products/:id/inventory/*
✅ Public: GET /api/products, GET /api/categories
```

#### 3.2 Marketplace Multi-vendor ✅

```
✅ Vendor model (commission_rate, status: pending/approved/rejected)
✅ VendorProduct, VendorOrder models
✅ Split 3-way: plataforma / vendor / afiliado
✅ /api/vendor/dashboard — stats del vendor
✅ /api/vendor/products — productos del vendor
✅ Admin: /api/admin/vendors, PATCH /api/admin/vendors/:id/commission-rate
```

#### 3.3 Delivery Integration ✅

```
✅ ShippingAddress model (multi-dirección, is_default)
✅ DeliveryProvider model (config JSON, activo/inactivo)
✅ ShipmentTracking model (tracking_number, eventos)
✅ /api/addresses — CRUD de direcciones (montado en /api/addresses)
✅ PUT /api/orders/:id/shipping — asignar envío
✅ GET /api/orders/:id/tracking — ver tracking
✅ POST /api/webhooks/shipping/:providerId — webhook del provider
```

#### 3.4 Affiliate Contracts MVP ✅

```
✅ ContractTemplate model (versionado semver, Markdown)
✅ AffiliateContract model (IP, userAgent, SHA-256 hash, timestamp)
✅ /api/contracts — listar con estado de aceptación
✅ POST /api/contracts/:id/accept — aceptar (graba IP/hash)
✅ POST /api/contracts/:id/decline — declinar
✅ Admin CRUD: /api/admin/contracts
✅ Migración: 20260412000000-create-contract-tables.js
```

---

### 🟢 SPRINT 4: QA + Release + Nexo Bot MVP (Semana 4) — v2.0.0

#### 4.1 Test Coverage Expansion

```
Meta: 90%+ coverage

□ Backend: 237 → ~300 tests
□ Frontend: 132 → ~200 tests
□ E2E: 13 → ~50 tests

Flujos críticos a testear:
├── Registro → Login → Compra → Comisión
├── Checkout PayPal/MercadoPago
├── Gamificación completa
└── Delivery flow
```

#### 4.2 Nexo Bot MVP

```
□ OpenAI GPT-4o integration (bot/src/services/ai.service.ts)
□ Language detection ES/EN flow
□ Gender detection → Sophia or Max assignment
□ Knowledge Base loaded into system prompt
□ n8n: Google Calendar webhook (schedule visits)
□ n8n: Notion CRM (capture leads)
□ n8n: Human agent notification
□ First bot startup + WhatsApp pairing code
□ Demo ready for first pilot client
```

#### 4.3 Documentation

```
□ PRD.md ✅ — actualizado a Nexo Real v2.0.0
□ ROADMAP.md ✅ — actualizado a Nexo Real
□ API.md - nuevos endpoints (bot, contratos)
□ ARCHITECTURE.md - Nexo Bot + n8n
□ DEPLOYMENT.md - bot service + n8n Docker
└□ README.md - rebranding Nexo Real
```

---

## 🗺️ Fases del Producto

### Fase 1 — Demo MVP (NOW → Mayo 2026)

```
Target: Demo funcional para primer cliente piloto
Stack:  Plataforma core + Nexo Bot single-tenant
```

#### Sprint 7 — v2.3.0 → v2.3.5 — UI/UX + Testing + Bot Stability (Completado 2026-04-09)

```
Branch:    feature/sprint7-ui, feature/sprint7-testing, feature/sprint7-bot
Estado:    Completado 2026-04-09 (patch v2.3.5)

Phase 1 — UI/UX Rebranding:
  ✅ NexoRealLanding (hero, property grid, tour grid, CTA)       PR #99
  ✅ Fix Login.tsx + Register.tsx (skin streaming → Nexo Real)   PR #99
  ✅ Fix AppLayout/Navbar (nav items + colores)                  PR #99
  ✅ PropertyCard + TourCard (variant grid/list)                 PR #99
  ✅ Responsive 375/768/1280/1440px                              PR #99

Phase 2 — Unit Tests:
  ✅ Vitest: PropertyCard (16), TourCard (18), propertiesStore (7), toursStore (7), NexoRealLanding (21) = 69 tests   PR #100

Phase 2 — E2E:
  ✅ Playwright: properties.spec.ts (24) + tours.spec.ts (28) = 52 E2E tests   PR #101

Phase 3 — Bot Stability:
  ✅ GET /api/bot/health endpoint                                PR #102
  ✅ withRetry() utility para OpenAI calls                       PR #102
  ✅ WhatsApp disconnect handler                                 PR #102
  ✅ DEMO_SCRIPT.md                                              PR #102

Patch v2.3.5 (2026-04-09):
  ✅ fix(frontend): ReservationFlowPage.handleConfirm try/catch
  ✅ fix(lint): pushService.test.ts — unused var + const fix
  ✅ fix(cd): cd-backend.yml — Docker build context correction
  ✅ Tests: Backend 39 suites / 535 tests, Frontend 33 suites / 432 tests
```

#### Sprint 8 — v2.4.0 — Bot Production-Ready + RBAC + Seed ✅

```
Branch:    feature/sprint8-* (multiple feature branches)
Estado:    Completado 2026-04-10
PRs:       #107–#125 (16 PRs merged)
Release:   GitHub Release v2.4.0 + tag on release branch

Batch 8.1 — Bot Knowledge Base:
  ✅ prompt_kb/ con 4 archivos curados (knowledge-base.md, objection-handling.md, onboarding-affiliates.md, lead-capture-guide.md)
  ✅ FAQ real del negocio: propiedades, tours, afiliados, precios, zonas, contacto
  ✅ prompt_kb baked into Docker image (no host-mounted volumes)

Batch 8.2 — n8n Workflows:
  ✅ Google Calendar workflow "schedule-visit" → crea evento en Calendar
  ✅ Notion CRM workflow "human-handoff" → captura lead en Notion
  ✅ Notion CRM workflow "schedule-visit" → marca lead como Visit Scheduled
  ✅ Human agent notification webhook

Batch 8.3 — Bot Lead Capture:
  ✅ welcomeFlow: captura email después del nombre
  ✅ Área de interés (propiedad / turismo / afiliados)
  ✅ Persistencia de lead en DB via API interna

Batch 8.4 — Bot Onboarding + Objection Handling:
  ✅ onboarding.flow.ts: guía paso a paso para registro de afiliados
  ✅ Keywords: "quiero ser afiliado", "cómo me registro", "join", etc.
  ✅ Técnicas de objeción integradas en prompts Sophia/Max (pyramid, time, network, trust)

Batch 8.5 — RBAC 9 Roles:
  ✅ feat(rbac): 9 roles — super_admin, admin, finance, sales, advisor, vendor, user, guest, bot
  ✅ feat(auth): POST /api/auth/register/guest — registro público sin sponsor required
  ✅ feat(admin): PATCH /api/admin/users/:userId/role — actualización de rol (super_admin/admin only)
  ✅ Tests: cobertura completa de permisos por rol

Batch 8.6 — Seed Nexo Real Colombiano:
  ✅ refactor(seed): seed.ts — árbol Unilevel 12 usuarios colombianos, 6 productos, CommissionConfig
  ✅ refactor(seed): server.ts — autoSeed + banner "Nexo Real — Backend Server"
  ✅ refactor(seed): seed-e2e.sql — migrado MySQL → PostgreSQL con árbol Unilevel completo

Batch 8.7 — Bot Infrastructure:
  ✅ MemoryDB → PostgreSQLAdapter (conversaciones persisten entre reinicios)
  ✅ prompt_kb baked into Docker image (self-contained)
  ✅ CD workflow cd-bot.yml → ipproyectos/mlm-bot en Docker Hub

Batch 8.8 — Documentación:
  ✅ docs: swagger.ts v2.4.0 — 9 roles, schemas RBAC, TreeNode Unilevel
  ✅ docs: PRD.md v2.4.0 — Sprint 8 ✅, Sprint 9 planificado
  ✅ docs: backend-API.md — 2 endpoints RBAC, URL nexoreal.xyz
  ✅ docs: README.md v2.4.0 — Unilevel, 9 roles
  ✅ docs: Postman — colección y environment renombrados a Nexo Real + carpeta RBAC
```

#### Sprint 9 — v3.0.0 — TBD 📋

```
Branch:    TBD
Estado:    No iniciado — pendiente definición de alcance post-auditoría v2.4.0

Nota: Los ítems que estaban listados aquí (KB FAQ, n8n Google Calendar,
n8n Notion CRM, lead capture, onboarding, objection handling) fueron
TODOS completados en Sprint 8 (PRs #107-#125). Sprint 9 se definirá
en el próximo ciclo SDD.
```

### Fase 2 — Multi-Tenant (1–2 meses post v2.0.0)

```
□ Multi-tenant architecture
□ Per-tenant Knowledge Base management
□ Per-tenant WhatsApp number (Nexo Line 1 & 2)
□ Tenant admin dashboard
□ Billing & subscription (Free / Starter / Managed)
```

### Fase 3 — Full Contact Center SaaS (3–6 meses)

```
□ Self-service onboarding
□ White-label bot
□ Advanced analytics per tenant
□ Multi-channel (Instagram DM, Messenger)
□ Proactive WhatsApp campaigns
□ Enterprise SLA tiers
```

---

## 🏗️ Arquitectura Técnológica

### Backend Stack

```
Runtime: Node 24+ (ESM)
Framework: Express 5
Database: PostgreSQL + Redis
Email: Brevo (SMTP + API)
SMS: Brevo SMS
Pagos: PayPal + MercadoPago
Delivery: Providers via webhooks
Testing: Jest (39 suites / 528 tests)
```

### Frontend Stack

```
Framework: React 19 + Vite
Styling: Tailwind 4 + shadcn/ui
State: Zustand 5
Routing: React Router 7
i18n: i18next
PWA: Workbox
Testing: Vitest (34 files / 446 tests) + Playwright (22 specs / 262 E2E)
```

---

## 📈 Métricas Objetivo

| Métrica       | Actual (v2.4.0)                                                  | Objetivo                 |
| ------------- | ---------------------------------------------------------------- | ------------------------ |
| Test Coverage | ~70%                                                             | **90%+**                 |
| Tests Totales | ~1,236 (Backend 528 + Frontend Unit 446 + E2E 262)               | **~550** ✅ superado     |
| Features      | Pagos + Gamif + E-commerce + Multi-vendor + Delivery + Contracts | **Release v2.0.0**       |
| Delivery      | Shipping addresses + tracking                                    | **+ DiDi/Uber/InDriver** |
| Pagos         | PayPal + MP                                                      | **+ Gift Cards** ✅      |
| Gift Cards    | ✅ Implementado                                                  | —                        |
| Email Auto    | ✅ Implementado                                                  | —                        |
| Cart Recovery | ✅ Implementado                                                  | —                        |
| Multi-vendor  | ✅ Implementado                                                  | —                        |
| Contracts     | ✅ Implementado                                                  | —                        |

---

## 🏷️ Labels Disponibles

```
area:backend         - Backend area
area:frontend        - Frontend area
area:bot             - Bot / WhatsApp area
area:n8n             - n8n automation area
type:feature         - New feature
type:docs           - Documentation
priority:critical    - Critical priority
priority:high        - High priority
priority:medium      - Medium priority
priority:low         - Low priority
sprint:1             - Sprint 1
sprint:2             - Sprint 2
sprint:3             - Sprint 3
sprint:4             - Sprint 4
sprint:7             - Sprint 7 — v2.3.0 → v2.3.5
sprint:8             - Sprint 8 — v2.4.0
sprint:9             - Sprint 9 — v3.0.0
```

---

**Última actualización**: 2026-04-10  
**Proyecto**: https://github.com/users/ipproyectosysoluciones/projects/4  
**Producto**: Nexo Real — _"Conectamos tu negocio con el mundo."_
