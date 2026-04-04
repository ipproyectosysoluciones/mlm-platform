# Proposal: Wallet Digital

## Intent

El sistema actual de comisiones en la plataforma MLM funciona pero tiene limitaciones significativas: los usuarios no tienen visibilidad de su saldo disponible, no existe un sistema de retiros automatizado, y todo el proceso de pago de comisiones es manual. Este cambio implementa un sistema de billetera digital (Wallet) que permite a los distribuidores:

1. **Visualizar su saldo** en tiempo real (convertido a USD)
2. **Solicitar retiros** cuando reachen el monto mínimo
3. **Historial completo de transacciones** (comisiones, retiros, fees)
4. **Pagos automáticos diarios** sin intervención manual

El problema técnico es que actualmente solo existen registros de comisiones en `Commission.ts`, pero NO hay forma de tracking de balance por usuario ni sistema de transacciones.

## Scope

### In Scope

- **Tablas nuevas**: `wallets`, `wallet_transactions`, `withdrawal_requests`
- **Migración de comisiones históricas**: Todos los registros de commission existentes se migran al wallet como transacciones de tipo `commission_earned`
- **Pago automático diario**: Job programado que procesa withdrawals aprobadas
- **Conversión a USD**: Todas las comisiones se convierten a USD usando exchange rate
- **Fee de retiro**: Se deduce del usuario al procesar el retiro
- **Monto mínimo**: $20 USD para solicitar retiro
- **API REST**: Endpoints para wallet balance, transactions, withdrawal requests
- **Frontend**: Dashboard actualizado con balance, historial, formulario de retiro

### Out of Scope

- Integración con procesadores de pago externos (Stripe, PayPal) — se deja como archivo técnico
- Sistema de recarga de wallet (depósito de fondos)
- Multi-moneda avanzada — solo USD como moneda base
- Sistema de referidos con crédito directo al wallet
- Notifications (email/SMS) — se puede agregar después

## Approach

### Arquitectura de 3 fases

**Fase 1: Base de Datos y Modelos**
- Crear tablas `wallets`, `wallet_transactions`, `withdrawal_requests`
- Modificar `CommissionService` para crear wallet transactions al aprobar comisiones
- Script de migración para comisiones históricas

**Fase 2: API y Lógica de Negocio**
- Endpoints GET /api/wallets/:userId, POST /api/wallets/withdraw
- Job diário para procesar retiros aprobados
- Validación de monto mínimo y cálculo de fees

**Fase 3: Frontend**
- Componente WalletDashboard
- Lista de transacciones con filtros
- Formulario de solicitud de retiro
- Notificación de estado de retiro

### Flujo de Datos

```
Purchase → calculateCommissions() → Commission pending
                                        ↓
                              Aprobación manual (existente)
                                        ↓
                              WalletTransaction created (commission_earned)
                                        ↓
                              User request withdrawal ($20 min)
                                        ↓
                              Daily job → process withdrawals
                                        ↓
                              Status: pending → approved → paid
```

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `backend/src/models/` | New | Create Wallet.ts, WalletTransaction.ts, WithdrawalRequest.ts |
| `backend/src/database/migrations/` | New | Migration scripts para las 3 tablas |
| `backend/src/services/CommissionService.ts` | Modified | Integrar creación de wallet transactions al aprobar |
| `backend/src/services/WalletService.ts` | New | Lógica de negocio para wallet, retiros, fees |
| `backend/src/routes/wallet.routes.ts` | New | Endpoints REST para wallet |
| `backend/src/services/SchedulerService.ts` | Modified | Agregar job diário para retiros |
| `frontend/src/pages/Dashboard.tsx` | Modified | Agregar sección de wallet |
| `frontend/src/components/Wallet/` | New | Componentes para wallet UI |
| `frontend/src/store/walletStore.ts` | New | Zustand store para estado del wallet |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Migración de comisiones históricas falla | Medium | Script idempotente con logs detallados, rollback disponible |
| Job diário corre dos veces (duplicados) | Low | Usar transactions DB + lock, marcar withdrawals procesadas |
| Concurrencia: usuario intenta retirar dos veces | Low | Validar estado en DB antes de procesar, usar unique constraints |
| Exchange rate cambia durante el día | Low | Usar rate del momento de la transacción, guardar en record |
| Fee se deduce incorrectamente | Medium | Tests exhaustivos, validación doble en service |

## Rollback Plan

1. **Revertir migraciones**: `npx sequelize-cli migration:undo --to=XXXXXXXX-createWallets.js`
2. **Deshacer cambios en CommissionService**: Remover creación de wallet transactions
3. **Revertir frontend**: Remover componentes de wallet del Dashboard
4. **Nota**: Las wallet transactions históricas no se pueden restaurar automáticamente — mantener backup de la tabla antes de migración

## Dependencies

- **Sistema de comisiones existente**: `Commission.ts`, `CommissionService.ts` — debe estar funcional
- **Exchange rate API**: Necesitamos endpoint o servicio para convertir monedas a USD
- **Scheduler/Cron**: El job diário usa node-cron o similar (ya existe o crear)

## Success Criteria

- [ ] Tablas `wallets`, `wallet_transactions`, `withdrawal_requests` creadas y funcionando
- [ ] Migración de comisiones históricas completa sin errores
- [ ] API endpoints responden correctamente (GET balance, POST withdraw, GET transactions)
- [ ] Job diário procesa retiros automáticamente
- [ ] Fee de retiro se deduce correctamente del usuario
- [ ] Frontend muestra balance, historial y formulario de retiro
- [ ] Tests pasan (unit + integration)
- [ ] Usuario puede solicitar retiro de $20+ USD y recibirlo (en entorno de pruebas)

---

**Change**: wallet-digital  
**Branch**: feature/wallet-digital  
**Mode**: HYBRID (engram + openspec)  
