# Roadmap del Proyecto MLM Platform

> Hoja de ruta completa para la plataforma MLM de Afiliaciones Binarias.

**Versión actual**: 1.10.0  
**Última actualización**: 2026-04-04  
**Estado**: Activo - Desarrollo intensivo  
**Meta**: v2.0.0 en ~1 mes

---

## 📊 Estado Actual del Proyecto

### ✅ Lo que YA está implementado (v1.10.0)

| Área               | Funcionalidad                        | Estado |
| ------------------ | ------------------------------------ | ------ |
| **Auth**           | JWT, 2FA, Roles                      | ✅     |
| **MLM**            | Binario con Closure Table            | ✅     |
| **Comisiones**     | 5 niveles configurables              | ✅     |
| **E-commerce**     | Productos streaming (MVP ejemplo)    | ✅     |
| **Wallet**         | Balance, transacciones, retiros      | ✅     |
| **CRM**            | Leads, Tasks, Communications         | ✅     |
| **Notificaciones** | Email (Brevo), Push (Web)            | ✅     |
| **PWA**            | Offline, instalable, shortcuts       | ✅     |
| **Landing Pages**  | Productos con SEO                    | ✅     |
| **Dashboard**      | Stats, tree view, perfil             | ✅     |
| **i18n**           | Español + Inglés                     | ✅     |
| **Pagos**          | PayPal + MercadoPago                 | ✅     |
| **Gamificación**   | Leaderboards + Achievements          | ✅     |
| **Gift Cards**     | CRUD, redeem, balance, admin         | ✅     |
| **Cart Recovery**  | Persistence, tokens, emails          | ✅     |
| **Email Auto**     | Templates, campaigns, scheduling     | ✅     |
| **Tests**          | 382 tests (237 BE + 132 FE + 13 E2E) | ✅     |

---

## 🎯 Visión del Proyecto

### Modelo de Negocio

- **Multi-vendor Marketplace**: Los afiliados pueden vender
- **Productos Genéricos**: Adaptable a cualquier negocio
- **Delivery Integrado**: Pickup + DiDi + Uber + InDriver

### Tipos de Negocio Soportados

```
□ Streaming (Netflix, Spotify, etc.) ← MVP actual
□ SaaS / Software
□ Servicios Locales (limpieza, jardinería, plomería)
□ Productos Físicos (tienda, dropshipping)
□ Cursos / Educación
□ Membresías / Club
□ Comida / Delivery ( Rappi, PedidosYa, etc.)
□ Travel
□ Health & Wellness
```

### Delivery Methods

```
✅ Pickup - Cliente recoge en punto designado
✅ DiDi Envíos - Integración con DiDi
✅ Uber Flash/Rush - Integración con Uber
✅ InDriver - Integración con InDriver
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
| 25  | Sprint 3 | Marketplace: Multi-vendor Support           | 🟡 Medium | 📋     |
| 26  | Sprint 3 | Delivery: Pickup + Ride-hailing             | 🟡 Medium | 📋     |
| 27  | Sprint 3 | E-commerce: Productos Genéricos + Inventory | 🔴 High   | 📋     |
| 29  | Sprint 3 | CodeQL: SSRF Fix                            | 🔴 High   | 📋     |
| 30  | Sprint 3 | CodeQL: SSRF Fix                            | 🔴 High   | 📋     |
| 36  | Sprint 3 | CodeQL: DOM XSS Fix                         | 🔴 High   | 📋     |
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
║  SEMANA 3 (Abr 13 - Abr 19): MULTI-VENDOR + DELIVERY             ║
║  ├── Security Hardening (#29, #30, #36)                            ║
║  ├── Productos Genéricos                                           ║
║  ├── Multi-vendor Support                                          ║
║  └── Delivery: Pickup + DiDi/Uber/InDriver                        ║
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

### 🟡 SPRINT 3: Multi-vendor + Delivery + Security Hardening (Semana 3-4)

> **Deuda técnica pendiente**: CodeQL fixes (#29 SSRF, #30 SSRF, #36 DOM XSS), Sentry issues,  
> 5 skipped tests, 610 TypeScript strict errors

#### 3.1 Security Hardening (Pre-requisito)

```
□ CodeQL Fixes
  ├── #29 SSRF vulnerability (backend)
  ├── #30 SSRF vulnerability (backend)
  └── #36 DOM XSS vulnerability (frontend)

□ Sentry Issues - Resolver errores de producción

□ Test Debt
  ├── Fix 5 skipped tests
  └── Address 610 TypeScript strict errors
```

#### 3.2 Marketplace Multi-vendor

```
□ Vendor model
├── Dashboard para afiliados vendedores
├── CRUD de productos por vendor
├── Split payments (plataforma + vendor)
└── Estados: pending, approved, rejected
```

#### 3.3 Productos Genéricos

```
Tipos de producto:
├── digital: entrega automática (email/API)
├── physical: requiere shipping
├── service: requiere cita/reserva
└── membership: acceso exclusivo

Features:
├── Inventory tracking opcional
├── SKU generable
├── Metadatos flexibles (JSON)
└── Categorías jerárquicas
```

#### 3.4 Delivery Integration

```
Providers:
├── Pickup - Puntos de recogida
├── DiDi Envíos - Integración DiDi
├── Uber Flash/Rush - Integración Uber
└── InDriver - Integración InDriver

Features:
├── Cotizador de envío por provider
├── Tracking de delivery
├── Notificaciones de status
└── Cálculo de comisiones por delivery
```

---

### 🟢 SPRINT 4: QA + Release (Semana 4)

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

#### 4.2 Documentation

```
□ API.md - nuevos endpoints
□ ARCHITECTURE.md - multi-vendor
□ DEPLOYMENT.md - servicios externos
□ ROADMAP.md - marcar v2.0.0
└□ README.md - features nuevos
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
Delivery: DiDi + Uber + InDriver
Testing: Jest (237 tests)
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

| Métrica       | Actual (v1.10.0)           | Objetivo                 |
| ------------- | -------------------------- | ------------------------ |
| Test Coverage | ~70%                       | **90%+**                 |
| Tests Totales | 382 (237 BE+132 FE+13 E2E) | **~550**                 |
| Features      | Pagos + Gamif + E-commerce | **Multi-vendor**         |
| Delivery      | N/A                        | **Pickup + 3 providers** |
| Pagos         | PayPal + MP                | **+ Gift Cards** ✅      |
| Gift Cards    | ✅ Implementado            | —                        |
| Email Auto    | ✅ Implementado            | —                        |
| Cart Recovery | ✅ Implementado            | —                        |

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

**Última actualización**: 2026-04-04  
**Proyecto**: https://github.com/users/ipproyectosysoluciones/projects/4  
**Desarrollador**: MLM Platform Team
