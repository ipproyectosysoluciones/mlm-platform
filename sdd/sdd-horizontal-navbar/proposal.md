# SDD: Horizontal Navbar Layout

## Change Name

**Horizontal Navbar Layout / Layout con Navbar Horizontal**

## 1. Overview

Reemplazo del sidebar lateral por un navbar horizontal moderno que:

- Ocupa menos espacio en pantalla
- Es más familiar para usuarios (patrón clásico)
- Mejora la UX en dispositivos desktop
- Mantiene responsividad en mobile con hamburger menu

> Replacement of lateral sidebar with modern horizontal navbar that:
>
> - Takes less screen space
> - Is more familiar to users (classic pattern)
> - Improves UX on desktop devices
> - Maintains responsiveness on mobile with hamburger menu

## 2. Motivation / Problem

### Problem Statement / Declaración del Problema

- Sidebar de 256px (w-64) ocupa mucho espacio valioso en pantallas
- En pantallas pequeñas el sidebar cubre contenido
- Usuarios requieren patrón de navegación más familiar
- Navbar horizontal es estándar en aplicaciones web modernas

> Sidebar of 256px (w-64) takes valuable screen space
> On small screens the sidebar covers content
> Users expect a more familiar navigation pattern
> Horizontal navbar is standard in modern web applications

### Why This Change / Por Qué Este Cambio

1. **UX Mejorada**: Patrón de navegación reconocido universalmente
2. **Más Espacio**: El contenido usa toda la pantalla disponible
3. **Mobile-First**: Diseño responsivo que funciona en todos los dispositivos
4. **Mantenibilidad**: Un componente de layout en lugar de sidebar complexo

## 3. Scope

### In Scope:

- Crear componente AppLayout con navbar horizontal
- Logo + navegación + selector idioma + user menu
- Menú hamburger para mobile
- Dropdown de usuario (perfil, logout)
- Wrapper de rutas protegidas en App.tsx
- Transiciones suaves entre estados

### Out of Scope:

- Sidebar collapsible (removido completamente)
- Notificaciones en navbar
- Búsqueda global
- Temas múltiples

## 4. Approach

### Technology / Tecnología

- Componente standalone `AppLayout.tsx`
- Wraps todas las rutas protegidas
- Navbar fijo en top con `fixed top-0`
- Tailwind CSS para estilos responsivos
- Lucide React para iconos

### Design Decisions / Decisiones de Diseño

| Decision          | Choice         | Rationale                                 |
| ----------------- | -------------- | ----------------------------------------- |
| Navbar height     | 64px (h-16)    | Standard size, enough for touch targets   |
| Breakpoint        | lg (1024px)    | Mobile hamburger below, desktop nav above |
| User menu         | Dropdown       | Familiar pattern, saves space             |
| Language selector | Inline buttons | Quick access, visual feedback             |

## 5. Files Affected

### Created / Creados

| File                                           | Description             |
| ---------------------------------------------- | ----------------------- |
| `frontend/src/components/layout/AppLayout.tsx` | Main layout component   |
| `sdd/sdd-horizontal-navbar/proposal.md`        | Este documento          |
| `sdd/sdd-horizontal-navbar/spec.md`            | Especificación técnica  |
| `sdd/sdd-horizontal-navbar/design.md`          | Diseño e implementación |

### Modified / Modificados

| File                   | Changes                     |
| ---------------------- | --------------------------- |
| `frontend/src/App.tsx` | Routes wrapped in AppLayout |

## 6. Rollout Plan

1. ✅ Crear AppLayout.tsx con navbar horizontal
2. ✅ Implementar menú mobile con hamburger
3. ✅ Implementar dropdown de usuario
4. ✅ Agregar selector de idioma
5. ✅ Actualizar App.tsx para usar AppLayout
6. ⏳ Verificar estilos responsivos
7. ⏳ Testear en diferentes tamaños de pantalla

## 7. Status

**PROPOSED** → APPROVED → IMPLEMENTED

## 8. Dependencies

- react >= 18.x
- react-router-dom >= 6.x
- react-i18next >= 14.x
- lucide-react (already installed)

## 9. Risks

| Risk                              | Mitigation                        |
| --------------------------------- | --------------------------------- |
| Content overlap with fixed navbar | Add pt-16 to main content         |
| Mobile menu performance           | CSS transitions, not JS animation |
| Navigation state not preserved    | React Router handles this         |

---

## Status History

| Version | Date       | Status   |
| ------- | ---------- | -------- |
| 1.0     | 2026-03-22 | Proposed |
