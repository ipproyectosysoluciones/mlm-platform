# Backend Documentation / Documentación del Backend

## Español

Esta carpeta contiene la documentación específica del backend de la plataforma MLM.

### Estructura / Structure

```
backend/docs/
├── README.md          # Este archivo / This file
├── API.md             # Referencia de endpoints / Endpoint reference
├── MODELS.md          # Modelos de base de datos / Database models
└── SERVICES.md       # Lógica de negocio / Business logic
```

---

## English

This folder contains specific documentation for the MLM platform backend.

### Structure

```
backend/docs/
├── README.md          # This file
├── API.md             # Endpoint reference
├── MODELS.md          # Database models
└── SERVICES.md        # Business logic
```

---

## Quick Reference / Referencia Rápida

### Start Development Server

```bash
cd backend
npm run dev
# Server on http://localhost:3000
```

### Run Tests

```bash
pnpm test              # Unit tests
pnpm test:integration   # Integration tests
```

### Build for Production

```bash
pnpm build
pnpm start
```

### Seed Database

```bash
npm run seed
```

---

## Environment Variables / Variables de Entorno

| Variable          | Descripción        | Default     |
| ----------------- | ------------------ | ----------- |
| `NODE_ENV`        | Environment        | development |
| `PORT`            | Server port        | 3000        |
| `DB_HOST`         | MySQL host         | localhost   |
| `DB_PORT`         | MySQL port         | 3306        |
| `DB_NAME`         | Database name      | mlm_db      |
| `DB_USER`         | Database user      | root        |
| `DB_PASSWORD`     | Database password  | -           |
| `JWT_SECRET`      | JWT signing secret | -           |
| `JWT_EXPIRES_IN`  | Token expiry       | 7d          |
| `ALLOWED_ORIGINS` | CORS origins       | localhost   |

---

## Main Files / Archivos Principales

| File                     | Description / Descripción                            |
| ------------------------ | ---------------------------------------------------- |
| `src/server.ts`          | Server entry point / Punto de entrada del servidor   |
| `src/app.ts`             | Express app configuration / Configuración de Express |
| `src/config/database.ts` | Database connection / Conexión a base de datos       |
| `src/config/swagger.ts`  | API documentation / Documentación de API             |
| `src/routes/index.ts`    | Main routes / Rutas principales                      |

---

## API Documentation / Documentación de API

Swagger UI disponible en: `http://localhost:3000/api-docs`

Para documentación detallada, ver `docs/API.md`.
