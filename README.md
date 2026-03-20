# MLM Platform - Sistema de Afiliaciones Binarias

Plataforma MLM (Multi-Level Marketing) con sistema de afiliaciones binarias, comisiones por niveles y visualización de árbol genealógico.

## 🚀 Características / Features

- **Sistema de Afiliaciones Binarias** - Red de usuarios con izquierda/derecha
- **Comisiones Automáticas** - Directas y por niveles (hasta 4 niveles)
- **Código QR de Referido** - Generación automática para cada usuario
- **Dashboard en Tiempo Real** - Estadísticas y rendimiento
- **Panel de Administración** - Gestión completa de usuarios y comisiones
- **API REST Documentada** - OpenAPI/Swagger integrado
- **Tests Automatizados** - Unit, Integration y E2E con Playwright

## 📋 Requisitos / Requirements

- Node.js 18+
- MySQL 8.0+
- Redis 7+ (opcional)
- Docker y Docker Compose (para desarrollo)

## 🛠️ Instalación / Installation

```bash
# Clonar el repositorio
git clone <repo-url>
cd MLM

# Backend
cd backend
cp .env.example .env
pnpm install
pnpm build

# Frontend
cd ../frontend
pnpm install
```

## 🐳 Docker (Desarrollo)

```bash
cd backend
docker compose up -d

# MySQL, Redis y phpMyAdmin disponibles
```

## ⚙️ Configuración / Configuration

### Variables de Entorno

| Variable          | Descripción                     | Default   |
| ----------------- | ------------------------------- | --------- |
| `DB_HOST`         | Host de MySQL                   | localhost |
| `DB_PORT`         | Puerto de MySQL                 | 3306      |
| `DB_NAME`         | Nombre de la base de datos      | mlm_db    |
| `DB_USER`         | Usuario de MySQL                | root      |
| `DB_PASSWORD`     | Contraseña de MySQL             | -         |
| `JWT_SECRET`      | Secreto para JWT                | -         |
| `REDIS_ENABLED`   | Habilitar Redis                 | false     |
| `ALLOWED_ORIGINS` | Origins permitidos (producción) | localhost |

## 🚀 Ejecución / Running

### Development

```bash
# Backend
cd backend
pnpm dev

# Frontend (en otra terminal)
cd frontend
pnpm dev
```

### Production

```bash
# Backend
cd backend
pnpm build
pnpm start

# Frontend
cd frontend
pnpm build
pnpm preview
```

## 🧪 Testing

```bash
# Backend - Unit Tests
cd backend
pnpm test

# Backend - Integration Tests
pnpm test:integration

# Frontend - Unit Tests
cd ../frontend
pnpm test

# E2E Tests
pnpm test:e2e
```

## 📚 Documentación API

Swagger UI disponible en: `http://localhost:3000/api-docs`

### Endpoints Principales

| Método | Endpoint             | Descripción                   |
| ------ | -------------------- | ----------------------------- |
| POST   | `/api/auth/register` | Registrar usuario             |
| POST   | `/api/auth/login`    | Iniciar sesión                |
| GET    | `/api/auth/me`       | Usuario actual                |
| GET    | `/api/dashboard`     | Dashboard del usuario         |
| GET    | `/api/users/me/tree` | Árbol binario                 |
| GET    | `/api/commissions`   | Lista de comisiones           |
| GET    | `/api/admin/stats`   | Estadísticas globales (admin) |
| GET    | `/api/admin/users`   | Lista de usuarios (admin)     |

## 👥 Credenciales de Prueba

```
Admin: admin@mlm.com / admin123
Usuario: user1@mlm.com / user123
```

## 📁 Estructura del Proyecto

```
MLM/
├── backend/
│   ├── src/
│   │   ├── config/         # Configuración
│   │   ├── controllers/     # Controladores
│   │   ├── middleware/      # Middleware
│   │   ├── models/          # Modelos Sequelize
│   │   ├── routes/          # Rutas
│   │   ├── services/       # Lógica de negocio
│   │   └── __tests__/      # Tests unitarios
│   ├── scripts/             # Scripts útiles
│   └── docker-compose.yml   # Docker services
├── frontend/
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   ├── pages/           # Páginas
│   │   ├── services/        # Servicios API
│   │   ├── context/         # Contextos React
│   │   └── test/            # Tests
│   ├── e2e/                 # Tests E2E
│   └── playwright.config.ts
├── SPEC.md                   # Especificaciones
└── README.md
```

## 🔒 Seguridad / Security

- JWT Authentication
- Rate Limiting en endpoints de auth
- CORS configurado con validación de origins
- Helmet security headers
- Contraseñas hasheadas con bcrypt

## 📦 Stack Tecnológico

**Backend:**

- Node.js + Express
- TypeScript
- Sequelize ORM
- MySQL
- Redis (opcional)
- JWT

**Frontend:**

- React 19
- Vite
- TypeScript
- Tailwind CSS
- React Router
- Axios

**Testing:**

- Vitest (unit)
- Playwright (E2E)
- Jest (backend)

## 🔄 Versionado / Versioning

Este proyecto usa [Semantic Versioning](https://semver.org/):

```
MAJOR.MINOR.PATCH
1.0.0
```

Tags:

```bash
git tag -a v1.0.0 -m "Release 1.0.0"
git push origin --tags
```

## 📄 Licencia / License

MIT

## 👥 Autores / Authors

- MLM Development Team
