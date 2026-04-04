# Tasks: Backend Controller Refactoring

## Overview

Refactoring de 7 controllers grandes en sub-controllers organizados por dominio. Cada fase es un commit atómico con tests verificados.

**Total controllers**: 7  
**Total sub-controllers**: 17  
**Estrategia**: Re-export pattern (barrel files)  
**Tests**: Jest + Supertest integration tests

---

## Phase 1: AuthController (261 líneas)

### Contexto
- **Archivo**: `backend/src/controllers/AuthController.ts` (261 líneas)
- **Complejidad**: Baja - Solo profile endpoints para extraer
- **Tests**: `backend/src/__tests__/integration/auth.test.ts`

### Tasks

#### 1.1 Crear estructura de directorio
- **Descripción**: Crear carpeta `controllers/auth/` y archivo base
- **Archivos afectados**:
  - `backend/src/controllers/auth/` (nuevo directorio)
  - `backend/src/controllers/auth/ProfileController.ts` (nuevo)
  - `backend/src/controllers/auth/index.ts` (nuevo)
- **Criterio de done**: Estructura de directorios creada

#### 1.2 Crear ProfileController
- **Descripción**: Extraer `me` endpoint (GET /api/auth/me) de AuthController
- **Archivos afectados**:
  - `backend/src/controllers/auth/ProfileController.ts` (nuevo)
- **Métodos a mover**:
  - `me` (líneas 221-261)
- **Criterio de done**: 
  - ProfileController.ts creado con función `me`
  - Imports y tipos preservados
  - Función exportada correctamente

#### 1.3 Crear barrel index.ts
- **Descripción**: Crear archivo barrel que re-exporta desde ProfileController
- **Archivos afectados**:
  - `backend/src/controllers/auth/index.ts` (nuevo)
- **Contenido**:
  ```typescript
  export { me } from './ProfileController';
  ```
- **Criterio de done**: Barrel file creado con re-export correcto

#### 1.4 Modificar AuthController como barrel
- **Descripción**: Convertir AuthController.ts en barrel que re-exporta desde auth/
- **Archivos afectados**:
  - `backend/src/controllers/AuthController.ts` (modificado)
- **Cambios**:
  - Mantener exports existentes (register, login, validations)
  - Agregar re-export de `me` desde `./auth/ProfileController`
  - Mantener imports de servicios y tipos
- **Criterio de done**:
  - AuthController.ts re-exporta `me` desde `./auth/ProfileController`
  - Todos los exports originales preservados
  - Imports de rutas siguen funcionando

#### 1.5 Verificar tests
- **Descripción**: Ejecutar tests de integración de auth
- **Archivos afectados**:
  - `backend/src/__tests__/integration/auth.test.ts`
- **Comando**: `npm test -- auth.test.ts`
- **Criterio de done**: 
  - Todos los tests pasan
  - No hay errores de importación
  - Endpoint `/api/auth/me` funciona correctamente

---

## Phase 2: CRMController (341 líneas)

### Contexto
- **Archivo**: `backend/src/controllers/CRMController.ts` (341 líneas)
- **Complejidad**: Media - 4 sub-controllers con diferentes dominios
- **Tests**: `backend/src/__tests__/integration/crm.test.ts`

### Tasks

#### 2.1 Crear estructura de directorio
- **Descripción**: Crear carpeta `controllers/crm/` y archivos base
- **Archivos afectados**:
  - `backend/src/controllers/crm/` (nuevo directorio)
  - `backend/src/controllers/crm/LeadController.ts` (nuevo)
  - `backend/src/controllers/crm/TaskController.ts` (nuevo)
  - `backend/src/controllers/crm/CommunicationController.ts` (nuevo)
  - `backend/src/controllers/crm/AnalyticsController.ts` (nuevo)
  - `backend/src/controllers/crm/index.ts` (nuevo)
- **Criterio de done**: Estructura de directorios creada

#### 2.2 Crear LeadController
- **Descripción**: Extraer endpoints de gestión de leads
- **Archivos afectados**:
  - `backend/src/controllers/crm/LeadController.ts` (nuevo)
- **Métodos a mover**:
  - `getLeads` (líneas 62-78)
  - `getLeadById` (líneas 88-97)
  - `createLead` (líneas 106-112)
  - `importLeads` (líneas 121-130)
  - `exportLeads` (líneas 136-155)
  - `updateLead` (líneas 165-174)
  - `deleteLead` (líneas 184-188)
  - `getCRMStats` (líneas 197-200)
  - Validaciones: `createLeadValidation`, `updateLeadValidation`
- **Criterio de done**: 
  - LeadController.ts creado con todos los endpoints de leads
  - Imports de `crmService` y tipos preservados
  - Validaciones exportadas correctamente

#### 2.3 Crear TaskController
- **Descripción**: Extraer endpoints de gestión de tareas
- **Archivos afectados**:
  - `backend/src/controllers/crm/TaskController.ts` (nuevo)
- **Métodos a mover**:
  - `createTask` (líneas 209-216)
  - `completeTask` (líneas 226-230)
  - `getLeadTasks` (líneas 267-270)
  - `getUpcomingTasks` (líneas 279-282)
  - Validaciones: `createTaskValidation`
- **Criterio de done**: 
  - TaskController.ts creado con todos los endpoints de tareas
  - Imports preservados

#### 2.4 Crear CommunicationController
- **Descripción**: Extraer endpoints de comunicación
- **Archivos afectados**:
  - `backend/src/controllers/crm/CommunicationController.ts` (nuevo)
- **Métodos a mover**:
  - `addCommunication` (líneas 239-246)
  - `getLeadCommunications` (líneas 255-258)
- **Criterio de done**: 
  - CommunicationController.ts creado con endpoints de comunicación
  - Imports preservados

#### 2.5 Crear AnalyticsController
- **Descripción**: Extraer endpoints de analítica
- **Archivos afectados**:
  - `backend/src/controllers/crm/AnalyticsController.ts` (nuevo)
- **Métodos a mover**:
  - `getAnalyticsReport` (líneas 291-302)
  - `exportAnalyticsReport` (líneas 324-341)
  - `getCRMAlerts` (líneas 311-315)
- **Criterio de done**: 
  - AnalyticsController.ts creado con endpoints de analítica
  - Imports preservados

#### 2.6 Crear barrel index.ts
- **Descripción**: Crear archivo barrel que re-exporta todos los sub-controllers
- **Archivos afectados**:
  - `backend/src/controllers/crm/index.ts` (nuevo)
- **Contenido**:
  ```typescript
  export { getLeads, getLeadById, createLead, importLeads, exportLeads, updateLead, deleteLead, getCRMStats, createLeadValidation, updateLeadValidation } from './LeadController';
  export { createTask, completeTask, getLeadTasks, getUpcomingTasks, createTaskValidation } from './TaskController';
  export { addCommunication, getLeadCommunications } from './CommunicationController';
  export { getAnalyticsReport, exportAnalyticsReport, getCRMAlerts } from './AnalyticsController';
  ```
- **Criterio de done**: Barrel file creado con re-exports correctos

#### 2.7 Modificar CRMController como barrel
- **Descripción**: Convertir CRMController.ts en barrel que re-exporta desde crm/
- **Archivos afectados**:
  - `backend/src/controllers/CRMController.ts` (modificado)
- **Cambios**:
  - Reemplazar todo el contenido con re-exports desde `./crm/`
  - Mantener imports de servicios y tipos si es necesario
- **Criterio de done**:
  - CRMController.ts re-exporta todo desde `./crm/`
  - Imports de rutas siguen funcionando
  - No hay imports circulares

#### 2.8 Verificar tests
- **Descripción**: Ejecutar tests de integración de CRM
- **Archivos afectados**:
  - `backend/src/__tests__/integration/crm.test.ts`
- **Comando**: `npm test -- crm.test.ts`
- **Criterio de done**: 
  - Todos los tests pasan
  - Endpoints de leads, tasks, communications y analytics funcionan

---

## Phase 3: CommissionConfigController (351 líneas)

### Contexto
- **Archivo**: `backend/src/controllers/CommissionConfigController.ts` (351 líneas)
- **Complejidad**: Baja - CRUD + rates endpoint
- **Tests**: `backend/src/__tests__/integration/commissions.test.ts`

### Tasks

#### 3.1 Crear estructura de directorio
- **Descripción**: Crear carpeta `controllers/commissions/` y archivos base
- **Archivos afectados**:
  - `backend/src/controllers/commissions/` (nuevo directorio)
  - `backend/src/controllers/commissions/ConfigController.ts` (nuevo)
  - `backend/src/controllers/commissions/RatesController.ts` (nuevo)
  - `backend/src/controllers/commissions/index.ts` (nuevo)
- **Criterio de done**: Estructura de directorios creada

#### 3.2 Crear ConfigController
- **Descripción**: Extraer endpoints CRUD de configuraciones
- **Archivos afectados**:
  - `backend/src/controllers/commissions/ConfigController.ts` (nuevo)
- **Métodos a mover**:
  - `getAllConfigs` (líneas 23-49)
  - `getConfigById` (líneas 55-90)
  - `createConfig` (líneas 96-183)
  - `updateConfig` (líneas 189-251)
  - `deleteConfig` (líneas 257-294)
- **Criterio de done**: 
  - ConfigController.ts creado con CRUD completo
  - Imports de `CommissionConfig` y tipos preservados
  - Validaciones de business type y level preservadas

#### 3.3 Crear RatesController
- **Descripción**: Extraer endpoint de tasas activas
- **Archivos afectados**:
  - `backend/src/controllers/commissions/RatesController.ts` (nuevo)
- **Métodos a mover**:
  - `getActiveRates` (líneas 300-351)
- **Criterio de done**: 
  - RatesController.ts creado con endpoint de tasas
  - Import dinámico de `COMMISSION_RATES` preservado

#### 3.4 Crear barrel index.ts
- **Descripción**: Crear archivo barrel que re-exporta sub-controllers
- **Archivos afectados**:
  - `backend/src/controllers/commissions/index.ts` (nuevo)
- **Contenido**:
  ```typescript
  export { getAllConfigs, getConfigById, createConfig, updateConfig, deleteConfig } from './ConfigController';
  export { getActiveRates } from './RatesController';
  ```
- **Criterio de done**: Barrel file creado con re-exports correctos

#### 3.5 Modificar CommissionConfigController como barrel
- **Descripción**: Convertir CommissionConfigController.ts en barrel
- **Archivos afectados**:
  - `backend/src/controllers/CommissionConfigController.ts` (modificado)
- **Cambios**:
  - Reemplazar contenido con re-exports desde `./commissions/`
- **Criterio de done**:
  - CommissionConfigController.ts re-exporta todo desde `./commissions/`
  - Imports de rutas siguen funcionando

#### 3.6 Verificar tests
- **Descripción**: Ejecutar tests de integración de comisiones
- **Archivos afectados**:
  - `backend/src/__tests__/integration/commissions.test.ts`
- **Comando**: `npm test -- commissions.test.ts`
- **Criterio de done**: 
  - Todos los tests pasan
  - CRUD de configs y rates endpoint funcionan

---

## Phase 4: AdminController (395 líneas)

### Contexto
- **Archivo**: `backend/src/controllers/AdminController.ts` (395 líneas)
- **Complejidad**: Media - Stats + Users management
- **Tests**: `backend/src/__tests__/integration/rbac.test.ts` (admin tests)

### Tasks

#### 4.1 Crear estructura de directorio
- **Descripción**: Crear carpeta `controllers/admin/` y archivos base
- **Archivos afectados**:
  - `backend/src/controllers/admin/` (nuevo directorio)
  - `backend/src/controllers/admin/StatsController.ts` (nuevo)
  - `backend/src/controllers/admin/UsersAdminController.ts` (nuevo)
  - `backend/src/controllers/admin/index.ts` (nuevo)
- **Criterio de done**: Estructura de directorios creada

#### 4.2 Crear StatsController
- **Descripción**: Extraer endpoints de estadísticas
- **Archivos afectados**:
  - `backend/src/controllers/admin/StatsController.ts` (nuevo)
- **Métodos a mover**:
  - `getGlobalStats` (líneas 29-101)
  - `getCommissionsReport` (líneas 293-351)
- **Criterio de done**: 
  - StatsController.ts creado con endpoints de estadísticas
  - Imports de modelos y servicios preservados
  - Lógica de agregación de stats preservada

#### 4.3 Crear UsersAdminController
- **Descripción**: Extraer endpoints de gestión de usuarios
- **Archivos afectados**:
  - `backend/src/controllers/admin/UsersAdminController.ts` (nuevo)
- **Métodos a mover**:
  - `getAllUsers` (líneas 110-169)
  - `getUserById` (líneas 178-240)
  - `updateUserStatus` (líneas 249-284)
  - `promoteToAdmin` (líneas 360-395)
- **Criterio de done**: 
  - UsersAdminController.ts creado con endpoints de usuarios
  - Imports de modelos y servicios preservados
  - Lógica de permisos preservada

#### 4.4 Crear barrel index.ts
- **Descripción**: Crear archivo barrel que re-exporta sub-controllers
- **Archivos afectados**:
  - `backend/src/controllers/admin/index.ts` (nuevo)
- **Contenido**:
  ```typescript
  export { getGlobalStats, getCommissionsReport } from './StatsController';
  export { getAllUsers, getUserById, updateUserStatus, promoteToAdmin } from './UsersAdminController';
  ```
- **Criterio de done**: Barrel file creado con re-exports correctos

#### 4.5 Modificar AdminController como barrel
- **Descripción**: Convertir AdminController.ts en barrel
- **Archivos afectados**:
  - `backend/src/controllers/AdminController.ts` (modificado)
- **Cambios**:
  - Reemplazar contenido con re-exports desde `./admin/`
  - Mantener imports de servicios (`UserService`, `TreeService`) si se usan
- **Criterio de done**:
  - AdminController.ts re-exporta todo desde `./admin/`
  - Imports de rutas siguen funcionando
  - Servicios instanciados correctamente

#### 4.6 Verificar tests
- **Descripción**: Ejecutar tests de integración de admin/RBAC
- **Archivos afectados**:
  - `backend/src/__tests__/integration/rbac.test.ts`
- **Comando**: `npm test -- rbac.test.ts`
- **Criterio de done**: 
  - Todos los tests pasan
  - Endpoints de stats y user management funcionan
  - Permisos de admin verificados

---

## Phase 5: WalletController (423 líneas)

### Contexto
- **Archivo**: `backend/src/controllers/WalletController.ts` (423 líneas)
- **Complejidad**: Alta - Balance + Transactions + Withdrawals
- **Tests**: `backend/src/__tests__/integration/wallet.test.ts`

### Tasks

#### 5.1 Crear estructura de directorio
- **Descripción**: Crear carpeta `controllers/wallet/` y archivos base
- **Archivos afectados**:
  - `backend/src/controllers/wallet/` (nuevo directorio)
  - `backend/src/controllers/wallet/BalanceController.ts` (nuevo)
  - `backend/src/controllers/wallet/TransactionController.ts` (nuevo)
  - `backend/src/controllers/wallet/WithdrawalController.ts` (nuevo)
  - `backend/src/controllers/wallet/index.ts` (nuevo)
- **Criterio de done**: Estructura de directorios creada

#### 5.2 Crear BalanceController
- **Descripción**: Extraer endpoints de balance y crypto prices
- **Archivos afectados**:
  - `backend/src/controllers/wallet/BalanceController.ts` (nuevo)
- **Métodos a mover**:
  - `getBalance` (líneas 21-109)
  - `getCryptoPrices` (líneas 383-423)
- **Criterio de done**: 
  - BalanceController.ts creado con endpoints de balance
  - Imports de `walletService` y `getCryptoPrices` preservados
  - Lógica de auto-creación de wallet preservada

#### 5.3 Crear TransactionController
- **Descripción**: Extraer endpoint de transacciones
- **Archivos afectados**:
  - `backend/src/controllers/wallet/TransactionController.ts` (nuevo)
- **Métodos a mover**:
  - `getTransactions` (líneas 118-172)
- **Criterio de done**: 
  - TransactionController.ts creado con endpoint de transacciones
  - Paginación y filtros preservados

#### 5.4 Crear WithdrawalController
- **Descripción**: Extraer endpoints de retiros
- **Archivos afectados**:
  - `backend/src/controllers/wallet/WithdrawalController.ts` (nuevo)
- **Métodos a mover**:
  - `createWithdrawal` (líneas 181-239)
  - `getWithdrawalStatus` (líneas 248-319)
  - `cancelWithdrawal` (líneas 328-374)
- **Criterio de done**: 
  - WithdrawalController.ts creado con endpoints de retiros
  - Validaciones de monto preservadas
  - Lógica de ownership preservada

#### 5.5 Crear barrel index.ts
- **Descripción**: Crear archivo barrel que re-exporta sub-controllers
- **Archivos afectados**:
  - `backend/src/controllers/wallet/index.ts` (nuevo)
- **Contenido**:
  ```typescript
  export { getBalance, getCryptoPrices } from './BalanceController';
  export { getTransactions } from './TransactionController';
  export { createWithdrawal, getWithdrawalStatus, cancelWithdrawal } from './WithdrawalController';
  ```
- **Criterio de done**: Barrel file creado con re-exports correctos

#### 5.6 Modificar WalletController como barrel
- **Descripción**: Convertir WalletController.ts en barrel
- **Archivos afectados**:
  - `backend/src/controllers/WalletController.ts` (modificado)
- **Cambios**:
  - Reemplazar contenido con re-exports desde `./wallet/`
- **Criterio de done**:
  - WalletController.ts re-exporta todo desde `./wallet/`
  - Imports de rutas siguen funcionando

#### 5.7 Verificar tests
- **Descripción**: Ejecutar tests de integración de wallet
- **Archivos afectados**:
  - `backend/src/__tests__/integration/wallet.test.ts`
- **Comando**: `npm test -- wallet.test.ts`
- **Criterio de done**: 
  - Todos los tests pasan
  - Endpoints de balance, transactions y withdrawals funcionan
  - Crypto prices endpoint funciona

---

## Phase 6: OrderController (426 líneas)

### Contexto
- **Archivo**: `backend/src/controllers/OrderController.ts` (426 líneas)
- **Complejidad**: Media - Checkout + History
- **Tests**: `backend/src/__tests__/integration/products-orders.test.ts`

### Tasks

#### 6.1 Crear estructura de directorio
- **Descripción**: Crear carpeta `controllers/orders/` y archivos base
- **Archivos afectados**:
  - `backend/src/controllers/orders/` (nuevo directorio)
  - `backend/src/controllers/orders/CheckoutController.ts` (nuevo)
  - `backend/src/controllers/orders/OrderHistoryController.ts` (nuevo)
  - `backend/src/controllers/orders/index.ts` (nuevo)
- **Criterio de done**: Estructura de directorios creada

#### 6.2 Crear CheckoutController
- **Descripción**: Extraer endpoint de creación de órdenes
- **Archivos afectados**:
  - `backend/src/controllers/orders/CheckoutController.ts` (nuevo)
- **Métodos a mover**:
  - `createOrder` (líneas 76-175)
- **Criterio de done**: 
  - CheckoutController.ts creado con endpoint de checkout
  - Imports de `orderService` preservados
  - Validaciones de UUID y autenticación preservadas
  - Logging de debug preservado

#### 6.3 Crear OrderHistoryController
- **Descripción**: Extraer endpoints de historial de órdenes
- **Archivos afectados**:
  - `backend/src/controllers/orders/OrderHistoryController.ts` (nuevo)
- **Métodos a mover**:
  - `getOrders` (líneas 221-281)
  - `getOrderById` (líneas 319-426)
- **Criterio de done**: 
  - OrderHistoryController.ts creado con endpoints de historial
  - Paginación y filtros preservados
  - Lógica de ownership preservada
  - Inclusión de detalles de producto preservada

#### 6.4 Crear barrel index.ts
- **Descripción**: Crear archivo barrel que re-exporta sub-controllers
- **Archivos afectados**:
  - `backend/src/controllers/orders/index.ts` (nuevo)
- **Contenido**:
  ```typescript
  export { createOrder } from './CheckoutController';
  export { getOrders, getOrderById } from './OrderHistoryController';
  ```
- **Criterio de done**: Barrel file creado con re-exports correctos

#### 6.5 Modificar OrderController como barrel
- **Descripción**: Convertir OrderController.ts en barrel
- **Archivos afectados**:
  - `backend/src/controllers/OrderController.ts` (modificado)
- **Cambios**:
  - Reemplazar contenido con re-exports desde `./orders/`
- **Criterio de done**:
  - OrderController.ts re-exporta todo desde `./orders/`
  - Imports de rutas siguen funcionando

#### 6.6 Verificar tests
- **Descripción**: Ejecutar tests de integración de orders
- **Archivos afectados**:
  - `backend/src/__tests__/integration/products-orders.test.ts`
- **Comando**: `npm test -- products-orders.test.ts`
- **Criterio de done**: 
  - Todos los tests pasan
  - Endpoints de checkout e historial funcionan

---

## Phase 7: UserController (427 líneas)

### Contexto
- **Archivo**: `backend/src/controllers/UserController.ts` (427 líneas)
- **Complejidad**: Alta - Profile + Tree + QR + Search
- **Tests**: `backend/src/__tests__/integration/tree.test.ts`, `tree-visual.test.ts`

### Tasks

#### 7.1 Crear estructura de directorio
- **Descripción**: Crear carpeta `controllers/users/` y archivos base
- **Archivos afectados**:
  - `backend/src/controllers/users/` (nuevo directorio)
  - `backend/src/controllers/users/ProfileController.ts` (nuevo)
  - `backend/src/controllers/users/TreeController.ts` (nuevo)
  - `backend/src/controllers/users/QRController.ts` (nuevo)
  - `backend/src/controllers/users/index.ts` (nuevo)
- **Criterio de done**: Estructura de directorios creada

#### 7.2 Crear ProfileController
- **Descripción**: Extraer endpoints de perfil de usuario
- **Archivos afectados**:
  - `backend/src/controllers/users/ProfileController.ts` (nuevo)
- **Métodos a mover**:
  - `getMe` (líneas 58-91)
  - `updateProfile` (líneas 232-243)
  - `changePassword` (líneas 253-272)
  - `deleteAccount` (líneas 282-304)
  - Validaciones: `updateProfileValidation`, `changePasswordValidation`, `deleteAccountValidation`
- **Criterio de done**: 
  - ProfileController.ts creado con endpoints de perfil
  - Imports de `userService`, `hashPassword`, `verifyPassword` preservados
  - Validaciones exportadas correctamente

#### 7.3 Crear TreeController
- **Descripción**: Extraer endpoints de árbol binario
- **Archivos afectados**:
  - `backend/src/controllers/users/TreeController.ts` (nuevo)
- **Métodos a mover**:
  - `getTree` (líneas 110-159)
  - `searchUsers` (líneas 345-364)
  - `getUserDetails` (líneas 401-427)
- **Criterio de done**: 
  - TreeController.ts creado con endpoints de árbol
  - Imports de `treeServiceInstance` preservados
  - Paginación y búsqueda preservadas
  - Lógica de verificación de ancestros preservada

#### 7.4 Crear QRController
- **Descripción**: Extraer endpoints de códigos QR
- **Archivos afectados**:
  - `backend/src/controllers/users/QRController.ts` (nuevo)
- **Métodos a mover**:
  - `getQR` (líneas 168-185)
  - `getQRUrl` (líneas 194-223)
- **Criterio de done**: 
  - QRController.ts creado con endpoints de QR
  - Imports de `QRService` preservados
  - Respuestas PNG y JSON preservadas

#### 7.5 Crear barrel index.ts
- **Descripción**: Crear archivo barrel que re-exporta sub-controllers
- **Archivos afectados**:
  - `backend/src/controllers/users/index.ts` (nuevo)
- **Contenido**:
  ```typescript
  export { getMe, updateProfile, changePassword, deleteAccount, updateProfileValidation, changePasswordValidation, deleteAccountValidation } from './ProfileController';
  export { getTree, searchUsers, getUserDetails } from './TreeController';
  export { getQR, getQRUrl } from './QRController';
  ```
- **Criterio de done**: Barrel file creado con re-exports correctos

#### 7.6 Modificar UserController como barrel
- **Descripción**: Convertir UserController.ts en barrel
- **Archivos afectados**:
  - `backend/src/controllers/UserController.ts` (modificado)
- **Cambios**:
  - Reemplazar contenido con re-exports desde `./users/`
- **Criterio de done**:
  - UserController.ts re-exporta todo desde `./users/`
  - Imports de rutas siguen funcionando

#### 7.7 Verificar tests
- **Descripción**: Ejecutar tests de integración de users y tree
- **Archivos afectados**:
  - `backend/src/__tests__/integration/tree.test.ts`
  - `backend/src/__tests__/integration/tree-visual.test.ts`
- **Comando**: `npm test -- tree` (ejecuta ambos)
- **Criterio de done**: 
  - Todos los tests pasan
  - Endpoints de perfil, árbol, QR y búsqueda funcionan

---

## Phase 8: TwoFactorController (432 líneas)

### Contexto
- **Archivo**: `backend/src/controllers/TwoFactorController.ts` (432 líneas)
- **Complejidad**: Alta - Lógica de 2FA con estado en memoria
- **Tests**: `backend/src/__tests__/integration/two-factor.test.ts`

### Tasks

#### 8.1 Crear estructura de directorio
- **Descripción**: Crear carpeta `controllers/two-factor/` y archivos base
- **Archivos afectados**:
  - `backend/src/controllers/two-factor/` (nuevo directorio)
  - `backend/src/controllers/two-factor/TOTPController.ts` (nuevo)
  - `backend/src/controllers/two-factor/index.ts` (nuevo)
- **Criterio de done**: Estructura de directorios creada

#### 8.2 Crear TOTPController
- **Descripción**: Extraer todos los endpoints de 2FA TOTP
- **Archivos afectados**:
  - `backend/src/controllers/two-factor/TOTPController.ts` (nuevo)
- **Métodos a mover**:
  - `get2FAStatus` (líneas 67-96)
  - `setup2FA` (líneas 105-150)
  - `verifySetup` (líneas 159-232)
  - `verify2FA` (líneas 241-325)
  - `disable2FA` (líneas 334-424)
- **Constantes a mover**:
  - `MAX_FAILED_ATTEMPTS`
  - `LOCKOUT_DURATION_MINUTES`
  - `SETUP_EXPIRY_MINUTES`
- **Estado en memoria a mover**:
  - `pendingSetups` Map
- **Validaciones a mover**:
  - `setup2FAValidation`
  - `verify2FAValidation`
  - `disable2FAValidation`
- **Criterio de done**: 
  - TOTPController.ts creado con toda la lógica 2FA
  - Imports de `TwoFactorService` y `User` modelo preservados
  - Estado en memoria preservado
  - Lógica de lockout preservada

#### 8.3 Crear barrel index.ts
- **Descripción**: Crear archivo barrel que re-exporta sub-controllers
- **Archivos afectados**:
  - `backend/src/controllers/two-factor/index.ts` (nuevo)
- **Contenido**:
  ```typescript
  export { get2FAStatus, setup2FA, verifySetup, verify2FA, disable2FA, setup2FAValidation, verify2FAValidation, disable2FAValidation } from './TOTPController';
  export { default } from './TOTPController';
  ```
- **Criterio de done**: Barrel file creado con re-exports correctos

#### 8.4 Modificar TwoFactorController como barrel
- **Descripción**: Convertir TwoFactorController.ts en barrel
- **Archivos afectados**:
  - `backend/src/controllers/TwoFactorController.ts` (modificado)
- **Cambios**:
  - Reemplazar contenido con re-exports desde `./two-factor/`
  - Preservar export default si se usa
- **Criterio de done**:
  - TwoFactorController.ts re-exporta todo desde `./two-factor/`
  - Imports de rutas siguen funcionando
  - Export default preservado

#### 8.5 Verificar tests
- **Descripción**: Ejecutar tests de integración de 2FA
- **Archivos afectados**:
  - `backend/src/__tests__/integration/two-factor.test.ts`
- **Comando**: `npm test -- two-factor.test.ts`
- **Criterio de done**: 
  - Todos los tests pasan
  - Setup, verify, disable 2FA funcionan
  - Lockout mechanism funciona

---

## Phase 9: Integration & Verification

### Contexto
Verificación final de que toda la refactorización funciona correctamente.

### Tasks

#### 9.1 Ejecutar todos los tests de integración
- **Descripción**: Ejecutar suite completa de tests
- **Comando**: `npm test -- --testPathPattern=integration`
- **Criterio de done**: 
  - Todos los tests de integración pasan
  - No hay errores de importación
  - No hay tests fallando

#### 9.2 Verificar compilación TypeScript
- **Descripción**: Ejecutar compilación TypeScript sin errores
- **Comando**: `npx tsc --noEmit`
- **Criterio de done**: 
  - No hay errores de TypeScript
  - Todos los tipos son válidos
  - No hay imports circulares

#### 9.3 Verificar rutas
- **Descripción**: Verificar que todas las rutas sigan funcionando
- **Archivos afectados**:
  - `backend/src/routes/*.routes.ts`
- **Verificaciones**:
  - Imports desde controllers siguen funcionando
  - No hay imports rotos
  - Todas las rutas responden
- **Criterio de done**: 
  - Todas las rutas funcionan
  - No hay 404s inesperados
  - Responses correctas

#### 9.4 Ejecutar build completo
- **Descripción**: Ejecutar build de producción
- **Comando**: `npm run build`
- **Criterio de done**: 
  - Build exitoso
  - No hay errores de compilación
  - Output de dist/ generado correctamente

#### 9.5 Verificar estructura de directorios
- **Descripción**: Verificar que la estructura final es correcta
- **Estructura esperada**:
  ```
  backend/src/controllers/
  ├── auth/
  │   ├── ProfileController.ts
  │   └── index.ts
  ├── crm/
  │   ├── LeadController.ts
  │   ├── TaskController.ts
  │   ├── CommunicationController.ts
  │   ├── AnalyticsController.ts
  │   └── index.ts
  ├── commissions/
  │   ├── ConfigController.ts
  │   ├── RatesController.ts
  │   └── index.ts
  ├── admin/
  │   ├── StatsController.ts
  │   ├── UsersAdminController.ts
  │   └── index.ts
  ├── wallet/
  │   ├── BalanceController.ts
  │   ├── TransactionController.ts
  │   ├── WithdrawalController.ts
  │   └── index.ts
  ├── orders/
  │   ├── CheckoutController.ts
  │   ├── OrderHistoryController.ts
  │   └── index.ts
  ├── users/
  │   ├── ProfileController.ts
  │   ├── TreeController.ts
  │   ├── QRController.ts
  │   └── index.ts
  ├── two-factor/
  │   ├── TOTPController.ts
  │   └── index.ts
  ├── AuthController.ts (barrel)
  ├── CRMController.ts (barrel)
  ├── CommissionConfigController.ts (barrel)
  ├── AdminController.ts (barrel)
  ├── WalletController.ts (barrel)
  ├── OrderController.ts (barrel)
  ├── UserController.ts (barrel)
  ├── TwoFactorController.ts (barrel)
  └── [other controllers unchanged]
  ```
- **Criterio de done**: 
  - Estructura de directorios correcta
  - Todos los barrel files presentes
  - Archivos originales convertidos a barrels

---

## Summary

| Phase | Controller | Sub-Controllers | Lines | Status |
|-------|-----------|-----------------|-------|--------|
| 1 | AuthController | 1 | 261 | 🔲 |
| 2 | CRMController | 4 | 341 | 🔲 |
| 3 | CommissionConfigController | 2 | 351 | 🔲 |
| 4 | AdminController | 2 | 395 | 🔲 |
| 5 | WalletController | 3 | 423 | 🔲 |
| 6 | OrderController | 2 | 426 | 🔲 |
| 7 | UserController | 3 | 427 | 🔲 |
| 8 | TwoFactorController | 1 | 432 | 🔲 |
| 9 | Verification | - | - | 🔲 |

**Total**: 8 controllers → 17 sub-controllers + 9 verification tasks

## Git Strategy

- **Un commit por fase**: Cada fase es un commit atómico
- **Branch**: `refactor/backend-controllers`
- **Revert plan**: Si alguna fase falla, `git revert` del commit específico
- **No squash**: Mantener historial de refactorización

## Rollback Plan

Si alguna fase rompe tests:
1. `git revert HEAD` (revierte el commit problemático)
2. Revisar imports y dependencias
3. Corregir y re-commitear
4. Continuar con la siguiente fase

## Dependencies

- Ninguna dependencia externa nueva
- Todos los servicios, modelos y middleware permanecen sin cambios
- Rutas no cambian en esta fase (barrel re-exports mantienen compatibilidad)

## Success Criteria

- [ ] 7 controllers refactorizados en 17 sub-controllers
- [ ] Todos los tests de integración pasan
- [ ] No hay cambios en API pública o rutas
- [ ] Cada split es un commit atómico
- [ ] No se introducen nuevas dependencias
- [ ] TypeScript compila sin errores
- [ ] Build de producción exitoso
