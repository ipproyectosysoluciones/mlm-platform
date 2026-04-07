# Roadmap — Nexo Real

> Hoja de ruta completa para la plataforma **Nexo Real** — Servicios Inmobiliarios, Turismo/Hospitalidad y Afiliaciones.  
> _"Conectamos tu negocio con el mundo."_

**Versión actual**: v2.1.0 — Sprint 5 Completado ✅  
**Última actualización**: 2026-04-07  
**Estado**: Activo - Desarrollo intensivo  
**Meta**: v3.0.0 — expansión México + Argentina

---

## 📊 Estado Actual del Proyecto

### ✅ Lo que YA está implementado (v2.1.0)

| Área                     | Funcionalidad                                         | Estado |
| ------------------------ | ----------------------------------------------------- | ------ |
| **Auth**                 | JWT, 2FA, Roles                                       | ✅     |
| **MLM**                  | Binario con Closure Table                             | ✅     |
| **Comisiones**           | 5 niveles configurables                               | ✅     |
| **E-commerce**           | Productos streaming (MVP ejemplo)                     | ✅     |
| **Wallet**               | Balance, transacciones, retiros                       | ✅     |
| **CRM**                  | Leads, Tasks, Communications                          | ✅     |
| **Notificaciones**       | Email (Brevo), Push (Web)                             | ✅     |
| **PWA**                  | Offline, instalable, shortcuts                        | ✅     |
| **Landing Pages**        | Productos con SEO                                     | ✅     |
| **Dashboard**            | Stats, tree view, perfil                              | ✅     |
| **i18n**                 | Español + Inglés                                      | ✅     |
| **Pagos**                | PayPal + MercadoPago                                  | ✅     |
| **Gamificación**         | Leaderboards + Achievements                           | ✅     |
| **Gift Cards**           | CRUD, redeem, balance, admin                          | ✅     |
| **Cart Recovery**        | Persistence, tokens, emails                           | ✅     |
| **Email Auto**           | Templates, campaigns, scheduling                      | ✅     |
| **Security**             | SSRF, XSS, pino-http, Docker hardening                | ✅     |
| **Products**             | Generic products + inventory + categories             | ✅     |
| **Marketplace**          | Multi-vendor, commission split 3-way                  | ✅     |
| **Delivery**             | Shipping addresses, providers, tracking               | ✅     |
| **Contracts**            | Affiliate contracts MVP con hash/IP                   | ✅     |
| **Tests**                | 307 tests (integration + E2E)                         | ✅     |
| **Real Estate Frontend** | PropertiesPage, PropertyDetailPage, filtros, galería  | ✅     |
| **Tourism Frontend**     | ToursPage, TourDetailPage, itinerario, disponibilidad | ✅     |
| **Reservation Wizard**   | Wizard 3 pasos + MisReservasPage + reservationStore   | ✅     |
| **Tests**                | 307+ tests (integration + E2E + Vitest frontend)      | ✅     |

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
Testing: Jest (307 tests)
```

### Frontend Stack

```
Framework: React 19 + Vite
Styling: Tailwind 4 + shadcn/ui
State: Zustand 5
Routing: React Router 7
i18n: i18next
PWA: Workbox
Testing: Vitest (132 tests) + Playwright (13 E2E)
```

---

## 📈 Métricas Objetivo

| Métrica       | Actual (v1.11.0)                                                 | Objetivo                 |
| ------------- | ---------------------------------------------------------------- | ------------------------ |
| Test Coverage | ~70%                                                             | **90%+**                 |
| Tests Totales | 307 (integration + E2E)                                          | **~550**                 |
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
```

---

**Última actualización**: 2026-04-07  
**Proyecto**: https://github.com/users/ipproyectosysoluciones/projects/4  
**Producto**: Nexo Real — _"Conectamos tu negocio con el mundo."_
