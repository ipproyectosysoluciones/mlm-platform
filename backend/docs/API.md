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

Query params: `depth` (1-10), `page`, `limit`

```json
// Response (200) - Without pagination
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

// Response (200) - With pagination
{
  "success": true,
  "data": {
    "tree": { ... },
    "stats": { ... },
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 15,
      "hasMore": false
    }
  }
}
```

### Get User Tree / Árbol de Usuario

**GET** `/api/users/:id/tree`

Headers: `Authorization: Bearer <token>`

Query params: `depth` (1-10), `page`, `limit`

### Search Users / Buscar Usuarios

**GET** `/api/users/search`

Headers: `Authorization: Bearer <token>`

Query params: `q` (search term, min 2 chars), `limit` (default 10)

```json
// Response (200)
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "referralCode": "REF123ABC",
      "level": 2,
      "position": "left"
    }
  ]
}

// Response (400) - Query too short
{
  "success": false,
  "error": { "code": "VALIDATION_ERROR", "message": "..." }
}
```

### Get User Details / Detalles de Usuario

**GET** `/api/users/:id/details`

Headers: `Authorization: Bearer <token>`

Returns extended user details with downline statistics. User must be in requester's tree hierarchy.

```json
// Response (200)
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "referralCode": "REF123ABC",
    "position": "left",
    "level": 2,
    "status": "active",
    "createdAt": "2024-01-15T10:30:00Z",
    "stats": {
      "leftCount": 5,
      "rightCount": 3,
      "totalDownline": 8
    }
  }
}

// Response (403) - User not in requester's subtree
{
  "success": false,
  "error": { "code": "FORBIDDEN", "message": "Access denied" }
}

// Response (404) - User not found
{
  "success": false,
  "error": { "code": "NOT_FOUND", "message": "User not found" }
}
```

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

### Get CRM Analytics Report

**GET** `/api/crm/analytics/report`

Headers: `Authorization: Bearer <token>`

Query params: `period` (week|month|quarter|year), `dateFrom` (YYYY-MM-DD), `dateTo` (YYYY-MM-DD)

````json
// Response (200)
{
  "success": true,
  "data": {
    "period": {
      "type": "month",
      "dateFrom": "2026-02-24",
      "dateTo": "2026-03-24"
    },
    "leads": {
      "total": 25,
      "created": 25,
      "won": 8,
      "lost": 3,
      "active": 14
    },
    "value": {
      "total": 125000.00,
      "average": 5000.00,
      "won": 40000.00
    },
    "conversion": {
      "rate": 32.0,
      "avgTimeToWin": 12.5
    },
    "byStatus": {
      "new": 5,
      "contacted": 7,
      "qualified": 4,
      "proposal": 3,
      "negotiation": 2,
      "won": 8,
      "lost": 3
    },
    "bySource": {
      "website": 10,
      "referral": 8,
      "social": 4,
      "landing_page": 2,
      "manual": 1
    },
    "trend": [
      { "date": "2026-03-01", "created": 3, "won": 1 },
      { "date": "2026-03-02", "created": 2, "won": 0 },
      { "date": "2026-03-03", "created": 4, "won": 2 }
      // ... more daily/weekly data points
    ]
  }
}

### Get CRM Alerts
**GET** `/api/crm/alerts`

Headers: `Authorization: Bearer <token>`

Query params: `daysInactive` (default: 7)

```json
// Response (200)
{
  "success": true,
  "data": [
    {
      "type": "inactive_lead",
      "severity": "high",
      "title": "Lead sin contacto: Juan Pérez",
      "description": "Sin contacto desde hace 15 días",
      "leadId": "lead-uuid-1",
      "leadName": "Juan Pérez",
      "daysOverdue": 15,
      "createdAt": "2026-03-09T10:30:00Z"
    },
    {
      "type": "overdue_task",
      "severity": "medium",
      "title": "Tarea vencida: Llamada de seguimiento",
      "description": "Vencida hace 4 días",
      "leadId": "lead-uuid-2",
      "leadName": "María González",
      "taskId": "task-uuid-1",
      "taskTitle": "Llamada de seguimiento",
      "daysOverdue": 4,
      "createdAt": "2026-03-20T14:20:00Z"
    },
    {
      "type": "pending_followup",
      "severity": "low",
      "title": "Seguimiento pendiente: Carlos López",
      "description": "Seguimiento programado desde hace 2 días",
      "leadId": "lead-uuid-3",
      "leadName": "Carlos López",
      "daysOverdue": 2,
      "createdAt": "2026-03-22T09:15:00Z"
    }
  ]
}

### Export Analytics Report
**GET** `/api/crm/analytics/export`

Headers: `Authorization: Bearer <token>`

Query params: `period` (week|month|quarter|year), `dateFrom` (YYYY-MM-DD), `dateTo` (YYYY-MM-DD)

Response: CSV file with analytics data

Example CSV content:
````

Metric,Value
Period,2026-02-24 to 2026-03-24
Total Leads,25
Leads Created,25
Leads Won,8
Leads Lost,3
Active Leads,14
Total Value,125000.00
Average Value,5000.00
Won Value,40000.00
Conversion Rate,32.00%
Avg Days to Win,12.5

Status Breakdown,
new,5
contacted,7
qualified,4
proposal,3
negotiation,2
won,8
lost,3

Source Breakdown,
website,10
referral,8
social,4
landing_page,2
manual,1

Trend (Date, Created, Won),
2026-03-01,3,1
2026-03-02,2,0
2026-03-03,4,2

````

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
````

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
