# Product Requirements Document (PRD)

## MLM Platform - SaaS Binary Affiliation System

**Version**: 1.0  
**Status**: ✅ MVP COMPLETED  
**Last Updated**: 2026-03-29  
**Document Owner**: MLM Development Team

---

# 1. Executive Summary / Resumen Ejecutivo

## Problem Statement / Declaración del Problema

Las empresas MLM tradicionales enfrentan desafíos críticos: sistemas obsoletos con tecnología de hace décadas, comisiones manuales propensas a errores, árbol genealógico opaco para los distribuidores, y plataformas que no escalan con el crecimiento de la red. Los distribuidores necesitan transparencia en tiempo real sobre sus comisiones y estructura de red.

Traditional MLM companies face critical challenges: outdated systems with decades-old technology, error-prone manual commissions, opaque genealogy trees for distributors, and platforms that don't scale with network growth. Distributors need real-time transparency on their commissions and network structure.

## Proposed Solution / Solución Propuesta

Plataforma SaaS de afiliaciones binarias con distribución automática de comisiones, visualización del árbol genealógico en tiempo real, dashboard con métricas de rendimiento, panel administrativo completo, y CRM integrado para gestión de leads. Construida sobre arquitectura moderna (Node.js + React) con 195 tests automatizados garantizando estabilidad.

> **Status**: MVP COMPLETED ✅ (v1.3.0)

Generic SaaS binary affiliation platform with automatic commission distribution, real-time genealogy tree visualization, performance metrics dashboard, complete admin panel, and integrated CRM for lead management. Built on modern architecture (Node.js + React) with 195 automated tests ensuring stability.

## Success Criteria / Criterios de Éxito

| KPI                                                                  | Target        | Measurement                                     |
| -------------------------------------------------------------------- | ------------- | ----------------------------------------------- |
| User Retention Rate / Tasa de Retención de Usuarios                  | >= 85%        | Monthly active users / Monthly registered users |
| Commission Calculation Accuracy / Precisión de Cálculo de Comisiones | 100%          | Automated test suite validation                 |
| System Uptime / Disponibilidad del Sistema                           | >= 99.5%      | Monthly SLA monitoring                          |
| API Response Time / Tiempo de Respuesta API                          | < 200ms (p95) | APM metrics                                     |
| Test Coverage / Cobertura de Tests                                   | >= 80%        | Code coverage reports                           |

---

# 2. User Experience & Functionality / Experiencia de Usuario y Funcionalidad

## User Personas / Personas de Usuario

### 1. Distributor (B2C) / Distribuidor

**Profile / Perfil**:

- Age: 25-55
- Tech Savviness: Medium
- Primary Goal: Grow their network and track earnings / Crecer su red y seguir sus ganancias

**Needs / Necesidades**:

- Onboarding rápido con código de afiliado único
- Visualización clara del árbol binario
- Acceso móvil a comisiones y estadísticas
- Notificaciones de nuevas comisiones

### 2. Corporate Admin (B2B) / Administrador Corporativo

**Profile / Perfil**:

- Role: Operations Manager / IT Manager
- Primary Goal: Platform management and user support / Gestión de plataforma y soporte a usuarios

**Needs / Necesidades**:

- Panel de control completo con métricas globales
- Gestión de usuarios (status, roles, bans)
- Reportes de comisiones y volumen
- Herramientas de CRM para leads

### 3. System Administrator / Administrador del Sistema

**Profile / Perfil**:

- Role: DevOps / Backend Developer
- Primary Goal: Platform stability and scalability / Estabilidad y escalabilidad de la plataforma

**Needs / Necesidades**:

- Logs centralizados
- Métricas de rendimiento
- Backup automatizado
- CI/CD pipeline

---

## User Stories / Historias de Usuario

### Authentication / Autenticación

| Story  | As a...       | I want...                        | So that...                               |
| ------ | ------------- | -------------------------------- | ---------------------------------------- |
| US-001 | New user      | Register with email and password | I can join the platform                  |
| US-002 | New user      | Enter a sponsor code             | I can join under an existing distributor |
| US-003 | Existing user | Login with credentials           | I can access my dashboard                |
| US-004 | Existing user | Receive a unique referral code   | I can invite others to join my network   |
| US-005 | Existing user | Generate my QR code              | Others can scan and register under me    |

**Acceptance Criteria / Criterios de Aceptación**:

- [ ] Registration requires valid email format (RFC 5322)
- [ ] Password must be minimum 8 chars, 1 uppercase, 1 number, 1 special character
- [ ] Sponsor code validation returns 400 with `INVALID_REFERRAL_CODE` error if not found
- [ ] JWT token expires after 7 days
- [ ] QR code contains referral link with embedded sponsor code

### Binary Tree / Árbol Binario

| Story  | As a...     | I want...                      | So that...                        |
| ------ | ----------- | ------------------------------ | --------------------------------- |
| US-010 | Distributor | View my binary tree structure  | I can see my network organization |
| US-011 | Distributor | See left/right leg counts      | I can track my business volume    |
| US-012 | Distributor | View specific user's tree      | I can help my downline            |
| US-013 | System      | Auto-balance new registrations | Tree remains balanced             |

**Acceptance Criteria**:

- [ ] Tree endpoint returns complete structure with max 3 levels by default
- [ ] `leftCount` and `rightCount` update within 100ms of new registration
- [ ] Tree visualization renders in < 500ms for trees with < 1000 nodes
- [ ] Closure table maintains accurate ancestor-descendant relationships

### Commission System / Sistema de Comisiones

| Story  | As a...     | I want...                              | So that...                          |
| ------ | ----------- | -------------------------------------- | ----------------------------------- |
| US-020 | Distributor | See my commission history              | I can track my earnings             |
| US-021 | Distributor | View commission by type                | I understand my income sources      |
| US-022 | Distributor | Get statistics (total earned, pending) | I can plan my business              |
| US-023 | System      | Auto-calculate commissions on purchase | Distributors get paid automatically |

**Acceptance Criteria**:

- [ ] Commission types: direct (10%), level_1 (5%), level_2 (3%), level_3 (2%), level_4 (1%)
- [ ] Commission calculation completes within 500ms of purchase
- [ ] Commission history supports pagination (default: 10 items)
- [ ] Commission statistics update in real-time

### Admin Panel / Panel de Administración

| Story  | As a... | I want...                                      | So that...                          |
| ------ | ------- | ---------------------------------------------- | ----------------------------------- |
| US-030 | Admin   | View global platform statistics                | I can monitor business health       |
| US-031 | Admin   | List all users with filters                    | I can manage the platform           |
| US-032 | Admin   | Update user status (active/inactive/suspended) | I can enforce platform rules        |
| US-033 | Admin   | Promote user to admin role                     | I can delegate management           |
| US-034 | Admin   | View commission reports                        | I can audit commission distribution |

**Acceptance Criteria**:

- [ ] Admin endpoints require `role: "admin"` in JWT
- [ ] User status update reflects immediately in auth checks
- [ ] Commission report supports date range filtering
- [ ] Pagination supports page and limit parameters (max 100)

### CRM Module / Módulo CRM

| Story  | As a... | I want...               | So that...                      |
| ------ | ------- | ----------------------- | ------------------------------- |
| US-040 | Admin   | Create and manage leads | I can track potential customers |
| US-041 | Admin   | Assign tasks to leads   | I can organize follow-ups       |
| US-042 | Admin   | Log communications      | I can maintain contact history  |
| US-043 | Admin   | View CRM statistics     | I can measure sales pipeline    |

**Acceptance Criteria**:

- [ ] Lead creation requires contactName and contactEmail (valid format)
- [ ] Task due dates support scheduling
- [ ] Communication types: call, email, meeting, note
- [ ] Lead status workflow: new → contacted → qualified → proposal → negotiation → won/lost

---

## Non-Goals / Objetivos No Incluidos

The following are explicitly **NOT** part of this PRD:

| Feature                            | Reason / Razón                                                         |
| ---------------------------------- | ---------------------------------------------------------------------- |
| Payment processing (Stripe/PayPal) | MVP focuses on commission calculation; payment distribution is phase 2 |
| Mobile app                         | Web responsive design is MVP scope; native apps are phase 2            |
| Multi-language (i18n)              | English/Spanish documentation; UI defaults to Spanish                  |
| Gamification                       | Deferred to enhance retention after MVP metrics established            |
| Push notifications                 | Email notifications MVP scope; push is phase 2                         |
| WhatsApp/Telegram integration      | Deferred; depends on payment MVP success                               |
| Advanced analytics                 | Basic dashboard metrics MVP scope; advanced BI is phase 2              |
| White-label customization          | Deferred to enterprise tier                                            |

---

# 3. Technical Specifications / Especificaciones Técnicas

## Architecture Overview / Visión General de Arquitectura

```map
┌─────────────────────────────────────────────────────────────┐
│                     MLM SAAS PLATFORM                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐     ┌──────────────────┐              │
│  │   FRONTEND        │     │   MOBILE (v2)    │              │
│  │   React 19        │────▶│   React Native    │              │
│  │   Tailwind CSS    │     │   (Future)       │              │
│  │   Vite 8          │     └──────────────────┘              │
│  └────────┬──────────┘                                       │
│           │ REST API                                          │
│           ▼                                                   │
│  ┌──────────────────────────────────────────────────────┐    │
│  │                    BACKEND API                          │    │
│  │                                                       │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌────────┐ │    │
│  │  │  Auth   │  │  Users  │  │  Comm   │  │  CRM   │ │    │
│  │  │ Route   │  │ Route   │  │ Route   │  │ Route  │ │    │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └───┬────┘ │    │
│  │       │            │            │           │       │    │
│  │       ▼            ▼            ▼           ▼       │    │
│  │  ┌─────────────────────────────────────────────┐  │    │
│  │  │           SERVICE LAYER                       │  │    │
│  │  │  AuthService │ UserService │ CommissionSvc  │  │    │
│  │  │  TreeService │ CRMService  │ QRService     │  │    │
│  │  └─────────────────────────────────────────────┘  │    │
│  │                         │                           │    │
│  │                         ▼                           │    │
│  │  ┌─────────────────────────────────────────────┐  │    │
│  │  │           DATA LAYER                         │  │    │
│  │  │  User │ Commission │ Purchase │ Lead │ Task │  │    │
│  │  └─────────────────────────────────────────────┘  │    │
│  └──────────────────────────────────────────────────────┘    │
│                          │                                    │
│                          ▼                                    │
│  ┌─────────────────────────────────────────────┐            │
│  │              DATABASE CLUSTER                   │            │
│  │     MySQL 8.0 (Primary) + Redis (Cache)       │            │
│  └─────────────────────────────────────────────┘            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

### Current (MVP) / Actual (MVP)

| Component     | Technology       | Version |
| ------------- | ---------------- | ------- |
| Runtime       | Node.js          | 18+     |
| API Framework | Express.js       | 4.x     |
| Language      | TypeScript       | 5.x     |
| ORM           | Sequelize        | 6.x     |
| Database      | MySQL            | 8.0     |
| Cache         | Redis            | 7+      |
| Frontend      | React            | 19      |
| Build Tool    | Vite             | 8.x     |
| Styling       | Tailwind CSS     | 4.x     |
| Testing       | Jest + Supertest | -       |
| E2E Testing   | Playwright       | 1.58+   |

### Future (v2.0) / Futuro (v2.0)

| Component     | Technology               |
| ------------- | ------------------------ |
| Mobile        | React Native / Expo      |
| Payments      | Stripe Connect           |
| Notifications | Firebase Cloud Messaging |
| Analytics     | Metabase / Grafana       |
| Monitoring    | Datadog / Sentry         |

---

## Database Schema / Esquema de Base de Datos

### Core Tables / Tablas Principales

```map
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│      USER        │────▶│    PURCHASE      │◀────│   COMMISSION     │
├──────────────────┤     ├──────────────────┤     ├──────────────────┤
│ id (PK)          │     │ id (PK)          │     │ id (PK)          │
│ email            │     │ userId (FK)      │     │ userId (FK)      │
│ passwordHash     │     │ amount           │     │ fromUserId (FK)  │
│ referralCode     │     │ currency         │     │ purchaseId (FK)  │
│ sponsorId (FK)   │     │ status           │     │ type             │
│ position         │     └──────────────────┘     │ amount           │
│ level            │                             │ status           │
│ status           │                             └──────────────────┘
│ role             │
│ currency         │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  USER_CLOSURE    │ (Binary Tree Materialized Path)
├──────────────────┤
│ ancestorId (PK)  │
│ descendantId (PK) │
│ depth             │
└──────────────────┘

┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│       LEAD       │────▶│      TASK       │     │  COMMUNICATION   │
├──────────────────┤     ├──────────────────┤     ├──────────────────┤
│ id (PK)          │     │ id (PK)          │     │ id (PK)          │
│ userId (FK)      │     │ leadId (FK)      │     │ leadId (FK)      │
│ contactName       │     │ userId (FK)      │     │ userId (FK)      │
│ contactEmail      │     │ title            │     │ type             │
│ contactPhone      │     │ dueDate          │     │ subject          │
│ company           │     │ priority         │     │ notes            │
│ status            │     │ status           │     └──────────────────┘
│ source            │     └──────────────────┘
│ value             │
│ metadata (JSON)   │
└──────────────────┘
```

### Indexes / Índices

| Table        | Index                             | Purpose         |
| ------------ | --------------------------------- | --------------- |
| users        | `email` (UNIQUE)                  | Login lookup    |
| users        | `referralCode` (UNIQUE)           | Sponsor lookup  |
| users        | `sponsorId`                       | Tree queries    |
| user_closure | `(ancestorId, descendantId)` (PK) | Closure queries |
| commissions  | `userId, createdAt`               | User history    |
| leads        | `userId, status`                  | CRM filters     |

---

## API Reference / Referencia de API

### Base URL

```text
Production: https://api.mlm-platform.com/api
Staging: https://staging-api.mlm-platform.com/api
Development: http://localhost:3000/api
```

### Authentication / Autenticación

All protected endpoints require:

```text
Authorization: Bearer <jwt_token>
```

### Endpoints Matrix / Matriz de Endpoints

| Method | Endpoint                 | Auth | Role  | Description           |
| ------ | ------------------------ | ---- | ----- | --------------------- |
| POST   | /auth/register           | No   | -     | User registration     |
| POST   | /auth/login              | No   | -     | User login            |
| GET    | /auth/me                 | Yes  | user  | Current user profile  |
| GET    | /users/me/tree           | Yes  | user  | User's binary tree    |
| GET    | /users/me/qr-url         | Yes  | user  | QR code data URL      |
| GET    | /dashboard               | Yes  | user  | Dashboard statistics  |
| GET    | /commissions             | Yes  | user  | Commission history    |
| GET    | /commissions/stats       | Yes  | user  | Commission statistics |
| POST   | /commissions             | Yes  | user  | Create purchase       |
| GET    | /admin/stats             | Yes  | admin | Global statistics     |
| GET    | /admin/users             | Yes  | admin | List all users        |
| PATCH  | /admin/users/:id/status  | Yes  | admin | Update user status    |
| PATCH  | /admin/users/:id/promote | Yes  | admin | Promote to admin      |
| GET    | /crm                     | Yes  | admin | List leads            |
| POST   | /crm                     | Yes  | admin | Create lead           |
| POST   | /crm/:id/tasks           | Yes  | admin | Create task           |

### Response Format / Formato de Respuesta

**Success / Éxito**:

```json
{
  "success": true,
  "data": { ... },
  "pagination": { "page": 1, "limit": 10, "totalPages": 5 }
}
```

**Error / Error**:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { ... }
  }
}
```

### Error Codes / Códigos de Error

| Code                  | HTTP | Description                   |
| --------------------- | ---- | ----------------------------- |
| UNAUTHORIZED          | 401  | Missing or invalid token      |
| FORBIDDEN             | 403  | Insufficient permissions      |
| NOT_FOUND             | 404  | Resource not found            |
| INVALID_EMAIL         | 400  | Invalid email format          |
| EMAIL_EXISTS          | 400  | Email already registered      |
| INVALID_REFERRAL_CODE | 400  | Sponsor code not found        |
| INVALID_CREDENTIALS   | 401  | Wrong email or password       |
| WEAK_PASSWORD         | 400  | Password requirements not met |
| RATE_LIMIT            | 429  | Too many requests             |

---

## Security & Privacy / Seguridad y Privacidad

### Authentication / Autenticación

- JWT tokens with 7-day expiry
- Password hashing: bcrypt (12 rounds)
- Rate limiting: 5 requests/15min per IP on auth endpoints

### Data Protection / Protección de Datos

- All passwords stored as bcrypt hashes (never plaintext)
- JWT tokens are stateless; Redis used for session invalidation
- API responses never expose passwordHash

### Compliance / Cumplimiento

- GDPR: User data export capability (future phase)
- Data retention policy: 7 years for financial records
- SSL/TLS required for all API communication

---

# 4. Integration Points / Puntos de Integración

## Third-Party Services / Servicios de Terceros

| Service               | Purpose              | Status  |
| --------------------- | -------------------- | ------- |
| Twilio (SMS)          | 2FA notifications    | Planned |
| SendGrid (Email)      | Transactional emails | Planned |
| Stripe Connect        | Commission payouts   | v2.0    |
| WhatsApp Business API | CRM integration      | v2.0    |
| Firebase              | Push notifications   | v2.0    |

## Internal Systems / Sistemas Internos

| System          | Integration      | Method                |
| --------------- | ---------------- | --------------------- |
| Admin Dashboard | Real-time stats  | REST API              |
| CRM Module      | Lead management  | Internal service      |
| Reporting       | Commission audit | Database read replica |

---

# 5. Risks & Roadmap / Riesgos y Hoja de Ruta

## Technical Risks / Riesgos Técnicos

| Risk                                  | Probability | Impact   | Mitigation                              |
| ------------------------------------- | ----------- | -------- | --------------------------------------- |
| Commission calculation errors         | Low         | Critical | 100% test coverage on CommissionService |
| Database connection exhaustion        | Medium      | High     | Connection pooling + Redis caching      |
| Tree performance degradation at scale | Medium      | Medium   | Closure table + pagination              |
| Security vulnerabilities              | Low         | Critical | OWASP guidelines + security audit       |
| Rate limiting false positives         | Medium      | Low      | Graceful degradation + monitoring       |

## Non-Technical Risks / Riesgos No Técnicos

| Risk                          | Probability | Impact | Mitigation                      |
| ----------------------------- | ----------- | ------ | ------------------------------- |
| Competitor price undercutting | Medium      | Medium | Focus on UX + reliability       |
| Regulatory changes (MLM laws) | Low         | High   | Legal review + geo-restrictions |
| Payment processor rejection   | Medium      | High   | Multi-processor strategy        |

---

## Phased Rollout / Implementación por Fases

### Phase 1: MVP ✅ COMPLETED

**Scope / Alcance**:

- ✅ User registration with sponsor codes
- ✅ Binary tree with left/right placement (API)
- ✅ Commission calculation (5 levels) - CONFIGURABLE
- ✅ Dashboard with statistics
- ✅ Admin panel (user management)
- ✅ CRM basic (leads, tasks, communications)
- ✅ QR code generation
- ✅ JWT authentication
- ✅ Integration test suite (195 tests)
- ✅ E2E test suite (37 tests)

**Timeline**: Q1 2026  
**Status**: **COMPLETE ✅**

---

### Phase 2: v1.1 - Email & SMS Notifications ❌ NOT PLANNED

**Scope / Alcance**:

- [ ] ~~Email notifications (new commissions, downline activity, welcome, password reset)~~
- [ ] ~~Email templates (5 responsive HTML templates)~~
- [ ] ~~SMS 2FA via Twilio~~
- [ ] ~~User notification preferences API~~
- [ ] ~~Weekly digest cron job~~

**Status**: ❌ NOT PLANNED for v1.x

> **Rationale**: Email/SMS notifications were moved out of scope for v1.x. May be revisited in future versions.

---

### Phase 3: v1.2 - Visual Tree UI ✅ COMPLETED

**Scope / Alcance**:

- [x] Interactive binary tree visualization component (React Flow)
- [x] Tree node rendering with user info (avatar, name, status)
- [x] Zoom in/out controls
- [x] Pan/scroll navigation
- [x] Search member by name/email
- [x] Click node to view user details
- [x] Tree depth controls (levels to display)
- [x] Mobile responsive tree view

**Dependencies**: D3.js or React Flow library (React Flow selected)  
**Timeline**: Q2 2026 ✅ Completed March 2026

**Implementation Details**:

- React Flow for interactive tree visualization
- Zustand for state management
- Mobile-first responsive design
- 13 E2E tests passing
- 158 backend integration tests passing

---

### Phase 4: v1.3 - E-commerce 🛒 ✅ PARTIAL

**Scope / Alcance**:

- [x] Product catalog management
- [x] Product CRUD (admin)
- [x] Product categories
- [x] ~~Shopping cart~~ - One-click purchase implemented
- [x] Order management
- [x] Order status tracking
- [x] Product images and pricing
- [x] ~~Inventory management~~ - Not required for streaming products

**Status**: ✅ PARTIAL - Streaming e-commerce completed

> **Implemented**: Products (Netflix, Spotify, HBO, Disney+, Amazon Prime), subscriptions, orders, streaming access
> **Not implemented**: Full e-commerce with inventory, physical products

---

### Phase 5: v2.0 - Payments & E-Wallet 💰 ✅ PARTIAL

**Scope / Alcance**:

- [ ] ~~Stripe Connect integration for commission payouts~~
- [ ] ~~PayPal integration for deposits~~
- [x] E-wallet system
- [x] Withdrawal requests
- [x] Payment history
- [x] Currency conversion (Frankfurter API)
- [ ] ~~Audit logs~~
- [ ] ~~Multi-currency support (COP, MXN, USD)~~ - Single currency with conversion rates

**Status**: ✅ PARTIAL - Wallet implemented, gateways pending

> **Implemented**: Wallet balance, deposits, withdrawals (5% fee, $20 min), transaction history, currency conversion API
> **Not implemented**: Stripe/PayPal integration, audit logs

---

### Phase 6: v2.1 - Mobile & Scale ❌ NOT PLANNED

**Scope / Alcance**:

- [ ] ~~React Native mobile app~~
- [ ] ~~Push notifications (Firebase)~~
- [x] Multi-language (Spanish, English) - i18n implemented
- [ ] ~~Gamification (achievements, leaderboards)~~
- [ ] ~~Advanced analytics dashboard~~ - Basic analytics implemented in CRM

**Status**: ❌ NOT PLANNED for v1.x

> **Rationale**: Mobile app, push notifications, and gamification moved out of scope. Bilingual i18n (ES/EN) implemented.

---

### Phase 7: Enterprise

**Scope / Alcance**:

- [ ] White-label capabilities
- [ ] Custom commission structures (Unilevel, Matrix)
- [ ] SSO (SAML, OAuth)
- [ ] Advanced permissions (teams, departments)
- [ ] API webhooks
- [ ] Custom domain support
- [ ] Dedicated support tier
- [ ] WhatsApp/Telegram bot
- [ ] KYC/Identity verification
- [ ] 2FA authentication

**Status**: Future roadmap (2027+)

> **Pending**: All enterprise features including KYC, 2FA, custom commission structures

---

# 6. Testing Strategy / Estrategia de Testing

## Test Coverage Requirements / Requisitos de Cobertura

| Layer       | Minimum Coverage    | Tool             |
| ----------- | ------------------- | ---------------- |
| Services    | 90%                 | Jest             |
| Controllers | 80%                 | Jest + Supertest |
| Models      | 85%                 | Jest             |
| E2E Flows   | 100% critical paths | Playwright       |

## Critical Test Paths / Caminos Críticos de Test

```text
1. Registration → Login → Dashboard → Tree View
2. Registration with Sponsor → Commission Earned → Commission History
3. Admin Login → User Status Change → User Login Blocked
4. CRM: Create Lead → Create Task → Complete Task
```

## Test Execution / Ejecución de Tests

```bash
# CI/CD Pipeline
pnpm test              # Unit tests (must pass)
pnpm test:integration  # Integration tests (must pass)
pnpm test:e2e          # E2E tests (must pass)
pnpm test:coverage     # Generate coverage report
```

---

# 7. Appendix / Apéndice

## Glossary / Glosario

| Term          | Definition                                       |
| ------------- | ------------------------------------------------ |
| Sponsor       | User who invites another to join the platform    |
| Referral Code | Unique code for identifying sponsors             |
| Binary Tree   | Network structure with left/right placement      |
| Closure Table | Database pattern for efficient tree queries      |
| Commission    | Payment to distributor based on network activity |
| Upline        | All ancestors in the binary tree                 |
| Downline      | All descendants in the binary tree               |
| Leg           | Left or right branch of the binary tree          |

## References / Referencias

- [Sequelize Documentation](https://sequelize.org/)
- [JWT Best Practices](https://jwt.io/introduction/)
- [OWASP API Security](https://owasp.org/www-project-api-security/)
- [MLM Regulatory Guidelines](https://www.ftc.gov/tips-advice/business-center/guidance/multilevel-marketing)

## Document History / Historial del Documento

| Version | Date       | Author   | Changes           |
| ------- | ---------- | -------- | ----------------- |
| 1.0     | 2026-03-21 | MLM Team | Initial PRD draft |

---

**Approval / Aprobación**

| Role          | Name | Date | Signature |
| ------------- | ---- | ---- | --------- |
| Product Owner | TBD  | -    |           |
| Tech Lead     | TBD  | -    |           |
| QA Lead       | TBD  | -    |           |

---

_This PRD is a living document. Update status and scope as the project evolves._
