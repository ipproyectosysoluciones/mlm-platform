# Product Requirements Document (PRD)

## Nexo Real — Plataforma SaaS de Servicios Inmobiliarios, Turismo y Afiliaciones

**Version**: 2.4.0  
**Status**: ✅ v2.4.0 Released  
**Last Updated**: 2026-04-10  
**Document Owner**: Nexo Real Development Team  
**Tagline**: _"Conectamos tu negocio con el mundo."_

---

# 1. Executive Summary

## Problem Statement

Las agencias inmobiliarias, hoteles, hosterías y operadores turísticos en LATAM enfrentan barreras tecnológicas críticas:

- Gestionan su negocio en Excel o WhatsApp manual sin automatización
- No tienen acceso a herramientas de CRM o captación digital asequibles
- No pueden escalar su cartera de clientes sin contratar más vendedores
- Carecen de sistemas de afiliación para multiplicar su red de referidos
- La atención al cliente es 100% manual, sin disponibilidad 24/7

**The core gap**: Existe tecnología de clase mundial para grandes empresas, pero el dueño de una hostería en Medellín o una agencia inmobiliaria en Bogotá no puede pagarla ni usarla.

## Proposed Solution

**Nexo Real** es una plataforma SaaS multi-tenant que combina:

1. **Sistema MLM Unilevel** — Red de afiliados con comisiones automáticas por venta de servicios inmobiliarios y turísticos
2. **Nexo Bot** — Agente AI conversacional por WhatsApp (BuilderBot + Baileys + OpenAI GPT-4o) con agentes Sophia y Max
3. **CRM integrado** — Gestión de leads, tareas, comunicaciones, y agendamiento
4. **Integraciones n8n** — Google Calendar, Notion, notificación a agente humano

> **Status**: v2.2.0 RELEASED ✅

---

# 2. Visión del Producto

## Modelo de Negocio

```
┌──────────────────────────────────────────────────────────────────────┐
│                        NEXO REAL — CORE                              │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  SERVICIOS PRINCIPALES                                               │
│  ├── Real Estate (Bienes Raíces)                                    │
│  │   ├── Rentals (arrendamiento de aptos, casas, fincas)           │
│  │   ├── Sales (venta de inmuebles)                                 │
│  │   └── Property Management (administración y mantenimiento)       │
│  └── Tourism & Hospitality                                          │
│      ├── Hospitality (hoteles, hosterías, posadas)                  │
│      └── Travel Packages (paquetes turísticos)                      │
│                                                                      │
│  SISTEMA MLM                                                         │
│  └── Unilevel con bonos estructurados                               │
│      ├── Comisiones por cierre de servicio (directo)                │
│      ├── Bonos por equipo (niveles 1-10)                            │
│      └── Bonos por desempeño (rendimiento de red)                   │
│                                                                      │
│  NEXO BOT (AI WhatsApp)                                             │
│  ├── Agente Sophia (atiende hombres)                                │
│  ├── Agente Max (atiende mujeres)                                   │
│  ├── Detección de idioma ES/EN                                      │
│  ├── Knowledge Base configurable por tenant                         │
│  └── Escalación a agente humano siempre disponible                  │
│                                                                      │
│  PLATAFORMA MULTI-TENANT (Fase 2)                                   │
│  ├── Nexo Line 1 (Free/Demo): número compartido, KB genérica       │
│  ├── Nexo Line 2 (Managed): número propio, KB personalizada        │
│  └── Enterprise: onboarding self-service, API propia               │
│                                                                      │
│  PAGOS (LATAM-Friendly)                                             │
│  ├── PayPal ✅ (Colombia, México, Argentina)                        │
│  └── MercadoPago ✅ (optimizado para LATAM)                        │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## Mercados Objetivo

| Mercado     | Estado                  | Foco                           |
| ----------- | ----------------------- | ------------------------------ |
| Colombia    | 🟢 Activo (base actual) | Bogotá, Medellín, Cartagena    |
| México      | 🟡 Próximo              | CDMX, Cancún, Guadalajara      |
| Argentina   | 🟡 Próximo              | Buenos Aires, Córdoba, Mendoza |
| Resto LATAM | 🔲 Fase 3               | Expansión gradual              |

---

# 3. User Personas

### 1. Afiliado / Asesor Comercial

**Perfil**:

- Edad: 25–55 años
- Ciudades con alto flujo inmobiliario o turístico
- Agentes inmobiliarios, brokers, promotores de turismo, profesionales con redes amplias
- Objetivo: generar ingresos por comisiones sin inventario ni inversión inicial alta

**Necesidades**:

- Dashboard con balance, red, comisiones y historial
- Links de referido y herramientas de marketing digital
- Notificaciones de nuevas comisiones
- Acceso a KB del producto para presentar servicios
- Contratos de afiliación digitales

### 2. Cliente Final (Comprador / Viajero)

**Perfil**:

- Edad: 18–65 años
- Busca servicios inmobiliarios (arrendar/comprar) o paquetes turísticos
- Primer contacto generalmente vía WhatsApp (Nexo Bot)

**Necesidades**:

- Atención rápida, 24/7 via WhatsApp
- Información clara sobre servicios y precios
- Agendamiento de visitas o consultas
- Escalación fácil a un asesor humano cuando lo requiera

### 3. Agencia / Propietario (Tenant en Fase 2)

**Perfil**:

- Dueño de hostería, hotel boutique, agencia inmobiliaria
- Actualmente usa Excel o WhatsApp manual
- No tiene acceso a CRM ni herramientas de automatización asequibles

**Necesidades**:

- Su propio bot de WhatsApp con su número
- Knowledge Base con info de su negocio
- Panel de administración simple
- Notificaciones de leads a su equipo

### 4. Admin Corporativo (Nexo Real Interno)

**Perfil**:

- Rol: Operations Manager / Tech Lead
- Objetivo: gestión de la plataforma, tenants, afiliados, comisiones

**Necesidades**:

- Panel de control con métricas globales
- Gestión de afiliados (aprobación, suspensión)
- Reportes de ventas y comisiones
- CRM de leads global
- Configuración de planes de comisión

---

# 4. Funcionalidades Core

## 4.1 Sistema de Autenticación

| Feature                   | Descripción                          | Prioridad | Estado |
| ------------------------- | ------------------------------------ | --------- | ------ |
| Registro con sponsor code | Usuario se registra bajo un afiliado | 🔴 Alta   | ✅     |
| Login JWT                 | Autenticación con tokens             | 🔴 Alta   | ✅     |
| 2FA                       | Códigos TOTP                         | 🟡 Media  | ✅     |
| KYC (futuro)              | Verificación de identidad            | 🟢 Baja   | 🔲     |

## 4.2 Sistema MLM — Unilevel con Bonos Estructurados

### ¿Por qué Unilevel y no Binario?

Los servicios inmobiliarios y turísticos tienen:

- **Ticket alto** — no hay compras recurrentes frecuentes
- **Ciclos de venta largos** — no es compra impulsiva
- **Comisiones altas pero esporádicas**

El modelo Binario genera desbalance estructural en este contexto. El **Unilevel con bonos** es más predecible y más justo.

### Estructura de Comisiones

```
Comisión directa (cierre de servicio):
├── Nivel 0 (venta propia):     hasta configurable por tipo de servicio

Bonos de equipo (Unilevel, hasta nivel 10):
├── Nivel 1: 10%
├── Nivel 2:  8%
├── Nivel 3:  5%
├── Nivel 4:  3%
├── Nivel 5:  2%
└── Niveles 6-10: configurable

Bonos adicionales:
├── Bono por cierre (cierre de negocio de alto valor)
├── Bono por referido directo
└── Bono por desempeño de equipo
```

### Tipos de Servicio y Comisión Base

| Servicio            | Comisión sugerida                 |
| ------------------- | --------------------------------- |
| Arrendamiento       | % del primer mes o valor acordado |
| Venta de inmueble   | % sobre valor de la transacción   |
| Property Management | % mensual sobre contrato          |
| Paquete turístico   | % sobre valor del paquete         |
| Hospitalidad        | % sobre reserva confirmada        |

> ⚠️ **DISCLAIMER**: Las comisiones son referenciales. Los ingresos dependen del esfuerzo, la red y el mercado. No se garantizan ganancias.

## 4.3 Nexo Bot — AI WhatsApp Agent

### Agentes

| Agente     | Género    | Atiende a         | Personalidad                 |
| ---------- | --------- | ----------------- | ---------------------------- |
| **Sophia** | Femenino  | Hombres (default) | Cálida, carismática, directa |
| **Max**    | Masculino | Mujeres           | Empático, confiable, claro   |

### Capacidades del Bot

| Feature                     | Descripción                                       | Prioridad | Estado | Nota                                              |
| --------------------------- | ------------------------------------------------- | --------- | ------ | ------------------------------------------------- |
| Detección de idioma ES/EN   | Pregunta al inicio, mantiene toda la conversación | 🔴 Alta   | ✅     | `language.flow.ts` implementado                   |
| Detección de género         | Por nombre / preferencia, asigna Sophia o Max     | 🔴 Alta   | ✅     | `agent.flow.ts` + `ai.service.detectAgent()`      |
| Captación de leads          | Nombre, teléfono, email, área de interés          | 🔴 Alta   | ⚠️     | Captura nombre+teléfono. Falta email+interés+DB   |
| Onboarding de afiliados     | Guía paso a paso para registrarse                 | 🔴 Alta   | 🔲     | Sprint 8                                          |
| Soporte a afiliados activos | Saldo, red, comisiones por WhatsApp               | 🔴 Alta   | ✅     | `balance/network/commissions flows`               |
| FAQ del negocio             | Responde con Knowledge Base, nunca inventa        | 🔴 Alta   | ⚠️     | Prompt listo, `knowledge-base.md` vacío. Sprint 8 |
| Agendamiento de citas       | Google Calendar vía n8n                           | 🟡 Media  | ⚠️     | `schedule.flow.ts` listo, falta workflow en n8n   |
| Escalación a humano         | Siempre disponible, sin excusas                   | 🔴 Alta   | ✅     | `handoff.flow.ts` implementado                    |
| Manejo de objeciones        | Pyramid, time, network, trust                     | 🟡 Media  | 🔲     | Sprint 8                                          |

### Reglas Duras del Bot (Non-Negotiable)

1. **NUNCA ALUCINAR** — Si no está en la KB, escalar a humano
2. **NUNCA GARANTIZAR GANANCIAS** — Siempre incluir disclaimer
3. **SIEMPRE OFRECER ESCALACIÓN HUMANA** — En cualquier punto de la conversación
4. **NUNCA MENCIONAR LA EMPRESA DEV** — Solo Nexo Real
5. **NUNCA PRESIONAR** — Cálido y profesional, jamás manipulador

### Stack Técnico del Bot

```
Runtime:     Node.js (CommonJS)
Framework:   BuilderBot + Baileys (WhatsApp Web API)
AI:          OpenAI GPT-4o
Prompts:     Sophia / Max + Knowledge Base dinámica
Automations: n8n (Docker local → producción cloud)
Integrations:
  ├── Google Calendar (agendamiento de visitas)
  ├── Notion (CRM de leads)
  └── Notificación a agente humano
Auth:        x-bot-secret header
Transport:   HTTP server puerto 3002
Session:     experimentalStore: true, timeRelease: 10800000
```

## 4.4 CRM Integrado

| Feature        | Descripción                        | Estado | Nota                                                                    |
| -------------- | ---------------------------------- | ------ | ----------------------------------------------------------------------- |
| Leads          | Captura, seguimiento, estado       | ✅     |                                                                         |
| Tasks          | Tareas asignadas a leads/afiliados | ✅     |                                                                         |
| Communications | Historial de contactos             | ✅     |                                                                         |
| Agendamiento   | Google Calendar sync (vía n8n)     | ⚠️     | `CalendarService` + `scheduleFlow` listos. Falta workflow n8n. Sprint 8 |
| Notion sync    | Leads exportados a Notion          | ⚠️     | `n8nService.triggerHumanHandoff` listo. Falta workflow n8n. Sprint 8    |

## 4.5 Sistema de Wallet y Pagos

| Feature                    | Descripción                               | Estado |
| -------------------------- | ----------------------------------------- | ------ |
| Wallet balance             | Balance en USD                            | ✅     |
| Comisiones automáticas     | Calculadas por cierre de servicio         | ✅     |
| Historial de transacciones | Completo con paginación                   | ✅     |
| Solicitud de retiro        | Manual con aprobación admin               | ✅     |
| PayPal                     | Disponible en Colombia, México, Argentina | ✅     |
| MercadoPago                | Optimizado para LATAM                     | ✅     |

## 4.6 Contratos de Afiliación Digitales

| Feature                  | Descripción                   | Estado |
| ------------------------ | ----------------------------- | ------ |
| Templates versionados    | Markdown, semver              | ✅     |
| Aceptación con IP + hash | SHA-256, timestamp, userAgent | ✅     |
| Registro legal           | Auditable y exportable        | ✅     |

## 4.7 Gamificación

### Leaderboards

| Tipo     | Reset       | Métricas              |
| -------- | ----------- | --------------------- |
| Semanal  | Lunes 00:00 | Ventas ($), Referidos |
| Mensual  | Día 1 00:00 | Ventas ($), Referidos |
| All-time | Nunca       | Ventas ($), Referidos |

### Achievements

| ID             | Nombre                | Condición             |
| -------------- | --------------------- | --------------------- |
| first_referral | Primer Paso           | 1 referido            |
| team_10        | Equipo en Crecimiento | 10 referidos          |
| team_50        | Líder                 | 50 referidos          |
| first_sale     | Primera Venta         | 1 cierre              |
| sales_1000     | Vendedor              | $1,000 en comisiones  |
| sales_10000    | Top Seller            | $10,000 en comisiones |
| consistency_30 | Constante             | 30 días de login      |

---

# 5. Tech Stack

## Backend

```
Runtime:    Node 24+ (ESM)
Framework:  Express 5
Database:   PostgreSQL + Redis
ORM:        Sequelize 6
Email:      Brevo (SMTP + API)
SMS:        Brevo SMS
Payments:   PayPal SDK + MercadoPago SDK
Testing:    Jest (307+ tests)
```

## Frontend

```
Framework:  React 19 + Vite
Styling:    Tailwind CSS 4 + shadcn/ui
State:      Zustand 5
Routing:    React Router 7
i18n:       i18next (ES + EN)
PWA:        Workbox
Testing:    Vitest + Playwright
```

## Nexo Bot

```
Runtime:    Node.js (CommonJS)
Bot:        BuilderBot + Baileys
AI:         OpenAI GPT-4o
Automation: n8n (Docker)
Port:       3002
```

---

# 6. API Endpoints

## Bot API (autenticado con x-bot-secret)

```
GET  /api/bot/user-by-phone    - Buscar usuario por teléfono
GET  /api/bot/wallet           - Info de wallet del usuario
GET  /api/bot/network          - Resumen de red MLM
GET  /api/bot/commissions      - Comisiones recientes
```

## Afiliados

```
GET  /api/network              - Red del afiliado
GET  /api/commissions          - Historial de comisiones
GET  /api/wallet               - Balance y transacciones
POST /api/withdrawals          - Solicitar retiro
```

## Contratos

```
GET  /api/contracts            - Listar contratos
POST /api/contracts/:id/accept - Aceptar contrato (graba IP/hash)
POST /api/contracts/:id/decline
```

## Pagos

```
POST /api/payment/paypal/create
POST /api/payment/paypal/capture
POST /api/payment/paypal/webhook
POST /api/payment/mercadopago/preference
POST /api/payment/mercadopago/webhook
```

## Admin

```
GET    /api/admin/users
PATCH  /api/admin/users/:id
GET    /api/admin/commissions
POST   /api/admin/commissions/pay
GET    /api/admin/vendors
PATCH  /api/admin/vendors/:id/commission-rate
```

---

# 7. Arquitectura Multi-Tenant (Fase 2)

## Planes de Servicio

| Plan        | Precio est. | WhatsApp                            | Knowledge Base        | Soporte   |
| ----------- | ----------- | ----------------------------------- | --------------------- | --------- |
| Free / Demo | $0          | Número compartido Nexo Real         | KB genérica Nexo Real | Community |
| Starter     | $29–49/mes  | Número propio (API key del cliente) | KB personalizada      | Email     |
| Managed     | $99–199/mes | Número propio + gestión Nexo Real   | KB full personalizada | Dedicado  |
| Enterprise  | Custom      | Full white-label                    | Multi-KB              | SLA       |

## Arquitectura del Bot Multi-Tenant (Fase 2)

```
               ┌─────────────────────────────────┐
               │         Nexo Real Core           │
               │   (Orchestrator + KB Manager)   │
               └───────┬─────────────┬───────────┘
                       │             │
           ┌───────────▼──┐   ┌──────▼──────────┐
           │  Agencia A   │   │   Hostería B     │
           │  (WA #001)   │   │   (WA #002)      │
           │  KB: Inmob.  │   │   KB: Turismo    │
           └──────────────┘   └─────────────────┘
```

---

# 8. Roadmap

## Fase 1 — Demo MVP (NOW → Mayo 2026)

```
✅ SPRINT 1 (Completado): Monetización — v1.9.0
✅ SPRINT 2 (Completado): E-Commerce + Automation — v1.10.0
✅ SPRINT 3 (Completado): Multi-vendor + Delivery + Security — v1.11.0
✅ SPRINT 4 (Completado): QA + Release + Nexo Bot MVP — v2.0.0
   ├── Test Coverage 90%+
   ├── Nexo Bot: OpenAI integration + Sophia/Max
   ├── Nexo Bot: Language detection ES/EN
   ├── Nexo Bot: Gender detection → agent assignment
   ├── n8n: Google Calendar integration
   ├── n8n: Notion CRM integration
   └── First bot startup + WhatsApp pairing
✅ SPRINT 5 (Completado): Real Estate Frontend, Tourism Frontend, Reservation Wizard — v2.1.0
   ├── Real Estate Frontend (properties listing + detail)
   ├── Tourism Frontend (tours listing + detail)
   ├── Reservation Wizard (multi-step booking flow)
   └── Security fixes (CodeQL CWE-843, Dependabot file-type)
✅ SPRINT 6 (Completado): Admin Dashboard CRUD, Bot Flows, SEO Frontend — v2.2.0
   ├── Admin Dashboard CRUD (AdminPropertiesPage, AdminToursPage, AdminReservationsPage)
   ├── Nexo Bot Flows: propertiesFlow + toursFlow (ES/EN, BuilderBot, limit 5)
   ├── SEO Frontend: react-helmet-async + JSON-LD + social proof badges
   ├── network_balance: migración de binary_balance completada
   ├── Build Hardening: producción sin .map, logs de tamaño
   ├── i18n cleanup: claves huérfanas eliminadas
   └── CodeQL #39 #40: req.files cast normalizado (CWE-843)
```

## Fase 2 — Multi-Tenant (1–2 meses post v2.0.0)

```
□ Multi-tenant architecture
□ Tenant onboarding flow
□ Per-tenant Knowledge Base management
□ Per-tenant WhatsApp number (customer API key)
□ Tenant admin dashboard
□ Billing & subscription management
```

## Fase 3 — Full Contact Center SaaS (3–6 meses)

```
□ Self-service onboarding
□ White-label bot
□ Advanced analytics per tenant
□ Multi-channel (Instagram DM, Messenger)
□ Proactive campaigns via WhatsApp
□ Full SLA tiers
```

---

# 9. Success Metrics

| KPI                       | Target        | Actual |
| ------------------------- | ------------- | ------ |
| Test Coverage             | >= 90%        | ~70%   |
| Tests Totales             | ~550          | 967    |
| API Response Time         | < 200ms (p95) | TBD    |
| System Uptime             | >= 99.5%      | TBD    |
| Payment Success Rate      | >= 95%        | N/A    |
| Bot Response Time         | < 3s          | TBD    |
| Bot Escalation Rate       | < 30%         | TBD    |
| Lead Capture Rate via Bot | >= 60%        | TBD    |

---

# 10. Risks & Mitigations

| Risk                                  | Probability | Impact   | Mitigation                                                       |
| ------------------------------------- | ----------- | -------- | ---------------------------------------------------------------- |
| Bot hallucina y genera desinformación | Medium      | Critical | Prompts estrictos, KB única fuente de verdad, escalación forzada |
| WhatsApp ban por uso de Baileys       | Medium      | High     | Números dedicados, comportamiento natural, no spam               |
| Comisiones calculadas incorrectamente | Low         | Critical | 100% test coverage en módulo MLM                                 |
| Regulación inmobiliaria por país      | Medium      | High     | Contratos digitales + KYC futuro + asesoría legal local          |
| Cliente piloto rechaza el producto    | Medium      | High     | Demo funcional antes de pitch, escuchar necesidades reales       |

---

# 11. Document History

| Version | Date       | Author         | Changes                                                                                                                                                                                                                                                                          |
| ------- | ---------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.4.0   | 2026-04-10 | Nexo Real Team | Sprint 8 RBAC completo: 9 roles (super_admin, admin, finance, sales, advisor, vendor, user, guest, bot), endpoints register/guest y updateUserRole. Seed Nexo Real colombiano (Unilevel). Tests 967.                                                                             |
| 2.0.0   | 2026-04-05 | Nexo Real Team | Reescritura completa. Proyecto renombrado de `mlm-platform` a **Nexo Real**. Foco en servicios inmobiliarios + turismo/hospitalidad. Nexo Bot documentado. Modelo MLM definido como Unilevel con bonos. Eliminado: streaming, delivery DiDi/Uber, productos genéricos como foco. |
| 1.8.0   | 2026-04-03 | MLM Team       | Multi-vendor + delivery scope                                                                                                                                                                                                                                                    |
| 1.3.0   | 2026-03-30 | MLM Team       | MVP streaming e-commerce                                                                                                                                                                                                                                                         |
| 1.0.0   | 2026-03-21 | MLM Team       | Initial PRD                                                                                                                                                                                                                                                                      |

---

**Approval**

| Role          | Name | Date |
| ------------- | ---- | ---- |
| Product Owner | TBD  | —    |
| Tech Lead     | TBD  | —    |

---

_This PRD is a living document. Update as the project evolves._  
_Nexo Real — "Conectamos tu negocio con el mundo."_

---

## Sprint Status

| Sprint     | Versión | Descripción                                                                                                          | Estado         | Fecha      |
| ---------- | ------- | -------------------------------------------------------------------------------------------------------------------- | -------------- | ---------- |
| Sprint 1-3 | v1.11.0 | Auth, MLM, CRM, E-commerce, Security, Marketplace                                                                    | ✅ Completado  | 2026-04-04 |
| Sprint 4   | v2.0.0  | Nexo Bot WhatsApp, n8n Automation, Gamificación                                                                      | ✅ Completado  | 2026-04-06 |
| Sprint 5   | v2.1.0  | Real Estate Frontend, Tourism Frontend, Reservation Wizard                                                           | ✅ Completado  | 2026-04-07 |
| Sprint 6   | v2.2.0  | Admin Dashboard CRUD, Nexo Bot Flows (properties+tours), SEO Frontend, Build Hardening, i18n cleanup, CodeQL fixes   | ✅ Completado  | 2026-04-07 |
| Sprint 7   | v2.3.5  | UI/UX Rebranding completo (landing Nexo Real, auth skin, AppLayout), Vitest 90%+ coverage, E2E Playwright, PWA       | ✅ Completado  | 2026-04-09 |
| Sprint 8   | v2.4.0  | RBAC 9 roles + endpoints register/guest y updateUserRole + Seed Nexo Real colombiano (Unilevel)                      | ✅ Completado  | 2026-04-10 |
| Sprint 9   | v3.0.0  | Bot Completo: flows de ventas, onboarding, gestión de reservas, WhatsApp Business API                                | 📋 Planificado | —          |
| Sprint 8   | v2.4.0  | Bot completo: Knowledge Base FAQ, n8n workflows (Calendar+Notion), captación leads, onboarding afiliados, objeciones | 📋 Planificado | —          |
