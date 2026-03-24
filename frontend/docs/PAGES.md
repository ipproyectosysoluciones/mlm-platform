# Pages Documentation / Documentación de Páginas

## Español

Esta guía documenta las páginas de la aplicación MLM y su configuración de rutas.

---

## English

This guide documents the MLM application pages and their route configuration.

---

## 1. Page Structure / Estructura de Páginas

```
frontend/src/pages/
├── Login.tsx              # User login
├── Register.tsx           # User registration
├── Dashboard.tsx          # Main user dashboard
├── TreeView.tsx           # Binary tree visualization
├── Profile.tsx           # User profile management
├── AdminDashboard.tsx     # Admin panel
├── CRM.tsx               # CRM lead management
├── LandingPages.tsx      # Landing page management
└── PublicProfile.tsx     # Public user profile
```

---

## 2. Route Configuration / Configuración de Rutas

### 2.1 App.tsx Structure

```tsx
// frontend/src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
// ... other imports

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes - no layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/u/:referralCode" element={<PublicProfile />} />

        {/* Protected routes - with AppLayout */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tree" element={<TreeView />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/crm" element={<CRM />} />
          <Route path="/landing-pages" element={<LandingPages />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

### 2.2 Route Overview

| Route                | Component      | Auth | Role  | Description                     |
| -------------------- | -------------- | ---- | ----- | ------------------------------- |
| `/login`             | Login          | No   | -     | User login page                 |
| `/register`          | Register       | No   | -     | User registration               |
| `/register?ref=CODE` | Register       | No   | -     | Registration with sponsor       |
| `/u/:referralCode`   | PublicProfile  | No   | -     | Public profile by referral code |
| `/dashboard`         | Dashboard      | Yes  | user  | Main user dashboard             |
| `/tree`              | TreeView       | Yes  | user  | Binary tree visualization       |
| `/profile`           | Profile        | Yes  | user  | User profile settings           |
| `/crm`               | CRM            | Yes  | admin | CRM lead management             |
| `/landing-pages`     | LandingPages   | Yes  | user  | Landing page builder            |
| `/admin`             | AdminDashboard | Yes  | admin | Admin panel                     |
| `/*`                 | Dashboard      | Yes  | user  | Redirect to dashboard           |

---

## 3. Page Details / Detalles de Páginas

### 3.1 Login /page/Login.tsx

**Purpose:** User authentication.

**Features:**

- Email and password inputs
- Form validation
- Error messages
- Link to registration
- Sponsor code in URL support

**Translations:** `auth.*`

**Links:**

- Register: `/register`
- Forgot password: (future)

**State:**

```typescript
interface LoginForm {
  email: string;
  password: string;
}
```

---

### 3.2 Register /page/Register.tsx

**Purpose:** New user registration.

**Features:**

- Email, password, confirm password inputs
- Sponsor code field (optional)
- Password requirements display
- Validation
- Success redirect to dashboard

**URL Params:**
| Param | Description |
|-------|-------------|
| ref | Sponsor referral code |

**Translations:** `auth.*`

**Links:**

- Login: `/login`

**State:**

```typescript
interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  sponsorCode?: string;
}
```

---

### 3.3 Dashboard /page/Dashboard.tsx

**Purpose:** Main user dashboard with stats and quick actions.

**Features:**

- Welcome message with user name
- Tree statistics (left/right counts)
- Referral link with copy button
- QR code display
- Recent commissions list
- Recent referrals list
- Quick actions

**Translations:** `dashboard.*`, `nav.*`

**Layout Sections:**

1. Header with greeting
2. Stats cards (3 columns)
3. Referral section (link + QR)
4. Recent activity (2 columns)

---

### 3.4 TreeView /page/TreeView.tsx

**Purpose:** Interactive binary tree visualization.

**Features:**

- React Flow based visualization
- Pan and zoom controls
- Depth selector (1-10 levels)
- User search
- Node details panel
- Minimap navigation
- Empty/loading/error states

**Translations:** `tree.*`, `nav.*`

**Components Used:**

- `TreeNodeComponent` - Custom node renderer
- `SearchBar` - User search
- `DetailsPanel` - Node details
- `TreeControls` - Zoom/fit controls

---

### 3.5 Profile /page/Profile.tsx

**Purpose:** User profile management.

**Features:**

- View profile information
- Edit first name, last name, phone
- Change password
- Delete account (with confirmation)
- View referral link
- View landing pages

**Translations:** `profile.*`, `common.*`

**Tabs/Sections:**

1. Profile Info - Edit personal data
2. Security - Change password
3. Account - Delete account

---

### 3.6 AdminDashboard /page/AdminDashboard.tsx

**Purpose:** Admin panel for user and system management.

**Features:**

- Global statistics cards
- User list with search and filters
- User status management (activate/deactivate)
- Promote to admin
- Commission reports
- Pagination

**Translations:** `admin.*`, `common.*`

**Role Required:** `admin`

**Stats Displayed:**
| Stat | Description |
|------|-------------|
| Total Users | All registered users |
| Active Users | Users with status 'active' |
| Inactive Users | Users with status 'inactive' |
| Left/Right Ratio | Distribution ratio |

---

### 3.7 CRM /page/CRM.tsx

**Purpose:** Customer Relationship Management.

**Features:**

- Lead management (CRUD)
- Task management per lead
- Communication history
- Statistics dashboard
- Lead filtering by status
- Lead search

**Translations:** `crm.*`, `common.*`

**Role Required:** `admin`

**Tabs:**
| Tab | Description |
|-----|-------------|
| Leads | Lead list with filters |
| Tasks | All tasks across leads |
| Stats | CRM statistics |

**Lead Statuses:**
| Status | Spanish | English | Color |
|--------|---------|---------|-------|
| new | Nuevo | New | blue |
| contacted | Contactado | Contacted | yellow |
| qualified | Calificado | Qualified | purple |
| proposal | Propuesta | Proposal | indigo |
| negotiation | Negociación | Negotiation | orange |
| won | Ganado | Won | green |
| lost | Perdido | Lost | red |

---

### 3.8 LandingPages /page/LandingPages.tsx

**Purpose:** Landing page builder and manager.

**Features:**

- Landing page list
- Create new landing page
- Edit existing pages
- View page preview
- View statistics (views, conversions)
- Delete with confirmation

**Translations:** `landingPages.*`, `common.*`

**Page Fields:**
| Field | Description |
|-------|-------------|
| title | Page title |
| slug | URL slug (unique) |
| content | Page content (JSON) |
| metaTitle | SEO title |
| metaDescription | SEO description |
| status | draft/published/archived |

---

### 3.9 PublicProfile /page/PublicProfile.tsx

**Purpose:** Public profile view by referral code.

**Features:**

- Display user info (no sensitive data)
- Show registration stats
- Registration CTA with sponsor code

**URL Params:**
| Param | Description |
|-------|-------------|
| referralCode | From URL path `/u/:referralCode` |

**Translations:** `auth.*`

---

## 4. Protected Route Pattern / Patrón de Ruta Protegida

### 4.1 Auth Context Usage

```tsx
// Use auth context to protect routes
const { isAuthenticated, isLoading } = useAuth();

if (isLoading) {
  return <LoadingSpinner />;
}

if (!isAuthenticated) {
  return <Navigate to="/login" replace />;
}

return <ProtectedContent />;
```

### 4.2 Role-Based Access

```tsx
// Check for admin role
const { user } = useAuth();
const isAdmin = user?.role === 'admin';

if (!isAdmin) {
  return <Navigate to="/dashboard" replace />;
}

return <AdminContent />;
```

---

## 5. Page Transitions / Transiciones de Página

### 5.1 Loading State

Each page should handle loading:

```tsx
if (isLoading) {
  return (
    <div className="flex justify-center items-center min-h-[400px]">
      <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
    </div>
  );
}
```

### 5.2 Error Handling

```tsx
if (error) {
  return (
    <div className="text-center py-12">
      <AlertCircle className="w-12 h-12 text-red-300 mx-auto mb-4" />
      <p className="text-slate-500 mb-4">{t('common.error')}</p>
      <button onClick={refetch} className="btn-primary">
        {t('actions.retry')}
      </button>
    </div>
  );
}
```

---

## 6. Page Metadata / Metadatos de Página

### 6.1 Document Title

Set document title in each page:

```tsx
useEffect(() => {
  document.title = `${t('page.title')} - MLM`;
}, [t]);
```

---

## 7. Related Documents

- [COMPONENTS.md](./COMPONENTS.md) - Component documentation
- [API_CLIENT.md](./API_CLIENT.md) - API service documentation
- [README.md](./README.md) - Project overview
