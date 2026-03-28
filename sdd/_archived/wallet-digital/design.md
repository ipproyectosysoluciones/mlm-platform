# Design: Wallet Digital

## Technical Approach

El sistema de billetera digital se implementará en 3 fases siguiendo la arquitectura existente del proyecto. Se utilizarán los patrones establecidos: Sequelize modelos, servicios con lógica de negocio, rutas Express con validación, y Zustand para el frontend.

La estrategia principal es:

1. **Extender el flujo de comisiones existente** — al aprobar una comisión, automáticamente se crea una wallet transaction y se actualiza el balance
2. **Sistema de transacciones** — toda modificación de balance se registra con auditoría completa
3. **Job programado para retiros** — usar node-cron para procesar pagos diarios de withdrawals aprobados
4. **Migración idempotente** — script que migra comisiones históricas sin duplicados

## Architecture Decisions

### Decision: Wallet por usuario con una sola fila

**Choice**: Un registro de wallet por usuario (one-to-one con users table)
**Alternatives considered**:

- Multi-wallet por moneda — complejidad innecesaria
- Wallet como array en users — no escalable
  **Rationale**: Simplifica queries, cada usuario tiene un solo balance. El spec requiere "exactly one wallet record".

### Decision: Transactions como registro de auditoría

**Choice**: Cada cambio de balance se registra como wallet_transaction separado
**Alternatives considered**:

- Solo mantener balance actual sin historial — no permite auditoría
- Usar eventos/audit log genérico — menos específico para wallet
  **Rationale**: El spec requiere "all wallet balance changes are recorded as transactions". Permite rollback, debugging, y historial completo.

### Decision: Fee deducido del usuario (no del monto a pagar)

**Choice**: El fee se deduce del balance del usuario, el monto neto se paga al usuario
**Alternatives considered**:

- Fee deducido del monto solicitado (neto = amount - fee) — el usuario recibe menos
- Fee asumido por la plataforma — costos operativos
  **Rationale**: El spec dice "fee of 2.50 USD" se deduce del wallet, no del monto a procesar.

### Decision: Conversión a USD en punto de crédito

**Choice**: Las comisiones se convierten a USD al momento de ser aprobadas/creditas al wallet
**Alternatives considered**:

- Al momento de retiro — más compleja la lógica
- Al momento de creación — no se conoce el status final
  **Rationale**: El spec dice "convert to USD before crediting to wallets". El currencyConverter ya existe en el proyecto.

### Decision: Job diario con node-cron

**Choice**: Usar node-cron directamente en el proceso principal (no proceso separado)
**Alternatives considered**:

- Worker separado ( Bull/Redis) — más complejo, requiere infraestructura
- AWS Lambda/Cron externo — dependencia externa
  **Rationale**: El proyecto no tiene scheduler existente, node-cron es simple y suficiente para MVP.

### Decision: Zustand para estado del wallet

**Choice**: Crear walletStore con Zustand (sigue patrón del proyecto)
**Alternatives considered**:

- React Context — menos moderno
- Redux — overkill para esta feature
  **Rationale**: El proyecto usa Zustand implícitamente, es el estándar del frontend.

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         WALLET SYSTEM                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [1] COMISION APPROVAL FLOW                                        │
│  ┌──────────┐     ┌──────────────┐     ┌────────────────────────┐  │
│  │Commissions│────▶│Commission   │────▶│ WalletTransaction     │  │
│  │ table    │     │ Service      │     │ (commission_earned)    │  │
│  └──────────┘     └──────────────┘     └───────────┬────────────┘  │
│                                                      │               │
│                                                     ▼               │
│                                             ┌──────────────┐        │
│                                             │   Wallet     │        │
│                                             │   (balance)  │        │
│                                             └──────────────┘        │
│                                                                     │
│  [2] WITHDRAWAL REQUEST FLOW                                        │
│  ┌──────────┐     ┌──────────────┐     ┌────────────────────────┐  │
│  │User UI   │────▶│Wallet        │────▶│WithdrawalRequest      │  │
│  │(Form)    │     │Service       │     │ (status: pending)     │  │
│  └──────────┘     └──────────────┘     └───────────┬────────────┘  │
│                                                      │               │
│  [3] DAILY PAYOUT JOB (cron)                        │               │
│  ┌──────────────────────┐                           │               │
│  │ SchedulerService    │◀──────────────────────────┘               │
│  │ (node-cron: 00:00)  │                                       │     │
│  └────────┬────────────┘                                       │     │
│           │         ┌─────────────────┐    ┌────────────────┴──┐  │
│           ├────────▶│Process approved │───▶│ WalletTransaction │  │
│           │         │ withdrawals     │    │ (withdrawal+fee)  │  │
│           │         └─────────────────┘    └───────────────────┘  │
│           │                                                    │     │
│           │         ┌─────────────────┐    ┌────────────────┴──┐  │
│           └────────▶│ Update status   │───▶│WithdrawalRequest  │  │
│                     │ to paid/failed  │    │ (status: paid)    │  │
│                     └─────────────────┘    └───────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## File Changes

### Backend - Nuevos archivos

| File                                                           | Description                                                                                       |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `backend/src/models/Wallet.ts`                                 | Modelo Sequelize para wallets (userId, balance, currency, timestamps)                             |
| `backend/src/models/WalletTransaction.ts`                      | Modelo para transacciones (walletId, type, amount, referenceId, description)                      |
| `backend/src/models/WithdrawalRequest.ts`                      | Modelo para solicitudes de retiro (userId, amount, fee, netAmount, status)                        |
| `backend/src/services/WalletService.ts`                        | Lógica de negocio: createWallet, creditCommission, createWithdrawal, calculateFee, processPayouts |
| `backend/src/controllers/WalletController.ts`                  | Controladores: getBalance, getTransactions, createWithdrawal, cancelWithdrawal                    |
| `backend/src/routes/wallet.routes.ts`                          | Rutas REST: GET /:userId, GET /:userId/transactions, POST /withdraw, DELETE /withdrawals/:id      |
| `backend/src/services/SchedulerService.ts`                     | Job diário para procesar retiros aprovados (nuevo archivo)                                        |
| `backend/src/database/migrations/{timestamp}-createWallets.js` | Migración Sequelize para las 3 tablas                                                             |

### Backend - Archivos modificados

| File                                        | Description                                                                              |
| ------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `backend/src/models/index.ts`               | Exportar nuevos modelos                                                                  |
| `backend/src/services/CommissionService.ts` | Integrar llamada a WalletService.creditCommission() al aprobar                           |
| `backend/src/routes/index.ts`               | Incluir wallet.routes                                                                    |
| `backend/src/types/index.ts`                | Agregar tipos WalletAttributes, WalletTransactionAttributes, WithdrawalRequestAttributes |
| `backend/src/config/env.ts`                 | Agregar configuración: WALLET_MIN_WITHDRAWAL, WALLET_FEE_PERCENTAGE, WALLET_CRON_TIME    |

### Frontend - Nuevos archivos

| File                                                 | Description                           |
| ---------------------------------------------------- | ------------------------------------- |
| `frontend/src/stores/walletStore.ts`                 | Zustand store para estado del wallet  |
| `frontend/src/components/Wallet/WalletCard.tsx`      | Card mostrando balance actual         |
| `frontend/src/components/Wallet/TransactionList.tsx` | Lista de transacciones con filtros    |
| `frontend/src/components/Wallet/TransactionItem.tsx` | Item individual de transacción        |
| `frontend/src/components/Wallet/WithdrawalForm.tsx`  | Formulario de solicitud de retiro     |
| `frontend/src/components/Wallet/WithdrawalModal.tsx` | Modal de confirmación de retiro       |
| `frontend/src/components/Wallet/WalletSkeleton.tsx`  | Skeleton loader para estados de carga |

### Frontend - Archivos modificados

| File                               | Description                                 |
| ---------------------------------- | ------------------------------------------- |
| `frontend/src/pages/Dashboard.tsx` | Agregar WalletCard en la sección de summary |
| `frontend/src/App.tsx`             | Agregar rutas para /wallet                  |

## Interfaces / Contracts

### TypeScript Types (backend/src/types/index.ts)

```typescript
// Wallet
export interface WalletAttributes {
  id: string;
  userId: string;
  balance: number; // DECIMAL(10,2)
  currency: string; // Always USD
  createdAt?: Date;
  updatedAt?: Date;
}

// Wallet Transaction
export type WalletTransactionType = 'commission_earned' | 'withdrawal' | 'fee' | 'adjustment';

export interface WalletTransactionAttributes {
  id: string;
  walletId: string;
  type: WalletTransactionType;
  amount: number; // Positive for credit, negative for debit
  currency: string;
  referenceId: string | null; // commission_id or withdrawal_request_id
  description: string;
  exchangeRate: number | null; // Rate used if original currency != USD
  createdAt?: Date;
  updatedAt?: Date;
}

// Withdrawal Request
export type WithdrawalStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'paid'
  | 'failed'
  | 'cancelled';

export interface WithdrawalRequestAttributes {
  id: string;
  userId: string;
  requestedAmount: number;
  feeAmount: number;
  netAmount: number;
  status: WithdrawalStatus;
  rejectionReason: string | null;
  approvalComment: string | null;
  processedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}
```

### API Contracts

```typescript
// GET /api/wallets/:userId
interface GetWalletResponse {
  success: true;
  data: {
    id: string;
    userId: string;
    balance: number;
    currency: string;
    lastUpdated: string;
  };
}

// GET /api/wallets/:userId/transactions
interface GetTransactionsQuery {
  page?: number;
  limit?: number;
  type?: WalletTransactionType;
  startDate?: string;
  endDate?: string;
}

interface GetTransactionsResponse {
  success: true;
  data: WalletTransactionAttributes[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// POST /api/wallets/withdraw
interface CreateWithdrawalRequest {
  amount: number; // Must be >= 20 (configurable)
}

interface CreateWithdrawalResponse {
  success: true;
  data: WithdrawalRequestAttributes;
  message: string; // e.g. "Withdrawal request created. Fee: $X.XX USD"
}
```

## Testing Strategy

| Layer       | What to Test                                                                  | Approach                           |
| ----------- | ----------------------------------------------------------------------------- | ---------------------------------- |
| Unit        | WalletService.calculateFee(), validateSufficientBalance(), creditCommission() | Jest mocks de modelos Sequelize    |
| Unit        | currencyConverter con tasas existentes                                        | Tests unitarios de utilidad        |
| Integration | GET /wallets/:userId, POST /withdraw                                          | Tests de integración con supertest |
| Integration | Job diário procesa withdrawals                                                | Test de scheduler con mocks        |
| E2E         | Usuario aprueba comisión y ve balance actualizado                             | Playwright                         |
| E2E         | Usuario solicita retiro y ve historial                                        | Playwright                         |

**Archivos de test a crear:**

- `backend/src/__tests__/WalletService.test.ts`
- `backend/src/__tests__/integration/wallet.test.ts`

## Migration / Rollout

### Migración de datos

**Script de migración: `backend/src/database/migrations/{timestamp}-migrateHistoricalCommissions.ts`**

```typescript
// Pseudocode del script de migración
async function migrateHistoricalCommissions(): Promise<void> {
  // 1. Obtener todas las comisiones con status 'paid' o 'approved'
  const commissions = await Commission.findAll({
    where: { status: { [Op.in]: ['paid', 'approved'] } },
  });

  // 2. Por cada comisión, verificar si ya existe transaction
  for (const commission of commissions) {
    const existing = await WalletTransaction.findOne({
      where: { referenceId: commission.id, type: 'commission_earned' },
    });

    if (!existing) {
      // 3. Crear wallet transaction
      // 4. Obtener o crear wallet del usuario
      // 5. Actualizar balance
    }
  }

  // 6. Registrar log de migración con timestamp
}
```

**Rollback:**

```bash
# Revertir migraciones Sequelize
npx sequelize-cli migration:undo:all

# O manual:
# DELETE FROM wallet_transactions;
# DELETE FROM withdrawal_requests;
# DELETE FROM wallets;
```

### Feature Flags

No se requieren feature flags — es una feature nueva que no afecta funcionalidad existente.

### Phased Rollout

1. **Fase 1 (Database)**: Ejecutar migraciones y script de migración de comisiones históricas
2. **Fase 2 (Backend)**: Deploy nuevos endpoints y servicios, no afecta usuarios aún
3. **Fase 3 (Frontend)**: Activar UI del wallet para todos los usuarios

## Open Questions

- [ ] **Integración con procesador de pago**: El spec dice "Out of Scope" pero ¿tenemos algún processor mock para testing? ¿O solo actualizamos el status a "paid" sin integración real?
- [ ] **Exchange rate dinámico**: El currencyConverter usa tasas hardcodeadas. ¿Necesitamos integrado con API real (ExchangeRate-API, OpenExchangeRates)?
- [ ] **Scheduler en múltiples instancias**: Si el backend corre en múltiples contenedores, ¿necesitamos distributed lock para evitar doble procesamiento del job diário?
- [ ] **Configuración de fee**: ¿El fee percentage debe ser configurable por admin o hardcodeado? El spec dice "configurable" pero no hay requisito de UI para admin.

---

**Design created**: 2026-03-27
**Change**: wallet-digital
**Mode**: HYBRID (engram + openspec)
