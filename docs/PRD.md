# Product Requirements Document (PRD)

## MLM Platform - Multi-Vendor Marketplace con Sistema de Afiliaciones

**Version**: 1.8.0  
**Status**: 🚀 IN DEVELOPMENT  
**Last Updated**: 2026-04-03  
**Document Owner**: MLM Development Team

---

# 1. Executive Summary

## Problem Statement

Las empresas MLM y e-commerce tradicionales enfrentan múltiples desafíos:

- Sistemas obsoletos con tecnología de hace décadas
- Comisiones manuales propensas a errores
- Falta de flexibilidad para diferentes modelos de negocio
- Plataformas que no escalan con el crecimiento
- Pagos complicados en mercados emergentes (Latinoamérica)

**Traditional Challenge**: MLM companies face outdated tech, manual commissions, and inflexible platforms that don't scale or support modern payment methods.

## Proposed Solution

**Plataforma SaaS Multi-Vendor con Sistema de Afiliaciones Binarias/Unilevel** que permite:

- Vendedores independientes (afiliados) que pueden vender productos
- Red de distribuidores con comisiones automáticas
- Productos genéricos (cualquier tipo de negocio)
- Entrega flexible: pickup + delivery (DiDi, Uber, InDriver)
- Pagos locales: PayPal + MercadoPago (optimizado para Colombia)

> **Status**: v1.8.0 IN DEVELOPMENT (target: Mayo 2026)

---

# 2. Vision del Producto

## Modelo de Negocio

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MLM PLATFORM - CORE                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  MULTI-VENDOR MARKETPLACE                                          │
│  ├── Afiliados pueden VENDER (no solo referir)                    │
│  ├── Admin puede crear vendedores approved                        │
│  └── Split payments (plataforma + vendor)                         │
│                                                                     │
│  SISTEMAS MLM SOPORTADOS                                          │
│  ├── Binario (original): Left/Right placement + binary spillover │
│  └── Unilevel (nuevo): Profundidad hasta nivel 10               │
│                                                                     │
│  TIPOS DE NEGOCIO SOPORTADOS                                      │
│  ├── Streaming (Netflix, Spotify, HBO)                           │
│  ├── SaaS / Software (herramientas, cursos)                       │
│  ├── Servicios Locales (limpieza, plomería)                      │
│  ├── Productos Físicos (tienda, dropshipping)                    │
│  ├── Comida / Delivery ( Rappi-like)                            │
│  ├── Cursos / Educación (membresías)                            │
│  └── Travel (hoteles, tours)                                     │
│                                                                     │
│  DELIVERY METHODS                                                 │
│  ├── Pickup - Cliente recoge en punto                            │
│  ├── DiDi Envíos - Integración con DiDi                         │
│  ├── Uber Flash/Rush - Integración con Uber                      │
│  └── InDriver - Integración con InDriver                        │
│                                                                     │
│  PAGOS (Colombia-Friendly)                                        │
│  ├── PayPal - Funciona en Colombia ✅                            │
│  ├── MercadoPago - Funciona en Colombia ✅                        │
│  └── Wallet interno - Balance de comisiones                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## User Personas

### 1. Afiliado-Vendedor (Dual Role)

**Profile**:

- Age: 25-55
- Tech Savviness: Medium-High
- Primary Goal: Generar ingresos por ventas Y construir red de referidos

**Needs**:

- Dashboard con ventas, comisiones y red
- Catálogo de productos para vender
- Herramientas de marketing (links de referido)
- Gestión de pedidos y delivery
- Notificaciones de nuevas ventas/comisiones

### 2. Comprador/Cliente

**Profile**:

- Age: 18-65
- Tech Savviness: Variable
- Primary Goal: Comprar productos de forma rápida y segura

**Needs**:

- Checkout rápido
- Múltiples métodos de pago
- Opciones de delivery flexibles
- Seguimiento de pedido en tiempo real

### 3. Admin Corporativo

**Profile**:

- Role: Operations Manager
- Primary Goal: Gestión de plataforma y vendedores

**Needs**:

- Panel de control con métricas globales
- Gestión de vendedores (approve/reject)
- Reportes de ventas y comisiones
- CRM para leads

---

# 3. Funcionalidades Core

## 3.1 Sistema de Autenticación

| Feature                   | Descripción                          | Prioridad |
| ------------------------- | ------------------------------------ | --------- |
| Registro con sponsor code | Usuario se registra bajo un afiliado | 🔴 Alta   |
| Login JWT                 | Autenticación con tokens             | 🔴 Alta   |
| 2FA                       | Códigos TOTP                         | 🟡 Media  |
| KYC (futuro)              | Verificación de identidad            | 🟢 Baja   |

## 3.2 Sistema MLM

### Binario (Original)

```
Estructura:
├── Left/Right placement automático
├── Binary commissions (10% directo, niveles 1-5)
├── Spillover cuando un lado está vacío
└── Closure Table para queries eficientes
```

### Unilevel (Nuevo)

```
Estructura:
├── Profundidad hasta nivel 10
├── Porcentaje plano configurable por nivel
└── Sin limitación izquierda/derecha
```

### Configuración de Comisiones

```typescript
// Ejemplo: Binary
{
  type: 'binary',
  direct: 0.10,      // 10%
  level_1: 0.05,    // 5%
  level_2: 0.03,    // 3%
  level_3: 0.02,    // 2%
  level_4: 0.01     // 1%
}

// Ejemplo: Unilevel
{
  type: 'unilevel',
  level_1: 0.10,    // 10%
  level_2: 0.08,     // 8%
  level_3: 0.05,     // 5%
  level_4: 0.03,     // 3%
  level_5: 0.02,     // 2%
  // ... hasta level 10
}
```

## 3.3 Multi-Vendor Marketplace

| Feature            | Descripción                                        | Prioridad |
| ------------------ | -------------------------------------------------- | --------- |
| Vendor申请         | Afiliados pueden aplicar para ser vendedores       | 🔴 Alta   |
| Admin approval     | Admin approves/rejects vendors                     | 🔴 Alta   |
| Vendor dashboard   | Dashboard para gestionar productos y pedidos       | 🔴 Alta   |
| Split payments     | % configurable para plataforma y vendor            | 🔴 Alta   |
| Vendor commissions | Los vendors también ganan comisiones por referrals | 🟡 Media  |

## 3.4 Productos Genéricos

| Feature             | Descripción                            | Prioridad |
| ------------------- | -------------------------------------- | --------- |
| CRUD productos      | Crear/editar/eliminar productos        | 🔴 Alta   |
| Tipos de producto   | digital, physical, service, membership | 🔴 Alta   |
| Inventory tracking  | Stock opcional con alertas             | 🟡 Media  |
| Categorías          | Jerárquicas (parent-child)             | 🔴 Alta   |
| SKU generable       | Auto-generado o manual                 | 🟡 Media  |
| Metadatos flexibles | JSON para atributos extra              | 🟢 Baja   |

## 3.5 Delivery Integration

| Provider        | Status             | Description              |
| --------------- | ------------------ | ------------------------ |
| Pickup Points   | 🚀 Por implementar | Puntos de recogida       |
| DiDi Envíos     | 🚀 Por implementar | Integración DiDi API     |
| Uber Flash/Rush | 🚀 Por implementar | Integración Uber API     |
| InDriver        | 🚀 Por implementar | Integración InDriver API |

## 3.6 Gamificación

### Leaderboards

| Type     | Reset       | Metrics           |
| -------- | ----------- | ----------------- |
| Semanal  | Lunes 00:00 | Ventas, Referidos |
| Mensual  | Día 1 00:00 | Ventas, Referidos |
| All-time | Nunca       | Ventas, Referidos |

### Achievements (15+)

| ID              | Nombre                | Condición       | Reward |
| --------------- | --------------------- | --------------- | ------ |
| first_referral  | Primer Paso           | 1 referral      | Badge  |
| team_10         | Equipo en Crecimiento | 10 referrals    | Badge  |
| team_50         | Líder                 | 50 referrals    | Badge  |
| first_sale      | Primera Venta         | 1 order         | Badge  |
| sales_1000      | Vendedor              | $1000 total     | Badge  |
| sales_10000     | Top Seller            | $10000 total    | Badge  |
| consistency_30  | Constante             | 30 días login   | Badge  |
| binary_balanced | Equilibrado           | 10 izq + 10 der | Badge  |

## 3.7 Email Automation (Brevo)

| Secuencia          | Trigger                | Emails           | Prioridad |
| ------------------ | ---------------------- | ---------------- | --------- |
| Welcome Series     | Registro               | 4 (Días 0-7)     | 🔴 Alta   |
| Onboarding         | Registro               | 7 (Días 1-7)     | 🔴 Alta   |
| Birthday           | Fecha nacimiento       | 2 (anual)        | 🟡 Media  |
| Carrito Abandonado | Carrito sin checkout   | 3 (1h, 24h, 72h) | 🔴 Alta   |
| Inactividad        | Sin login 7/14/30 días | 3                | 🟡 Media  |
| Commission Alert   | Nueva comisión         | 1 (inmediato)    | 🔴 Alta   |

---

# 4. Tech Stack

## Backend

```
Runtime: Node 24+ (ESM)
Framework: Express 5
Database: PostgreSQL + Redis
ORM: Sequelize 6
Email: Brevo (SMTP + API)
SMS: Brevo SMS
Payments: PayPal SDK + MercadoPago SDK
Delivery: DiDi + Uber + InDriver APIs
Testing: Jest (123+ tests)
```

## Frontend

```
Framework: React 19 + Vite
Styling: Tailwind CSS 4 + shadcn/ui
State: Zustand 5
Routing: React Router 7
i18n: i18next
PWA: Workbox
Testing: Vitest (102+ tests)
E2E: Playwright
```

---

# 5. API Endpoints

## Payments

```
POST /api/payment/paypal/create      - Crear orden PayPal
POST /api/payment/paypal/capture     - Capturar pago PayPal
POST /api/payment/paypal/webhook     - Webhook PayPal
POST /api/payment/mercadopago/preference - Crear preferencia MP
POST /api/payment/mercadopago/webhook    - Webhook MP
```

## Gamificación

```
GET  /api/leaderboard              - Obtener rankings
GET  /api/achievements             - Obtener achievements
POST /api/achievements/claim       - Reclamar reward
```

## Marketplace

```
POST /api/vendors                  - Solicitar ser vendor
GET  /api/vendors                  - Listar vendors
PATCH /api/vendors/:id/approve     - Aprobar vendor
PATCH /api/vendors/:id/reject      - Rechazar vendor
```

## Delivery

```
POST /api/delivery/quote           - Cotizar envío
POST /api/delivery/create          - Crear envío
GET  /api/delivery/track/:id      - Tracking de envío
```

## Productos

```
GET  /api/products                 - Listar productos
POST /api/products                 - Crear producto (vendor)
PATCH /api/products/:id            - Editar producto
DELETE /api/products/:id           - Eliminar producto
```

---

# 6. Database Schema

## Nuevas Tablas

### Vendors

```sql
CREATE TABLE vendors (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  business_name VARCHAR(255),
  status ENUM('pending', 'approved', 'rejected'),
  commission_rate DECIMAL(5,2),  -- % para vendor
  platform_fee DECIMAL(5,2),      -- % para plataforma
  approved_at TIMESTAMP,
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Products (Refactorizado)

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id),  -- NULL = admin
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  type ENUM('digital', 'physical', 'service', 'membership'),
  delivery_method ENUM('automatic', 'shipping', 'pickup', 'appointment'),
  inventory_tracked BOOLEAN DEFAULT false,
  inventory_quantity INTEGER,
  sku VARCHAR(100),
  metadata JSONB,
  status ENUM('active', 'inactive'),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Achievements

```sql
CREATE TABLE achievements (
  id UUID PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url VARCHAR(500),
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_achievements (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  achievement_id UUID REFERENCES achievements(id),
  unlocked_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);
```

### Leaderboards

```sql
CREATE TABLE leaderboard_entries (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  period ENUM('weekly', 'monthly', 'all_time'),
  metric VARCHAR(50),           -- 'sales', 'referrals'
  value DECIMAL(15,2),
  rank INTEGER,
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, period, metric, period_start)
);
```

### GiftCards

```sql
CREATE TABLE gift_cards (
  id UUID PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  balance DECIMAL(10,2) NOT NULL,
  purchaser_id UUID REFERENCES users(id),
  recipient_email VARCHAR(255),
  status ENUM('active', 'redeemed', 'expired'),
  expires_at TIMESTAMP,
  redeemed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

# 7. Roadmap v1.8.0

### Sprint 1: Monetización (Semanas 1-2)

- [ ] #17 PayPal SDK Integration
- [ ] #18 MercadoPago SDK Integration
- [ ] #19 Leaderboards
- [ ] #20 Achievements + Badges

### Sprint 2: E-commerce + Automation (Semana 3)

- [ ] #21 Carrito Abandonado
- [ ] #22 Email Automation (Brevo)
- [ ] #23 Gift Cards

### Sprint 3: Multi-vendor + Delivery (Semana 3)

- [ ] #25 Multi-vendor Support
- [ ] #26 Delivery: Pickup + DiDi/Uber/InDriver
- [ ] #27 Productos Genéricos + Inventory

### Sprint 4: QA + Release (Semana 4)

- [ ] #28 Test Coverage Expansion (90%+)
- [ ] #29 v1.8.0 Production Release
- [ ] #30 Documentation Update

**GitHub Project**: https://github.com/users/ipproyectosysoluciones/projects/4

---

# 8. Success Metrics

| KPI                  | Target        | Current |
| -------------------- | ------------- | ------- |
| Test Coverage        | >= 90%        | ~60%    |
| API Response Time    | < 200ms (p95) | TBD     |
| System Uptime        | >= 99.5%      | TBD     |
| Payment Success Rate | >= 95%        | N/A     |
| Email Open Rate      | >= 20%        | N/A     |

---

# 9. Risks & Mitigations

| Risk                          | Probability | Impact   | Mitigation                         |
| ----------------------------- | ----------- | -------- | ---------------------------------- |
| Payment gateway downtime      | Medium      | High     | Multiple providers (PayPal + MP)   |
| Delivery API changes          | Medium      | Medium   | Abstract provider behind interface |
| Commission calculation errors | Low         | Critical | 100% test coverage                 |
| Vendor fraud                  | Medium      | High     | Admin approval + KYC (future)      |

---

# 10. Document History

| Version | Date       | Author   | Changes                                  |
| ------- | ---------- | -------- | ---------------------------------------- |
| 1.8.0   | 2026-04-03 | MLM Team | Updated to multi-vendor + delivery scope |
| 1.3.0   | 2026-03-30 | MLM Team | MVP streaming e-commerce                 |
| 1.0.0   | 2026-03-21 | MLM Team | Initial PRD                              |

---

**Approval**

| Role          | Name | Date | Signature |
| ------------- | ---- | ---- | --------- |
| Product Owner | TBD  | -    |           |
| Tech Lead     | TBD  | -    |           |
| QA Lead       | TBD  | -    |           |

---

_This PRD is a living document. Update status and scope as the project evolves._
