# Roadmap del Proyecto MLM Platform

> Hoja de ruta completa para la plataforma MLM de Afiliaciones Binarias.

**Versión actual**: 1.9.0  
**Última actualización**: 2026-04-03  
**Estado**: Activo - Sprint 2 iniciando  
**Meta**: v2.0.0 en ~2 semanas

---

## 📊 Estado Actual del Proyecto

### ✅ Lo que YA está implementado

| Área                | Funcionalidad                          | Estado | Versión   |
| ------------------- | -------------------------------------- | ------ | --------- |
| **Auth**            | JWT, 2FA, Roles                        | ✅     | 1.4.0     |
| **MLM**             | Binario con Closure Table              | ✅     | 1.0.0     |
| **Comisiones**      | 5 niveles configurables                | ✅     | 1.0.0     |
| **E-commerce**      | Productos streaming (MVP ejemplo)      | ✅     | 1.5.0     |
| **Wallet**          | Balance, transacciones, retiros        | ✅     | 1.4.0     |
| **CRM**             | Leads, Tasks, Communications           | ✅     | 1.1.0     |
| **Notificaciones**  | Email (Brevo), Push (Web)              | ✅     | 1.6.0     |
| **PWA**             | Offline, instalable, shortcuts         | ✅     | 1.7.0     |
| **Landing Pages**   | Productos con SEO                      | ✅     | 1.7.0     |
| **Dashboard**       | Stats, tree view, perfil               | ✅     | 1.0.0     |
| **i18n**            | Español + Inglés                       | ✅     | 1.6.0     |
| **Tests**           | ~250 tests (backend + frontend)        | ✅     | 1.0.0     |
| **Pagos**           | PayPal + MercadoPago webhooks          | ✅     | 1.8.0     |
| **🎮 Gamificación** | **Leaderboards + Achievements/Badges** | **✅** | **1.9.0** |

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

### Issues Creados (13 tareas)

| #   | Sprint   | Task                                        | Priority    |
| --- | -------- | ------------------------------------------- | ----------- |
| 17  | Sprint 1 | Pagos: Integrar PayPal SDK                  | 🔴 High     |
| 18  | Sprint 1 | Pagos: Integrar MercadoPago SDK             | 🔴 High     |
| 19  | Sprint 1 | Gamificación: Leaderboards                  | 🔴 High     |
| 20  | Sprint 1 | Gamificación: Achievements y Badges         | 🔴 High     |
| 21  | Sprint 2 | E-commerce: Carrito Abandonado              | 🟡 Medium   |
| 22  | Sprint 2 | Email: Automation Sequences con Brevo       | 🟡 Medium   |
| 23  | Sprint 2 | E-commerce: Gift Cards                      | 🟡 Medium   |
| 25  | Sprint 3 | Marketplace: Multi-vendor Support           | 🟡 Medium   |
| 26  | Sprint 3 | Delivery: Pickup + Ride-hailing             | 🟡 Medium   |
| 27  | Sprint 3 | E-commerce: Productos Genéricos + Inventory | 🔴 High     |
| 28  | Sprint 4 | QA: Test Coverage Expansion                 | 🔴 High     |
| 29  | Sprint 4 | Deploy: v1.8.0 Production Release           | 🔴 Critical |
| 30  | Sprint 4 | Docs: Actualizar documentación técnica      | 🟡 Medium   |

---

## 🗓️ Timeline - 4 Semanas

```
╔══════════════════════════════════════════════════════════════════════╗
║                    MES 1: HASTA 2026-04-17                         ║
╠══════════════════════════════════════════════════════════════════════╣
║  ✅ SEMANA 1 (Mar 30 - Abr 5): MONETIZACIÓN                        ║
║  ├── ✅ Pagos: PayPal SDK                                          ║
║  ├── ✅ Pagos: MercadoPago SDK                                     ║
║  └── ✅ Gamificación: Leaderboards + Achievements (HECHO Apr 03)   ║
╠══════════════════════════════════════════════════════════════════════╣
║  🎯 SEMANA 2 (Abr 6 - Abr 12): E-COMMERCE MVP                     ║
║  ├── Carrito Abandonado (abandoned_cart recovery)                  ║
║  ├── Email Automation Sequences (Brevo templates)                  ║
║  ├── Gift Cards (digital + código)                                 ║
║  └── Testing Sprint 1 + Sprint 2 prep                              ║
╠══════════════════════════════════════════════════════════════════════╣
║  🚀 SEMANA 3 (Abr 13 - Abr 19): MULTI-VENDOR + DELIVERY           ║
║  ├── Marketplace: Multi-vendor Support (seller profiles)           ║
║  ├── Delivery: Pickup + DiDi/Uber/InDriver integration            ║
║  ├── Productos Genéricos + Inventory                               ║
║  └── Integration testing                                            ║
╠══════════════════════════════════════════════════════════════════════╣
║  📦 SEMANA 4 (Abr 20 - Abr 26): QA + RELEASE                      ║
║  ├── Test Coverage Expansion (90%+)                                ║
║  ├── Final integration testing                                      ║
║  ├── Documentation v2.0.0                                           ║
║  └── 🎉 v2.0.0 RELEASE (Abr 27)                                   ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## 📋 Detalle de Sprints

### ✅ SPRINT 1: Monetización (Semana 1 - COMPLETADO 2026-04-03)

#### 1.1 Pagos: PayPal + MercadoPago ✅

```
✅ PayPal SDK (@paypal/react-paypal-js)
  ├── PayPalService: create order, capture, webhooks
  ├── PayPalController: webhook verification + idempotency
  └── PR #17 (merged to main v1.8.0)

✅ MercadoPago SDK (@mercadopago/sdk-react)
  ├── MercadoPagoService: HMAC-SHA256 webhook verification
  ├── Checkout Pro redirect (no iframe)
  ├── OrderProcessing page for post-payment redirect
  └── PR #36 (merged to main v1.8.1)

Note: Colombia - Stripe NOT available
```

#### 1.2 Gamificación ✅

```
✅ Leaderboards (PR #37, v1.8.2)
  ├── Weekly/Monthly/All-time rankings
  ├── Redis cache (TTL 5 min)
  ├── Top 10 + user's current rank
  └── Animated podium + ranking table

✅ Achievements & Badges (PR #38, v1.8.3)
  ├── 8 achievements (bronze/silver/gold/platinum)
  ├── Types: sales, referrals, network depth, top seller, login streak
  ├── Auto-unlock on purchase/registration/login events
  └── Badge rewards per achievement milestone

Result: v1.9.0 released with all 3 features
```

---

### 🎯 SPRINT 2: E-Commerce MVP (Semana 2 - PRÓXIMO)

├── Rankings mensuales (reset día 1)
└── Rankings all-time
└── Por: ventas ($), referidos (cantidad)

□ Achievements (15+)
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

### 🟡 SPRINT 2: E-commerce + Automation (Semana 3)

#### 2.1 Carrito Abandonado

```

Flujo de recuperación:
├── 0 min: Usuario agrega al carrito
├── 1 hr: Email recordatorio #1
├── 24 hr: Email recordatorio #2 + 10% descuento
└── 72 hr: Email final + 15% descuento

```

#### 2.2 Email Automation (Brevo)

```

Secuencias:
├── Welcome Series (4 emails, Días 0-7)
├── Onboarding (7 emails, Días 1-7)
├── Cumpleaños (2 emails, Anual)
├── Carrito Abandonado (3 emails)
├── Inactividad (3 emails, 7/14/30 días)
└── Commission Alert (inmediato)

```

#### 2.3 Gift Cards

```

├── Comprar gift cards (pagadas)
├── Redimir en checkout
├── Email de entrega
└── Dashboard admin: ver/gestionar

```

---

### 🟡 SPRINT 3: Multi-vendor + Delivery (Semana 3)

#### 3.1 Marketplace Multi-vendor

```

□ Vendor model
├── Dashboard para afiliados vendedores
├── CRUD de productos por vendor
├── Split payments (plataforma + vendor)
└── Estados: pending, approved, rejected

```

#### 3.2 Productos Genéricos

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

#### 3.3 Delivery Integration

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

□ Backend: 123 → ~180 tests
□ Frontend: 102 → ~150 tests
□ E2E: ~50 tests

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
□ ROADMAP.md - marcar v1.8.0
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
Testing: Jest (123 tests)

```

### Frontend Stack

```

Framework: React 19 + Vite
Styling: Tailwind 4 + shadcn/ui
State: Zustand 5
Routing: React Router 7
i18n: i18next
PWA: Workbox
Testing: Vitest (102 tests)

```

---

## 📈 Métricas Objetivo

| Métrica       | Antes       | Objetivo                 |
| ------------- | ----------- | ------------------------ |
| Test Coverage | ~60%        | **90%+**                 |
| Tests Totales | 225         | **~350**                 |
| Features      | Streaming   | **Multi-vendor**         |
| Delivery      | N/A         | **Pickup + 3 providers** |
| Pagos         | Wallet only | **PayPal + MP**          |

---

## 🏷️ Labels Disponibles

```

area:backend - Backend area
area:frontend - Frontend area
type:feature - New feature
type:docs - Documentation
priority:critical - Critical priority
priority:high - High priority
priority:medium - Medium priority
priority:low - Low priority
sprint:1 - Sprint 1
sprint:2 - Sprint 2
sprint:3 - Sprint 3
sprint:4 - Sprint 4

```

---

**Última actualización**: 2026-04-03
**Proyecto**: https://github.com/users/ipproyectosysoluciones/projects/4
**Desarrollador**: MLM Platform Team
```
