# Frontend Documentation / Documentación del Frontend

## Español

Esta carpeta contiene la documentación específica del frontend de la plataforma MLM.

### Estructura / Structure

```
frontend/docs/
├── README.md          # Este archivo / This file
├── COMPONENTS.md      # Documentación de componentes / Component docs
├── PAGES.md           # Páginas y rutas / Pages and routes
└── API_CLIENT.md      # Cliente API / API client (ACTUALIZADO)
```

---

## English

This folder contains specific documentation for the MLM platform frontend.

### Structure

```
frontend/docs/
├── README.md          # This file
├── COMPONENTS.md      # Component documentation
├── PAGES.md           # Pages and routes
└── API_CLIENT.md      # API client
```

---

## Quick Start / Inicio Rápido

```bash
cd frontend
npm install
npm run dev
# App on http://localhost:5173
```

### Build for Production

```bash
npm run build
npm run preview
```

---

## Tech Stack

| Technology   | Version | Description  |
| ------------ | ------- | ------------ |
| React        | 19      | UI Library   |
| Vite         | 8.x     | Build tool   |
| TypeScript   | 5.x     | Type safety  |
| Tailwind CSS | 4.x     | Styling      |
| React Router | 7.x     | Navigation   |
| Axios        | -       | HTTP client  |
| React Query  | -       | Server state |

---

## Project Structure / Estructura del Proyecto

```
frontend/src/
├── components/         # React components
│   ├── common/        # Shared components
│   ├── dashboard/      # Dashboard components
│   ├── admin/          # Admin components
│   └── crm/            # CRM components
├── pages/             # Page components
├── services/          # API services
├── hooks/             # Custom hooks
├── context/           # React context
├── types/             # TypeScript types
├── utils/             # Utilities
└── App.tsx            # Main app
```

---

## E2E Testing with Playwright

### Run Tests

```bash
cd frontend

# All tests
npx playwright test

# Specific file
npx playwright test e2e/auth.spec.ts

# With UI mode
npx playwright test --ui

# With debug
npx playwright test --debug
```

### Test Structure / Estructura de Tests

```
frontend/e2e/
├── auth.spec.ts       # Authentication flows
├── admin.spec.ts      # Admin panel flows
├── dashboard.spec.ts  # Dashboard flows
└── helpers.ts         # Test utilities
```

### Test Users / Usuarios de Prueba

| Role  | Email         | Password |
| ----- | ------------- | -------- |
| Admin | admin@mlm.com | admin123 |
| User  | user1@mlm.com | user123  |

---

## Pages / Páginas

| Route        | Component      | Description         |
| ------------ | -------------- | ------------------- |
| `/login`     | Login          | User login          |
| `/register`  | Register       | User registration   |
| `/dashboard` | Dashboard      | Main user dashboard |
| `/admin`     | AdminDashboard | Admin panel         |
| `/profile`   | Profile        | User profile        |

---

## API Integration / Integración con API

The frontend communicates with the backend API at `http://localhost:3000/api`.

See `src/services/api.ts` for the Axios configuration and API service functions.
