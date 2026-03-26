# Backend Documentation / Documentación del Backend

## Español

Esta carpeta contiene la documentación específica del backend de la plataforma MLM.

### Estructura / Structure

```tree
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

```tree
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

### Database / Base de Datos

| Variable      | Descripción / Description      | Default   |
| ------------- | ------------------------------ | --------- |
| `DB_HOST`     | MySQL host / Host MySQL        | localhost |
| `DB_PORT`     | MySQL port / Puerto MySQL      | 3306      |
| `DB_NAME`     | Database name / Nombre DB      | mlm_db    |
| `DB_USER`     | Database user / Usuario DB     | root      |
| `DB_PASSWORD` | Database password / Contraseña | -         |

### Server / Servidor

| Variable          | Descripción / Description     | Default     |
| ----------------- | ----------------------------- | ----------- |
| `NODE_ENV`        | Environment / Entorno         | development |
| `PORT`            | Server port / Puerto servidor | 3000        |
| `ALLOWED_ORIGINS` | CORS origins / Orígenes CORS  | localhost   |

### Authentication / Autenticación

| Variable         | Descripción / Description        | Default |
| ---------------- | -------------------------------- | ------- |
| `JWT_SECRET`     | JWT signing secret / Secreto JWT | -       |
| `JWT_EXPIRES_IN` | Token expiry / Expiración token  | 7d      |

### Redis (Opcional / Optional)

| Variable         | Descripción / Description         | Default   |
| ---------------- | --------------------------------- | --------- |
| `REDIS_ENABLED`  | Enable Redis / Habilitar Redis    | false     |
| `REDIS_HOST`     | Redis host / Host Redis           | localhost |
| `REDIS_PORT`     | Redis port / Puerto Redis         | 6379      |
| `REDIS_PASSWORD` | Redis password / Contraseña Redis | -         |

### Brevo Email (Opcional / Optional)

| Variable             | Descripción / Description          | Default              |
| -------------------- | ---------------------------------- | -------------------- |
| `BREVO_SMTP_HOST`    | SMTP host / Host SMTP              | smtp-relay.brevo.com |
| `BREVO_SMTP_PORT`    | SMTP port / Puerto SMTP            | 587                  |
| `BREVO_SMTP_USER`    | SMTP user / Usuario SMTP           | -                    |
| `BREVO_SMTP_PASS`    | SMTP password / Contraseña SMTP    | -                    |
| `BREVO_SENDER_EMAIL` | Sender email / Email del remitente | -                    |
| `BREVO_SENDER_NAME`  | Sender name / Nombre del remitente | MLM Platform         |

### Brevo SMS (Opcional / Optional)

| Variable           | Descripción / Description        | Default     |
| ------------------ | -------------------------------- | ----------- |
| `BREVO_API_KEY`    | API key / Clave API              | -           |
| `BREVO_SMS_SENDER` | SMS sender ID / ID remitente SMS | MLMPlatform |

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
