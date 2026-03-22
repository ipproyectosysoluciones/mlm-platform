# Phase 3: Visual Tree UI — Proposal

## Change Name / Nombre del Cambio

**Visual Tree UI** — Interactive Binary Tree Visualization

---

## 1. Intent / Intención

Implementar una interfaz de árbol binario MLM interactiva con pan, zoom, búsqueda de usuarios y navegación fluida, superando la experiencia de competidores como Maestro MLM.

> Implement an interactive MLM binary tree interface with pan, zoom, user search, and smooth navigation, surpassing competitor experience like Maestro MLM.

---

## 2. Scope / Alcance

### In-Scope

- [ ] Migrar TreeView.tsx a React Flow para pan/zoom nativo
- [ ] Implementar búsqueda de usuarios en tiempo real
- [ ] Agregar panel de detalles al hacer click en nodo
- [ ] Minimap para navegación en árboles grandes
- [ ] Optimizar backend: paginación por profundidad, eliminar N+1 queries
- [ ] Soporte multilenguaje (ES/EN) en toda la UI del árbol

### Out-of-Scope

- [ ] Aplicación móvil nativa
- [ ] Exportar árbol a PDF/PNG
- [ ] Editor de árbol (mover posiciones manualmente)

---

## 3. Approach / Enfoque

### Tecnología Elegida: React Flow

| Criterio         | Decisión                                                            |
| ---------------- | ------------------------------------------------------------------- |
| Librería         | React Flow (@xyflow/react)                                          |
| Versión          | Latest stable (~12.x)                                               |
| Motivo           | Pan/zoom built-in, React-native, minimap, virtualización automática |
| Bundle adicional | ~50KB gzipped                                                       |
| Licencia         | MIT                                                                 |

### Alternativas Consideradas

| Alternativa          | Problema                                  |
| -------------------- | ----------------------------------------- |
| D3.js                | Curva de aprendizaje alta, código verboso |
| Custom SVG + d3-zoom | Requiere implementar pan/zoom manualmente |
| GoJS                 | Licencia restrictiva, bundle grande       |

---

## 4. Impact / Impacto

### Positivo

- Mejora drástica en UX del usuario (visualización real vs texto)
- Diferenciación respecto a competidores
- Base para futuras features (drag-drop, edición)

### Negativo

- Bundle size aumenta ~50KB
- Breaking change en TreeView.tsx

### Riesgos Mitigados

| Riesgo                          | Mitigación                                    |
| ------------------------------- | --------------------------------------------- |
| Performance con árboles grandes | React Flow virtualiza nodos fuera de viewport |
| N+1 queries en backend          | Nueva paginación por profundidad              |
| Curva de aprendizaje React Flow | Documentación oficial excelente               |

---

## 5. Milestones / Hitos

1. **Backend Optimization** — Endpoint paginado por profundidad
2. **Frontend Core** — React Flow integration con pan/zoom
3. **Search Feature** — Búsqueda en tiempo real
4. **Details Panel** — Click en nodo muestra información
5. **Minimap** — Navegación en árboles grandes
6. **Testing** — E2E con Playwright

---

## 6. Success Metrics / Métricas de Éxito

- Tiempo de carga del árbol < 2s para 100 nodos
- 60fps durante pan/zoom
- Search retorna resultados < 500ms
- Cobertura de tests: 90%+

---

## Status

**PENDING** → Ready for Spec

---

## Next

→ [spec.md](./spec.md)
