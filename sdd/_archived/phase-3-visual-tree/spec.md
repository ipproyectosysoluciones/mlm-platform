# Phase 3: Visual Tree UI — Specification

## Change Name

**Visual Tree UI**

---

## 1. Overview / Descripción General

Implementación de una interfaz de árbol binario MLM interactiva con React Flow, permitiendo visualización fluida, búsqueda de usuarios y navegación optimizada.

> Implementation of an interactive MLM binary tree interface using React Flow, enabling fluid visualization, user search, and optimized navigation.

---

## 2. User Stories

### US-3.1: Visualización del Árbol

**Como** usuario MLM  
**Quiero** ver mi árbol genealógico visualmente  
**Para** entender mi red de patrocinados de un vistazo

**Criterios de aceptación:**

- [ ] El árbol se renderiza con nodos conectados visualmente
- [ ] Cada nodo muestra: email truncado, nivel, pierna (izq/der)
- [ ] Pan y zoom funcionan fluidamente (60fps)
- [ ] La profundidad inicial es configurable (1-5 niveles)

### US-3.2: Navegación por Zoom

**Como** usuario  
**Quiero** hacer zoom in/out del árbol  
**Para** ver detalles o contexto general

**Criterios de aceptación:**

- [ ] Zoom con scroll del mouse
- [ ] Botones +/- para zoom incremental
- [ ] Botón "fit view" para ajustar a pantalla
- [ ] Zoom máximo: 200%, mínimo: 25%

### US-3.3: Búsqueda de Usuarios

**Como** usuario  
**Quiero** buscar un usuario en mi árbol  
**Para** encontrar rápidamente a un patrocinado específico

**Criterios de aceptación:**

- [ ] Campo de búsqueda en la barra superior
- [ ] Búsqueda por email o referral code
- [ ] Resultados aparecen en dropdown
- [ ] Click en resultado centra el árbol en ese nodo
- [ ] Mensaje "No encontrado" si no hay resultados

### US-3.4: Detalles del Nodo

**Como** usuario  
**Quiero** ver información detallada de un usuario  
**Para** conocer su estado y estadísticas

**Criterios de aceptación:**

- [ ] Click en nodo abre panel lateral derecho
- [ ] Panel muestra: email completo, nivel, pierna, fecha de registro
- [ ] Stats: downline izquierda, derecha, total
- [ ] Botón "Ver subtree" expande desde ese nodo
- [ ] Botón cerrar panel

### US-3.5: Minimap

**Como** usuario  
**Quiero** ver un minimapa del árbol  
**Para** navegar rápidamente a diferentes secciones

**Criterios de aceptación:**

- [ ] Minimap en esquina inferior derecha
- [ ] Muestra vista general del árbol completo
- [ ] Recuadro indica viewport actual
- [ ] Click en minimap mueve el viewport

### US-3.6: Internacionalización

**Como** usuario  
**Quiero** ver la interfaz en mi idioma  
**Para** entender mejor la aplicación

**Criterios de aceptación:**

- [ ] Todos los textos bilingües (ES/EN)
- [ ] Idiomas: "Ver árbol completo", "Expandir", "Contraer"
- [ ] Tooltips en español e inglés

---

## 3. Functional Requirements / Requisitos Funcionales

### FR-3.1: Backend API

| Endpoint                 | Método | Descripción                     |
| ------------------------ | ------ | ------------------------------- |
| `/api/users/me/tree`     | GET    | Árbol del usuario actual        |
| `/api/users/:id/tree`    | GET    | Árbol de un usuario específico  |
| `/api/users/search?q=`   | GET    | Buscar usuario por email/código |
| `/api/users/:id/details` | GET    | Detalles de un usuario          |

**Parámetros de query:**

```
GET /api/users/me/tree?depth=3&page=1&limit=50
```

### FR-3.2: Frontend Components

| Componente         | Responsabilidad                           |
| ------------------ | ----------------------------------------- |
| `TreeView.tsx`     | Página principal, Orchestrates React Flow |
| `TreeNode.tsx`     | Nodo personalizado (avatar, info, stats)  |
| `SearchBar.tsx`    | Búsqueda con dropdown de resultados       |
| `DetailsPanel.tsx` | Panel lateral de detalles                 |
| `TreeControls.tsx` | Zoom, fit, profundidad                    |
| `TreeMinimap.tsx`  | Minimap integrado con React Flow          |

### FR-3.3: Data Model

```typescript
interface TreeNode {
  id: string;
  email: string;
  referralCode: string;
  position: 'left' | 'right';
  level: number;
  stats: {
    leftCount: number;
    rightCount: number;
  };
  children: TreeNode[];
}

interface UserDetails {
  id: string;
  email: string;
  referralCode: string;
  position: 'left' | 'right';
  level: number;
  status: 'active' | 'inactive';
  createdAt: string;
  stats: {
    leftCount: number;
    rightCount: number;
    totalDownline: number;
  };
}
```

---

## 4. Non-Functional Requirements / Requisitos No Funcionales

### Performance

- Tiempo de carga: < 2s para 100 nodos
- Renderizado: 60fps durante pan/zoom
- Búsqueda: < 500ms para resultados
- Bundle: < 100KB adicional (React Flow + componentes)

### Accessibility

- Navegación por teclado (Tab, Enter, Escape)
- Roles ARIA para screen readers
- Contraste de colores mínimo 4.5:1

### Browser Support

- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

---

## 5. Edge Cases / Casos Extremos

| Caso                              | Comportamiento                                   |
| --------------------------------- | ------------------------------------------------ |
| Árbol vacío                       | Mensaje "No tienes miembros en tu red aún" + CTA |
| Usuario no encontrado en búsqueda | Mensaje "Usuario no encontrado en tu árbol"      |
| Árbol muy profundo (>10 niveles)  | Auto-expandir 3 niveles, botón "Expandir más"    |
| Nodo sin hijos                    | Mostrar placeholder "Vacío"                      |
| Error de red                      | Toast de error + botón reintentar                |
| -many nodes (1000+)               | Virtualización automática de React Flow          |

---

## 6. Out of Scope

- Drag and drop de posiciones
- Edición manual de estructura
- Exportar a PDF/PNG
- Aplicación móvil nativa
- Notificaciones en tiempo real (WebSockets)

---

## Status

**APPROVED** → Ready for Design

---

## Dependencies

- Phase 1 MVP (completo)
- React 18+
- React Flow @xyflow/react

---

## Next

→ [design.md](./design.md)
