# Database Models / Modelos de Base de Datos

## Español

Esta guía documenta los modelos de Sequelize utilizados en la plataforma MLM.

---

## English

This guide documents the Sequelize models used in the MLM platform.

---

## User Model / Modelo de Usuario

```typescript
// src/models/User.ts

/**
 * User model / Modelo de Usuario
 * Represents a platform user with affiliate and binary tree data
 * Representa un usuario de la plataforma con datos de afiliado y árbol binario
 */
```

### Fields / Campos

| Field          | Type         | Description / Descripción                              |
| -------------- | ------------ | ------------------------------------------------------ |
| `id`           | VARCHAR(36)  | UUID primary key / UUID clave primaria                 |
| `email`        | VARCHAR(255) | Unique email / Email único                             |
| `passwordHash` | VARCHAR(255) | Bcrypt hashed password / Contraseña hasheada           |
| `referralCode` | VARCHAR(15)  | Unique referral code / Código de referido único        |
| `sponsorId`    | VARCHAR(36)  | Sponsor's user ID / ID del patrocinador                |
| `position`     | ENUM         | 'left' or 'right' position in tree / Posición en árbol |
| `level`        | INT          | Tree level (default 1) / Nivel en árbol                |
| `status`       | ENUM         | 'active', 'inactive', 'suspended'                      |
| `role`         | ENUM         | 'user', 'admin'                                        |
| `currency`     | VARCHAR(3)   | User's preferred currency / Moneda preferida           |
| `createdAt`    | TIMESTAMP    | Creation date / Fecha de creación                      |
| `updatedAt`    | TIMESTAMP    | Last update / Última actualización                     |

### Relationships / Relaciones

- `belongsTo`: Sponsor (sponsorId)
- `hasMany`: Referrals (sponsorId → users)
- `hasMany`: Purchases
- `hasMany`: Commissions (received)
- `hasMany`: Leads

---

## UserClosure Model / Modelo de Cierre de Usuario

```typescript
// src/models/UserClosure.ts

/**
 * User Closure model / Modelo de Cierre de Usuario
 * Implements materialized path for efficient tree queries
 * Implementa ruta materializada para consultas eficientes de árbol
 */
```

### Purpose / Propósito

The `user_closure` table stores all ancestor-descendant relationships for the binary tree, enabling:

- Efficient tree traversal / Recorrido eficiente del árbol
- Commission distribution to ancestors / Distribución de comisiones a ancestros
- Tree statistics queries / Consultas de estadísticas del árbol

### Fields / Campos

| Field          | Type        | Description / Descripción                            |
| -------------- | ----------- | ---------------------------------------------------- |
| `ancestorId`   | VARCHAR(36) | Ancestor user ID / ID del usuario ancestro           |
| `descendantId` | VARCHAR(36) | Descendant user ID / ID del usuario descendiente     |
| `depth`        | INT         | Distance between ancestor and descendant / Distancia |

### Example Data / Datos de Ejemplo

```
ancestor_id | descendant_id | depth
------------|---------------|-------
user_a      | user_a        | 0      (self-reference)
user_a      | user_b        | 1      (direct child)
user_a      | user_c        | 2      (grandchild)
user_b      | user_c        | 1      (user_b's child)
```

---

## Commission Model / Modelo de Comisión

```typescript
// src/models/Commission.ts

/**
 * Commission model / Modelo de Comisión
 * Stores commission records for users
 * Almacena registros de comisiones para usuarios
 */
```

### Fields / Campos

| Field        | Type          | Description / Descripción                            |
| ------------ | ------------- | ---------------------------------------------------- |
| `id`         | VARCHAR(36)   | UUID primary key                                     |
| `userId`     | VARCHAR(36)   | User who receives commission / Usuario que recibe    |
| `fromUserId` | VARCHAR(36)   | User who triggered commission / Usuario que originó  |
| `purchaseId` | VARCHAR(36)   | Related purchase / Compra relacionada                |
| `type`       | ENUM          | 'direct', 'level_1', 'level_2', 'level_3', 'level_4' |
| `amount`     | DECIMAL(15,2) | Commission amount / Monto de comisión                |
| `status`     | ENUM          | 'pending', 'approved', 'paid', 'rejected'            |
| `createdAt`  | TIMESTAMP     | Creation date                                        |

### Commission Types / Tipos de Comisión

| Type    | Percentage | When Applied                          |
| ------- | ---------- | ------------------------------------- |
| direct  | 10%        | User's direct referral makes purchase |
| level_1 | 5%         | First level ancestor                  |
| level_2 | 3%         | Second level ancestor                 |
| level_3 | 2%         | Third level ancestor                  |
| level_4 | 1%         | Fourth level ancestor                 |

---

## Purchase Model / Modelo de Compra

```typescript
// src/models/Purchase.ts

/**
 * Purchase model / Modelo de Compra
 * Stores purchase records that trigger commission distribution
 * Almacena registros de compras que disparan distribución de comisiones
 */
```

### Fields / Campos

| Field         | Type          | Description / Descripción           |
| ------------- | ------------- | ----------------------------------- |
| `id`          | VARCHAR(36)   | UUID primary key                    |
| `userId`      | VARCHAR(36)   | User who made purchase              |
| `amount`      | DECIMAL(15,2) | Purchase amount                     |
| `currency`    | VARCHAR(3)    | Currency code (USD, COP, MXN)       |
| `description` | TEXT          | Purchase description                |
| `status`      | ENUM          | 'pending', 'completed', 'cancelled' |
| `createdAt`   | TIMESTAMP     | Purchase date                       |

---

## Lead Model / Modelo de Lead

```typescript
// src/models/Lead.ts

/**
 * Lead model / Modelo de Lead
 * CRM leads for sales pipeline management
 * Leads de CRM para gestión de pipeline de ventas
 */
```

### Fields / Campos

| Field          | Type          | Description / Descripción                                                 |
| -------------- | ------------- | ------------------------------------------------------------------------- |
| `id`           | VARCHAR(36)   | UUID primary key                                                          |
| `userId`       | VARCHAR(36)   | Assigned user / Usuario asignado                                          |
| `contactName`  | VARCHAR(255)  | Contact full name                                                         |
| `contactEmail` | VARCHAR(255)  | Contact email                                                             |
| `contactPhone` | VARCHAR(50)   | Contact phone                                                             |
| `company`      | VARCHAR(255)  | Company name                                                              |
| `status`       | ENUM          | 'new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost' |
| `source`       | ENUM          | 'website', 'referral', 'social', 'landing_page', 'manual', 'other'        |
| `value`        | DECIMAL(15,2) | Estimated lead value                                                      |
| `currency`     | VARCHAR(3)    | Currency                                                                  |
| `notes`        | TEXT          | Additional notes                                                          |
| `metadata`     | JSON          | Extra data                                                                |

---

## Task Model / Modelo de Tarea

```typescript
// src/models/Task.ts

/**
 * Task model / Modelo de Tarea
 * CRM tasks associated with leads
 * Tareas de CRM asociadas a leads
 */
```

### Fields / Campos

| Field         | Type         | Description / Descripción |
| ------------- | ------------ | ------------------------- |
| `id`          | VARCHAR(36)  | UUID primary key          |
| `leadId`      | VARCHAR(36)  | Related lead              |
| `userId`      | VARCHAR(36)  | Assigned user             |
| `title`       | VARCHAR(255) | Task title                |
| `description` | TEXT         | Task description          |
| `dueDate`     | DATE         | Due date                  |
| `priority`    | ENUM         | 'low', 'medium', 'high'   |
| `status`      | ENUM         | 'pending', 'completed'    |
| `completedAt` | TIMESTAMP    | Completion date           |

---

## Communication Model / Modelo de Comunicación

```typescript
// src/models/Communication.ts

/**
 * Communication model / Modelo de Comunicación
 * CRM communications with leads
 * Comunicaciones de CRM con leads
 */
```

### Fields / Campos

| Field       | Type         | Description / Descripción          |
| ----------- | ------------ | ---------------------------------- |
| `id`        | VARCHAR(36)  | UUID primary key                   |
| `leadId`    | VARCHAR(36)  | Related lead                       |
| `userId`    | VARCHAR(36)  | User who made communication        |
| `type`      | ENUM         | 'call', 'email', 'meeting', 'note' |
| `subject`   | VARCHAR(255) | Communication subject              |
| `notes`     | TEXT         | Communication notes                |
| `createdAt` | TIMESTAMP    | Communication date                 |

---

## LandingPage Model / Modelo de Página de Aterrizaje

```typescript
// src/models/LandingPage.ts

/**
 * LandingPage model / Modelo de Página de Aterrizaje
 * SEO-optimized landing pages for marketing campaigns
 * Páginas de aterrizaje optimizadas para SEO
 */
```

### Fields / Campos

| Field             | Type         | Description / Descripción        |
| ----------------- | ------------ | -------------------------------- |
| `id`              | VARCHAR(36)  | UUID primary key                 |
| `userId`          | VARCHAR(36)  | Owner user                       |
| `slug`            | VARCHAR(100) | URL slug (unique)                |
| `title`           | VARCHAR(255) | Page title                       |
| `content`         | JSON         | Page content structure           |
| `metaTitle`       | VARCHAR(255) | SEO meta title                   |
| `metaDescription` | TEXT         | SEO meta description             |
| `pixelId`         | VARCHAR(50)  | Meta Pixel ID                    |
| `status`          | ENUM         | 'draft', 'published', 'archived' |
| `views`           | INT          | View count                       |
| `conversions`     | INT          | Conversion count                 |
