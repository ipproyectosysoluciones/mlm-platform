# API Client Documentation / Documentación del Cliente API

## Español

Esta guía documenta el cliente API Axios centralizado para comunicación con el backend.

---

## English

This guide documents the centralized Axios API client for backend communication.

---

## 1. Overview / Descripción General

```text
frontend/src/services/api.ts
```

El cliente API proporciona:

- Instancia Axios preconfigurada
- Interceptors para autenticación
- Servicios organizados por dominio
- Tipos TypeScript completos

---

## 2. Configuration / Configuración

### 2.1 Base Configuration

```typescript
const API_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### 2.2 Environment URLs

| Environment | URL                               |
| ----------- | --------------------------------- |
| Development | `http://localhost:3000/api`       |
| Staging     | `https://staging-api.mlm.com/api` |
| Production  | `https://api.mlm.com/api`         |

### 2.3 Request Interceptor

```typescript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## 3. Service Structure / Estructura de Servicios

```tree
api
├── authService      # Authentication endpoints
├── dashboardService  # Dashboard endpoints
├── adminService     # Admin endpoints
├── treeService      # Tree visualization endpoints
├── userService      # User search/details endpoints
└── crmService       # CRM endpoints
```

---

## 4. Authentication Service / authService

**Namespace:** `authService`

| Method         | Endpoint                       | Description       |
| -------------- | ------------------------------ | ----------------- |
| login          | POST /auth/login               | User login        |
| register       | POST /auth/register            | User registration |
| getProfile     | GET /auth/me                   | Get current user  |
| updateProfile  | PATCH /users/me                | Update profile    |
| changePassword | POST /users/me/change-password | Change password   |
| deleteAccount  | POST /users/me/delete          | Delete account    |

### 4.1 Login

```typescript
const login = async (data: { email: string; password: string }): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', data);
  return response.data.data;
};
```

### 4.2 Register

```typescript
const register = async (data: {
  email: string;
  password: string;
  sponsor_code?: string;
}): Promise<AuthResponse> => {
  const response = await api.post('/auth/register', data);
  return response.data.data;
};
```

### 4.3 Get Profile

```typescript
const getProfile = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};
```

---

## 5. Dashboard Service / dashboardService

**Namespace:** `dashboardService`

| Method       | Endpoint       | Description        |
| ------------ | -------------- | ------------------ |
| getDashboard | GET /dashboard | Get dashboard data |

### 5.1 Get Dashboard

```typescript
const getDashboard = async (): Promise<DashboardData> => {
  const response = await api.get('/dashboard');
  return response.data.data;
};
```

**Response Type:**

```typescript
interface DashboardData {
  user: User;
  treeStats: {
    totalReferrals: number;
    leftCount: number;
    rightCount: number;
  };
  commissionStats: {
    totalEarned: number;
    pendingCommission: number;
  };
  referralLink: string;
  recentCommissions: Commission[];
  recentReferrals: Referral[];
}
```

---

## 6. Admin Service / adminService

**Namespace:** `adminService`

| Method               | Endpoint                       | Description             |
| -------------------- | ------------------------------ | ----------------------- |
| getStats             | GET /admin/stats               | Global statistics       |
| getUsers             | GET /admin/users               | List users with filters |
| getUserById          | GET /admin/users/:id           | Get user details        |
| updateUserStatus     | PATCH /admin/users/:id/status  | Update user status      |
| promoteToAdmin       | PATCH /admin/users/:id/promote | Promote to admin        |
| getCommissionsReport | GET /admin/reports/commissions | Commissions report      |

### 6.1 Get Users with Filters

```typescript
const getUsers = async (params?: {
  page?: number;
  limit?: number;
  status?: 'active' | 'inactive';
  search?: string;
}) => {
  const response = await api.get('/admin/users', { params });
  return response.data;
};
```

### 6.2 Update User Status

```typescript
const updateUserStatus = async (userId: string, status: 'active' | 'inactive') => {
  const response = await api.patch(`/admin/users/${userId}/status`, { status });
  return response.data;
};
```

---

## 7. Tree Service / treeService

**Namespace:** `treeService`

| Method    | Endpoint            | Description             |
| --------- | ------------------- | ----------------------- |
| getTree   | GET /users/:id/tree | Get tree for user       |
| getMyTree | GET /users/me/tree  | Get current user's tree |

### 7.1 Get Tree

```typescript
const getTree = async (
  userId: string,
  maxDepth?: number,
  page?: number,
  limit?: number
): Promise<TreeNode> => {
  const params = new URLSearchParams();
  if (maxDepth) params.append('depth', maxDepth.toString());
  if (page) params.append('page', page.toString());
  if (limit) params.append('limit', limit.toString());

  const response = await api.get(`/users/${userId}/tree${params.toString() ? `?${params}` : ''}`);
  return response.data.data.tree;
};
```

### 7.2 Get My Tree

```typescript
const getMyTree = async (maxDepth?: number, page?: number, limit?: number): Promise<TreeNode> => {
  const response = await api.get('/users/me/tree', { params });
  return response.data.data.tree;
};
```

---

## 8. User Service / userService

**Namespace:** `userService`

| Method         | Endpoint               | Description             |
| -------------- | ---------------------- | ----------------------- |
| searchUsers    | GET /users/search      | Search users in network |
| getUserDetails | GET /users/:id/details | Get detailed user info  |

### 8.1 Search Users

```typescript
const searchUsers = async (query: string, limit?: number): Promise<User[]> => {
  const params = new URLSearchParams({ q: query });
  if (limit) params.append('limit', limit.toString());

  const response = await api.get(`/users/search?${params}`);
  return response.data.data || [];
};
```

### 8.2 Get User Details

```typescript
const getUserDetails = async (userId: string): Promise<UserDetails> => {
  const response = await api.get(`/users/${userId}/details`);
  return response.data.data;
};
```

---

## 9. CRM Service / crmService

**Namespace:** `crmService`

### 9.1 Leads

| Method     | Endpoint        | Description    |
| ---------- | --------------- | -------------- |
| getLeads   | GET /crm        | List leads     |
| getLead    | GET /crm/:id    | Get lead by ID |
| createLead | POST /crm       | Create lead    |
| updateLead | PATCH /crm/:id  | Update lead    |
| deleteLead | DELETE /crm/:id | Delete lead    |
| getStats   | GET /crm/stats  | CRM statistics |

### 9.2 Tasks

| Method     | Endpoint              | Description        |
| ---------- | --------------------- | ------------------ |
| getTasks   | GET /crm/:id/tasks    | Get tasks for lead |
| createTask | POST /crm/:id/tasks   | Create task        |
| updateTask | PATCH /crm/tasks/:id  | Update task        |
| deleteTask | DELETE /crm/tasks/:id | Delete task        |

### 9.3 Communications

| Method            | Endpoint                     | Description        |
| ----------------- | ---------------------------- | ------------------ |
| getCommunications | GET /crm/:id/communications  | Get communications |
| addCommunication  | POST /crm/:id/communications | Add communication  |

### 9.4 Usage Examples

```typescript
// Create a lead
const createLead = async (data: {
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  company?: string;
  source?: string;
  notes?: string;
}) => {
  const response = await api.post('/crm', data);
  return response.data;
};

// Get lead with tasks
const getLeadWithTasks = async (leadId: string) => {
  const [leadRes, tasksRes] = await Promise.all([
    crmService.getLead(leadId),
    crmService.getTasks(leadId),
  ]);
  return { lead: leadRes.data, tasks: tasksRes.data };
};
```

---

## 10. Types / Tipos

### 10.1 Common Types

```typescript
// frontend/src/types/index.ts

interface User {
  id: string;
  email: string;
  referralCode: string;
  level: number;
  status: 'active' | 'inactive';
  role: 'user' | 'admin';
  createdAt: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

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

interface Lead {
  id: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  company?: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  source?: string;
  notes?: string;
  createdAt: string;
}
```

---

## 11. Response Format / Formato de Respuesta

### 11.1 Success Response

```typescript
{
  success: true,
  data: { ... },       // Response data
  message?: string,    // Optional message
}
```

### 11.2 Error Response

```typescript
{
  success: false,
  error: {
    code: string,      // Error code
    message: string,   // Human-readable message
  }
}
```

---

## 12. Error Handling / Manejo de Errores

### 12.1 Service Error Handling

```typescript
const fetchData = async () => {
  try {
    const response = await dashboardService.getDashboard();
    setData(response);
  } catch (error) {
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      logout();
    } else if (error.response?.status === 403) {
      // Forbidden - insufficient permissions
      setError('Access denied');
    } else {
      // Other error
      setError('Something went wrong');
    }
  }
};
```

### 12.2 Response Interceptor

```typescript
// Add response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## 13. Testing the API / Probando la API

### 13.1 Using curl

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mlm.com","password":"admin123"}'

# Get Dashboard (with token)
curl http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 13.2 Test Users

| Role  | Email         | Password |
| ----- | ------------- | -------- |
| Admin | admin@mlm.com | admin123 |
| User  | user1@mlm.com | user123  |

---

## 14. API Documentation / Documentación de API

Swagger UI disponible en: `http://localhost:3000/api-docs`

---

## 15. Related Documents

- [COMPONENTS.md](./COMPONENTS.md) - Component documentation
- [PAGES.md](./PAGES.md) - Page documentation
- [README.md](./README.md) - Project overview
