# API Reference / Referencia de API

## Base URL

```
Development: http://localhost:3000/api
Production: https://api.mlm.com/api
```

---

## Authentication / Autenticación

### Register / Registrar

**POST** `/api/auth/register`

```json
// Request / Solicitud
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "sponsor_code": "REF123ABC"  // optional
}

// Response / Respuesta (201)
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "...", "referralCode": "REF..." },
    "token": "jwt_token_here"
  }
}
```

### Login

**POST** `/api/auth/login`

```json
// Request
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

// Response (200)
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "...", "role": "user" },
    "token": "jwt_token_here"
  }
}
```

### Get Current User / Usuario Actual

**GET** `/api/auth/me`

Headers: `Authorization: Bearer <token>`

```json
// Response (200)
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "referralCode": "REF123ABC",
    "role": "user",
    "level": 1
  }
}
```

---

## Users / Usuarios

### Get My Tree / Mi Árbol

**GET** `/api/users/me/tree`

Headers: `Authorization: Bearer <token>`

```json
// Response (200)
{
  "success": true,
  "data": {
    "stats": { "leftCount": 5, "rightCount": 3 },
    "tree": {
      "id": "uuid",
      "children": [{ "id": "child_uuid", "position": "left", "children": [] }]
    }
  }
}
```

### Get User Tree / Árbol de Usuario

**GET** `/api/users/:id/tree`

Headers: `Authorization: Bearer <token>`

### Get QR Code URL / Obtener URL de QR

**GET** `/api/users/me/qr-url`

Headers: `Authorization: Bearer <token>`

```json
// Response (200)
{
  "success": true,
  "data": {
    "qrDataUrl": "data:image/png;base64,...",
    "referralLink": "https://app.mlm.com/register?ref=REF123ABC"
  }
}
```

---

## Dashboard

**GET** `/api/dashboard`

Headers: `Authorization: Bearer <token>`

```json
// Response (200)
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "..." },
    "treeStats": { "totalReferrals": 10, "leftCount": 6, "rightCount": 4 },
    "commissionStats": { "totalEarned": 350.0, "pendingCommission": 50.0 },
    "recentCommissions": []
  }
}
```

---

## Commissions / Comisiones

### List Commissions / Listar Comisiones

**GET** `/api/commissions`

Headers: `Authorization: Bearer <token>`

Query params: `page`, `limit`, `type`, `status`

```json
// Response (200)
{
  "success": true,
  "data": [{ "id": "uuid", "type": "direct", "amount": 10.0, "status": "pending" }],
  "pagination": { "page": 1, "limit": 10, "totalPages": 5 }
}
```

### Commission Stats / Estadísticas de Comisiones

**GET** `/api/commissions/stats`

Headers: `Authorization: Bearer <token>`

```json
// Response (200)
{
  "success": true,
  "data": {
    "totalEarned": 350.0,
    "pending": 50.0,
    "byType": { "direct": 100.0, "level_1": 150.0 }
  }
}
```

### Create Purchase / Crear Compra

**POST** `/api/commissions`

Headers: `Authorization: Bearer <token>`

```json
// Request
{
  "amount": 100.00,
  "currency": "USD",
  "description": "Product purchase"
}

// Response (201)
{
  "success": true,
  "data": {
    "id": "uuid",
    "amount": 100.00,
    "currency": "USD",
    "status": "completed"
  }
}
```

---

## Admin / Administrador

All admin endpoints require `role: "admin"` / Todos los endpoints de admin requieren `role: "admin"`

### Global Stats / Estadísticas Globales

**GET** `/api/admin/stats`

Headers: `Authorization: Bearer <token>`

```json
// Response (200)
{
  "success": true,
  "data": {
    "totalUsers": 1500,
    "activeUsers": 1200,
    "totalCommissions": 50000.0,
    "totalPurchases": 3000
  }
}
```

### List Users / Listar Usuarios

**GET** `/api/admin/users`

Headers: `Authorization: Bearer <token>`

Query params: `page`, `limit`, `status`, `search`

```json
// Response (200)
{
  "success": true,
  "data": {
    "users": [...],
    "pagination": { "page": 1, "limit": 20, "total": 1500 }
  }
}
```

### Update User Status / Actualizar Estado

**PATCH** `/api/admin/users/:userId/status`

Headers: `Authorization: Bearer <token>`

```json
// Request
{ "status": "suspended" }

// Response (200)
{ "success": true, "data": { "id": "uuid", "status": "suspended" } }
```

### Promote User / Promover Usuario

**PATCH** `/api/admin/users/:userId/promote`

Headers: `Authorization: Bearer <token>`

### Commissions Report / Reporte de Comisiones

**GET** `/api/admin/reports/commissions`

Headers: `Authorization: Bearer <token>`

Query params: `startDate`, `endDate`, `type`

---

## CRM

### Create Lead / Crear Lead

**POST** `/api/crm`

Headers: `Authorization: Bearer <token>`

```json
// Request
{
  "contactName": "John Doe",
  "contactEmail": "john@example.com",
  "contactPhone": "+1234567890",
  "source": "website"
}

// Response (201)
{
  "success": true,
  "data": { "id": "uuid", "contactName": "John Doe", "status": "new" }
}
```

### List Leads / Listar Leads

**GET** `/api/crm`

Headers: `Authorization: Bearer <token>`

### CRM Stats / Estadísticas CRM

**GET** `/api/crm/stats`

Headers: `Authorization: Bearer <token>`

### Create Task / Crear Tarea

**POST** `/api/crm/:leadId/tasks`

Headers: `Authorization: Bearer <token>`

```json
// Request
{
  "title": "Follow up call",
  "dueDate": "2024-12-31",
  "priority": "high"
}
```

### Add Communication / Agregar Comunicación

**POST** `/api/crm/:leadId/communications`

Headers: `Authorization: Bearer <token>`

```json
// Request
{
  "type": "call",
  "subject": "Initial contact",
  "notes": "Discussed product features"
}
```

---

## Error Responses / Respuestas de Error

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message / Mensaje legible",
    "details": {}
  }
}
```

### Error Codes / Códigos de Error

| Code                    | HTTP | Description                        |
| ----------------------- | ---- | ---------------------------------- |
| `UNAUTHORIZED`          | 401  | Missing or invalid token           |
| `FORBIDDEN`             | 403  | Insufficient permissions           |
| `NOT_FOUND`             | 404  | Resource not found                 |
| `INVALID_EMAIL`         | 400  | Invalid email format               |
| `EMAIL_EXISTS`          | 400  | Email already registered           |
| `INVALID_REFERRAL_CODE` | 400  | Sponsor code not found             |
| `INVALID_CREDENTIALS`   | 401  | Wrong email or password            |
| `WEAK_PASSWORD`         | 400  | Password doesn't meet requirements |
| `INVALID_AMOUNT`        | 400  | Amount must be positive            |
| `VALIDATION_ERROR`      | 400  | General validation error           |
