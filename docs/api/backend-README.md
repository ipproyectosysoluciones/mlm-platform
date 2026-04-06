# Nexo Real - Backend

Backend API para la plataforma Nexo Real de membresía binaria.

## Stack Tecnológico

- **Runtime**: Node.js 24+ (ES Modules)
- **Framework**: Express.js
- **Lenguaje**: TypeScript (ES Modules)
- **ORM**: Sequelize 6
- **Base de datos**: PostgreSQL 16 (Docker)
- **Build**: esbuild (~1.2MB)
- **Auth**: JWT
- **Validación**: express-validator
- **CSV**: csv-parse
- **Tests**: Jest + Supertest

## Requisitos Previos

- Node.js 24+
- Docker (para PostgreSQL)
- pnpm

## Instalación

```bash
# 1. Clonar repositorio y entrar al backend
cd backend

# 2. Instalar dependencias
pnpm install

# 3. Iniciar PostgreSQL con Docker
docker start mlm_postgres

# 4. Crear archivo .env desde el ejemplo
cp .env.example .env

# 5. Editar .env con tus credenciales PostgreSQL:
# DB_DIALECT=postgres
# DB_HOST=localhost
# DB_PORT=5434
# DB_NAME=mlm_db
# DB_USER=mlm
# DB_PASSWORD=mlm123

# 6. Ejecutar seed (crea tablas + datos de prueba)
pnpm run seed
```

> **Nota**: El seed es re-ejecutable en cualquier momento. Si ya existen registros, los salta.

## Scripts Disponibles

```bash
# Desarrollo (con hot-reload)
pnpm run dev

# Build para producción
pnpm run build

# Iniciar producción
pnpm start

# Seed de datos de prueba
pnpm run seed

# Tests
pnpm test
```

## Endpoints API

### Autenticación

| Método | Endpoint             | Descripción             |
| ------ | -------------------- | ----------------------- |
| POST   | `/api/auth/register` | Registrar nuevo usuario |
| POST   | `/api/auth/login`    | Iniciar sesión          |
| GET    | `/api/auth/me`       | Obtener usuario actual  |

### Usuarios

| Método | Endpoint               | Descripción               |
| ------ | ---------------------- | ------------------------- |
| GET    | `/api/users/me`        | Perfil del usuario actual |
| GET    | `/api/users/me/tree`   | Árbol binario del usuario |
| GET    | `/api/users/me/qr`     | Descargar QR como PNG     |
| GET    | `/api/users/me/qr-url` | Obtener URL del QR        |
| GET    | `/api/users/:id/tree`  | Árbol de un usuario       |
| GET    | `/api/users/:id/qr`    | QR de un usuario          |

### Dashboard

| Método | Endpoint         | Descripción            |
| ------ | ---------------- | ---------------------- |
| GET    | `/api/dashboard` | Estadísticas completas |

### Comisiones

| Método | Endpoint                 | Descripción                 |
| ------ | ------------------------ | --------------------------- |
| GET    | `/api/commissions`       | Historial de comisiones     |
| GET    | `/api/commissions/stats` | Estadísticas de comisiones  |
| POST   | `/api/commissions`       | Crear compra (para testing) |

## Ejemplos de Uso

### Registrar usuario

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123",
    "sponsor_code": "MLM-XXXX-XXXX"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123"
  }'
```

### Obtener Dashboard

```bash
curl http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Estructura del Proyecto

```tree
backend/
├── src/
│   ├── config/          # Configuración (DB, env)
│   ├── models/         # Modelos Sequelize
│   ├── services/       # Lógica de negocio
│   ├── controllers/    # Controladores HTTP
│   ├── routes/         # Rutas de la API
│   ├── middleware/     # Middleware (auth, errors)
│   ├── utils/          # Utilidades
│   ├── types/          # Tipos TypeScript
│   ├── app.ts          # Configuración Express
│   └── server.ts       # Entry point
├── package.json
├── tsconfig.json
└── .env.example
```

## Comisiones

Las comisiones son **configurables dinámicamente** por tipo de negocio desde `/api/admin/commissions/config`.

### Tipos de negocio

| Tipo        | Descripción       |
| ----------- | ----------------- |
| suscripcion | Suscripciones     |
| producto    | Productos físicos |
| membresia   | Membresías        |
| servicio    | Servicios         |
| otro        | Otros negocios    |

### Tasas por defecto

| Tipo        | Direct | Lvl 1 | Lvl 2 | Lvl 3 | Lvl 4 |
| ----------- | ------ | ----- | ----- | ----- | ----- |
| suscripcion | 20%    | 10%   | 8%    | 5%    | 3%    |
| producto    | 15%    | 8%    | 5%    | 3%    | 2%    |
| membresia   | 25%    | 12%   | 8%    | 5%    | 3%    |
| servicio    | 18%    | 10%   | 6%    | 4%    | 2%    |
| otro        | 10%    | 5%    | 3%    | 2%    | 1%    |

## Swagger API Docs

La documentación interactiva de la API está disponible en:

```
http://localhost:3000/api-docs
```

Incluye todos los endpoints con ejemplos de Request/Response.

## Tests

| Comando                      | Descripción                         |
| ---------------------------- | ----------------------------------- |
| `pnpm test`                  | Tests unitarios (73 tests ✅)       |
| `pnpm test:unit`             | Solo tests unitarios                |
| `pnpm test:integration`      | Tests de integración con PostgreSQL |
| `pnpm test:integration:auth` | Tests de integración auth           |

### Estado de Tests

- ✅ **Unitarios**: 73/73 pasan (AuthService, UserService, ProductService, OrderService, EmailService)
- ✅ **Integración**: Funcionales con PostgreSQL (requieren container `mlm_postgres_test`)

### Tests de Integración

Los tests de integración requieren PostgreSQL configurado:

```bash
# 1. Iniciar container de test
docker start mlm_postgres_test

# 2. Verificar que esté corriendo
docker ps | grep postgres

# 3. Ejecutar tests de integración
pnpm test:integration
```

**Configuración de PostgreSQL para tests:**

| Variable           | Valor por defecto |
| ------------------ | ----------------- |
| `TEST_DB_HOST`     | 127.0.0.1         |
| `TEST_DB_PORT`     | 5435              |
| `TEST_DB_NAME`     | mlm_test          |
| `TEST_DB_USER`     | mlm_test          |
| `TEST_DB_PASSWORD` | mlm_test          |

> **Nota**: Los tests de integración crean una fresh Sequelize instance y sincronizan las tablas automáticamente en cada ejecución.

### Docker Containers

| Container         | Puerto | Usuario  | Base de datos |
| ----------------- | ------ | -------- | ------------- |
| mlm_postgres      | 5434   | mlm      | mlm_db        |
| mlm_postgres_test | 5435   | mlm_test | mlm_test      |

## Licencia

ISC
