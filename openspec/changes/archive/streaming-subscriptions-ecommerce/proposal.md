# Proposal: Streaming Subscriptions E-Commerce

## Intent

Agregar funcionalidad e-commerce mínima a la plataforma MLM para vender suscripciones a plataformas de streaming (Netflix, Disney+, Spotify, etc.) como productos. El objetivo es validar el modelo de negocio MLM con productos digitales antes de expandir a un catálogo más amplio.

> Add minimal e-commerce functionality to the MLM platform to sell streaming platform subscriptions (Netflix, Disney+, Spotify, etc.) as products. Goal is to validate the MLM business model with digital products before expanding.

## Scope

### In Scope
- **Product Model**: Nuevo modelo para representar suscripciones de streaming con nombre, plataforma, precio, y período
- **Orden Flow**: Selección de producto → Proceso de compra → Distribución de comisiones
- **Reutilización de sistemas existentes**: Purchase y Commission ya están implementados y funcionando
- **Backend API**: Endpoints CRUD para productos, y endpoint para crear orden
- **Frontend básico**: Catálogo de productos y página de checkout simple

### Out of Scope
- Carritos de compra persistentes (compras one-click por ahora)
- Gestión de inventario o stock
- Múltiples métodos de pago (MVP: solo simulación/manual)
- Panel de admin para gestión de productos (hardcoded en V1)
- Facturación o invoices automatizados
- Gateways de pago reales (Stripe, PayPal, etc.)
- Refunds o cancellations
- Historial de suscripciones activas
- Renovaciones automáticas

## Approach

### High-Level Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │ ProductCatalog│───▶│   Checkout   │───▶│ OrderSuccess │      │
│  │   Page       │    │    Page      │    │    Page      │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ POST /api/orders
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │OrderController│───▶│ OrderService│───▶│CommissionSvc│      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                               │                    │              │
│                               ▼                    ▼              │
│                        ┌──────────────┐    ┌──────────────┐      │
│                        │   Product    │    │   Purchase   │      │
│                        └──────────────┘    └──────────────┘      │
│                               │                    │              │
│                               └────────┬───────────┘              │
│                                        ▼                          │
│                               ┌──────────────┐                     │
│                               │  Commission  │                    │
│                               └──────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
```

### Technical Approach

1. **Extender Purchase**: Agregar `productId` como foreign key opcional para linkear compras con productos
2. **Nuevo modelo Product**: Sequelize model con streaming platforms
3. **Nuevo modelo Order**: Orden wrapper que agrupa purchase + product
4. **Reutilizar CommissionService**: Ya calcula y distribuye comisiones, solo necesita ser llamado desde OrderService
5. **Frontend**: React components simples para catálogo y checkout

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `backend/src/models/Product.ts` | New | Modelo para productos de streaming |
| `backend/src/models/Order.ts` | New | Modelo de orden (purchase + product) |
| `backend/src/controllers/ProductController.ts` | New | CRUD de productos |
| `backend/src/controllers/OrderController.ts` | New | Crear órdenes |
| `backend/src/services/OrderService.ts` | New | Lógica de órdenes y触发 comisiones |
| `backend/src/services/ProductService.ts` | New | Lógica de productos |
| `backend/src/routes/` | Modified | Nuevas rutas /api/products, /api/orders |
| `backend/src/models/Purchase.ts` | Modified | Agregar productId optional |
| `frontend/src/pages/ProductCatalog.tsx` | New | Catálogo de productos |
| `frontend/src/pages/Checkout.tsx` | New | Página de checkout |
| `frontend/src/services/api.ts` | Modified | Agregar endpoints |
| `frontend/src/i18n/locales/*.json` | Modified | Agregar keys de productos |
| `SPEC.md` | Modified | Documentar nuevos endpoints |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Commission distribution sobre现有的purchase logic | Medium | El OrderService reutiliza el flujo existente, solo cambia el trigger |
| Hardcoded products no escalan | High | Diseñar Product model extensible para agregar más productos post-MVP |
| Concurrencia en árbol binario | Low | UserClosure ya maneja esto, OrderService no modifica estructura |
| Testing gap | Medium | Agregar tests de integración para OrderService y CommissionService |

## Rollback Plan

1. **Si hay problemas de DB**: Revertir migración agregando `productId` como nullable opcional
2. **Si commissions se rompen**: Desactivar trigger de OrderService, las compras manuales vía `/api/commissions` siguen funcionando
3. **Si frontend rompe**: Feature flag para ocultarProductCatalog/Checkout, rutas existentes no afectadas
4. **Comandos de rollback**:
   ```bash
   # Revert DB migration (drop new tables)
   npx sequelize-cli db:migrate:undo
   
   # Revert code changes via git
   git checkout HEAD~1 -- backend/src/models/Product.ts backend/src/models/Order.ts
   ```

## Dependencies

- **Sequelize CLI**: Para migraciones de nuevos modelos
- **No new libraries required**: Reutiliza stack existente (React, Express, Sequelize, TypeScript)

## Success Criteria

- [ ] Admin puede listar productos de streaming via API
- [ ] Usuario puede ver catálogo de productos en frontend
- [ ] Usuario puede comprar un producto y se crea Purchase + Order
- [ ] Commissions se distribuyen correctamente según las tasas existentes (10%, 5%, 3%, 2%, 1%)
- [ ] Tests de integración pasan para nuevo flujo
- [ ] MVP funcional en 2-3 días de desarrollo

---

**Change**: streaming-subscriptions-ecommerce  
**Mode**: hybrid (engram + openspec)  
**Created**: 2026-03-24
