# Nexo Real - Frontend

Frontend de la plataforma Nexo Real para sistema de membresía binaria con affiliates.

## Stack Tecnológico

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Estado**: Zustand
- **Estilos**: Tailwind CSS
- **Forms**: React Hook Form + Zod
- **HTTP**: Axios
- **Testing**: Vitest + Playwright (E2E)
- **i18n**: react-i18next (ES/EN bilingüe)

## Características

- **Dashboard**: Estadísticas y resumen de cuenta
- **Árbol Binario**: Visualización interactiva de red de affiliates
- **CRM**: Gestión de leads y comunicaciones
- **Comisiones**: Historial y estadísticas de ganancias
- **Landing Pages**: Creador de páginas de captura
- **E-Commerce**: Suscripciones de streaming (Netflix, Spotify, etc.)
- **Autenticación**: JWT con refresh tokens
- **Admin**: Panel de administración de usuarios

## Requisitos Previos

- Node.js 18+
- pnpm (recomendado)

## Instalación

```bash
# 1. Instalar dependencias
pnpm install

# 2. Crear archivo .env desde el ejemplo
cp .env.example .env

# 3. Ejecutar en desarrollo
pnpm dev
```

## Variables de Entorno

```env
VITE_API_URL=http://localhost:3000/api
VITE_APP_URL=http://localhost:5173
```

## Scripts Disponibles

| Comando         | Descripción                    |
| --------------- | ------------------------------ |
| `pnpm dev`      | Iniciar servidor de desarrollo |
| `pnpm build`    | Build para producción          |
| `pnpm preview`  | Preview del build              |
| `pnpm lint`     | Verificar código               |
| `pnpm format`   | Formatear código               |
| `pnpm test`     | Tests unitarios                |
| `pnpm test:e2e` | Tests E2E con Playwright       |

## Estructura del Proyecto

```
frontend/
├── src/
│   ├── components/     # Componentes reutilizables
│   ├── pages/          # Páginas de la aplicación
│   ├── services/       # Servicios API
│   ├── store/          # Estado global (Zustand)
│   ├── hooks/          # Custom hooks
│   ├── i18n/           # Tradcciones (ES/EN)
│   ├── types/          # Tipos TypeScript
│   ├── utils/          # Utilidades
│   └── App.tsx         # Componente principal
├── e2e/                # Tests E2E Playwright
└── public/             # Archivos estáticos
```

## Documentación de Componentes

Ver `docs/COMPONENTS.md` para documentación detallada de cada componente.

## Documentación de Páginas

Ver `docs/PAGES.md` para rutas y estructura de páginas.

## API Client

El cliente API está configurado en `src/services/api.ts`. Ver `docs/API_CLIENT.md` para más detalles.

## Licencia

ISC
