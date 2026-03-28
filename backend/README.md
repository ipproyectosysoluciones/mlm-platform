# MLM Binary Affiliations - Backend

Backend API para sistema de membresía binaria MLM.

## Stack Tecnológico

- **Runtime**: Node.js 24+ (ES Modules)
- **Framework**: Express.js
- **Lenguaje**: TypeScript (ES Modules)
- **ORM**: Sequelize 6
- **Base de datos**: MySQL 8 o PostgreSQL 16 (soporta ambos)
- **Build**: esbuild (~1.2MB)
- **Auth**: JWT
- **Validación**: express-validator
- **CSV**: csv-parse
- **Tests**: Jest + Supertest

## Requisitos Previos

- Node.js 24+
- MySQL 8 o PostgreSQL 16
- npm o yarn

## Instalación

```bash
# 1. Clonar repositorio y entrar al backend
cd backend

# 2. Instalar dependencias
pnpm install

# 3. Crear archivo .env desde el ejemplo
cp .env.example .env

# 4. Editar .env con tus credenciales
# MySQL (default):
# DB_DIALECT=mysql
# DB_HOST=localhost
# DB_PORT=3306
# DB_NAME=mlm_db
# DB_USER=root
# DB_PASSWORD=tu_password

# O PostgreSQL:
# DB_DIALECT=postgres
# DB_HOST=localhost
# DB_PORT=5434
# DB_NAME=mlm_db
# DB_USER=mlm
# DB_PASSWORD=mlm123

# 5. Iniciar el servidor (crea las tablas automáticamente)
pnpm run dev
```

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

| Tipo    | Descripción      | Porcentaje |
| ------- | ---------------- | ---------- |
| Direct  | Referido directo | 10%        |
| Level 1 | Primer nivel     | 5%         |
| Level 2 | Segundo nivel    | 3%         |
| Level 3 | Tercer nivel     | 2%         |
| Level 4 | Cuarto nivel     | 1%         |

## Swagger API Docs

La documentación interactiva de la API está disponible en:

```
http://localhost:3000/api-docs
```

Incluye todos los endpoints con ejemplos de Request/Response.

## Tests

| Comando                      | Descripción                        |
| ---------------------------- | ---------------------------------- |
| `pnpm test`                  | Tests unitarios                    |
| `pnpm test:unit`             | Solo tests unitarios               |
| `pnpm test:integration`      | Tests de integración (requiere DB) |
| `pnpm test:integration:auth` | Tests de integración específicos   |

Los tests de integración requieren:

- **MySQL**: puerto 3307
- **PostgreSQL**: puerto 5435

Configurar con variables de entorno `DB_DIALECT`, `TEST_DB_PORT`.

## Licencia

ISC
