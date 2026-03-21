# Arquitectura del Sistema / System Architecture

## Español

### Visión General

La plataforma MLM está construida con una arquitectura de API RESTful, separando claramente el backend (Node.js + Express + TypeScript + Sequelize + MySQL) del frontend (React + Vite + TypeScript + Tailwind CSS).

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTE / CLIENT                       │
│                                                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                  FRONTEND (React)                    │   │
│   │   - Vite Build System                               │   │
│   │   - Tailwind CSS (Styling)                          │   │
│   │   - React Router (Navigation)                       │   │
│   │   - Axios (HTTP Client)                            │   │
│   └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        SERVIDOR / SERVER                      │
│                                                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                  BACKEND (Node.js)                    │   │
│   │                                                       │   │
│   │   Routes → Controllers → Services → Models          │   │
│   │                                                       │   │
│   │   ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │   │
│   │   │ Controllers │  │  Services   │  │  Models   │  │   │
│   │   │  (HTTP)     │  │  (Logic)    │  │   (DB)    │  │   │
│   │   └─────────────┘  └─────────────┘  └───────────┘  │   │
│   │                                                       │   │
│   └─────────────────────────────────────────────────────┘   │
│                              │                               │
│                              ▼                               │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                    DATABASE                           │   │
│   │              MySQL 8.0 + Sequelize ORM                 │   │
│   └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Estructura de Capas / Layer Structure

```
backend/src/
├── config/              # Configuración / Configuration
│   ├── database.ts      # Conexión DB / DB Connection
│   ├── env.ts           # Variables de entorno / Environment
│   └── swagger.ts       # Documentación API / API Docs
├── controllers/        # Controladores / Controllers
│   ├── AuthController.ts
│   ├── UserController.ts
│   ├── CommissionController.ts
│   ├── AdminController.ts
│   └── CRMController.ts
├── services/           # Lógica de negocio / Business Logic
│   ├── AuthService.ts
│   ├── UserService.ts
│   ├── TreeService.ts
│   ├── CommissionService.ts
│   └── CRMService.ts
├── models/             # Modelos Sequelize / Sequelize Models
│   ├── User.ts
│   ├── Commission.ts
│   ├── Purchase.ts
│   ├── Lead.ts
│   └── Task.ts
├── routes/             # Definiciones de rutas / Route Definitions
├── middleware/         # Middleware (auth, errors, validation)
└── utils/             # Utilidades / Utilities
```

---

## English

### Overview

The MLM platform is built with a RESTful API architecture, clearly separating the backend (Node.js + Express + TypeScript + Sequelize + MySQL) from the frontend (React + Vite + TypeScript + Tailwind CSS).

### Layer Structure

```
backend/src/
├── config/              # Configuration
│   ├── database.ts       # DB Connection
│   ├── env.ts            # Environment variables
│   └── swagger.ts        # API Documentation
├── controllers/         # HTTP Request Handlers
│   ├── AuthController.ts
│   ├── UserController.ts
│   ├── CommissionController.ts
│   ├── AdminController.ts
│   └── CRMController.ts
├── services/            # Business Logic
│   ├── AuthService.ts
│   ├── UserService.ts
│   ├── TreeService.ts
│   ├── CommissionService.ts
│   └── CRMService.ts
├── models/             # Sequelize Models
│   ├── User.ts
│   ├── Commission.ts
│   ├── Purchase.ts
│   ├── Lead.ts
│   └── Task.ts
├── routes/             # Route Definitions
├── middleware/         # Middleware (auth, errors, validation)
└── utils/              # Utilities
```

### Database Schema / Esquema de Base de Datos

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │────▶│   Purchase  │◀────│  Commission │
└─────────────┘     └─────────────┘     └─────────────┘
       │                                        ▲
       │                                        │
       ▼                                        │
┌─────────────┐                                  │
│ UserClosure │ (Binary Tree Structure)          │
└─────────────┘                                  │
       │                                         │
       ▼                                         │
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    Lead     │────▶│    Task     │     │Communication│
└─────────────┘     └─────────────┘     └─────────────┘
```

### Commission Distribution / Distribución de Comisiones

| Level/Nivel    | Percentage/Porcentaje | Description/Descripción |
| -------------- | --------------------- | ----------------------- |
| Direct/Directo | 10%                   | Sponsor immediately     |
| Level 1        | 5%                    | Direct referrals        |
| Level 2        | 3%                    | Second level            |
| Level 3        | 2%                    | Third level             |
| Level 4        | 1%                    | Fourth level            |

### Security / Seguridad

- JWT Authentication (tokens with 7-day expiry)
- Password hashing with bcrypt (12 rounds)
- Rate limiting on auth endpoints (5 requests/15min in production)
- CORS validation with allowed origins
- Helmet security headers
- Input validation with express-validator

---

## Testing Architecture / Arquitectura de Testing

```
┌─────────────────────────────────────────────────────┐
│                    TESTING LAYERS                    │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌───────────────────────────────────────────────┐  │
│  │  E2E TESTS (Playwright)                       │  │
│  │  - Full application flow                      │  │
│  │  - Browser automation                        │  │
│  │  - Real HTTP requests                        │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  ┌───────────────────────────────────────────────┐  │
│  │  INTEGRATION TESTS (Jest + Supertest)         │  │
│  │  - API endpoint testing                       │  │
│  │  - Database integration                       │  │
│  │  - Service layer testing                      │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  ┌───────────────────────────────────────────────┐  │
│  │  UNIT TESTS (Jest)                           │  │
│  │  - Individual functions                        │  │
│  │  - Isolated logic                             │  │
│  │  - Mocked dependencies                         │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Test Coverage / Cobertura de Tests

| Suite               | Tests   | Purpose                   |
| ------------------- | ------- | ------------------------- |
| auth.test.ts        | 15      | Authentication flows      |
| tree.test.ts        | 10      | Binary tree operations    |
| commissions.test.ts | 15      | Commission calculations   |
| rbac.test.ts        | 20      | Role-based access control |
| crm.test.ts         | 17      | Lead management           |
| pagination.test.ts  | 6       | Pagination                |
| validation.test.ts  | 24      | Input validation          |
| auth.spec.ts        | 6       | E2E auth flows            |
| admin.spec.ts       | 10      | E2E admin flows           |
| dashboard.spec.ts   | 8       | E2E dashboard flows       |
| **TOTAL**           | **131** | **All passing**           |
