# Components Documentation / Documentación de Componentes

## Español

Esta guía documenta los componentes React utilizados en la plataforma MLM.

---

## English

This guide documents the React components used in the MLM platform.

---

## 1. Component Structure / Estructura de Componentes

```tree
frontend/src/components/
├── layout/
│   └── AppLayout.tsx       # Main layout with horizontal navbar
├── tree/
│   ├── TreeNodeComponent.tsx   # Custom React Flow node
│   ├── SearchBar.tsx            # User search component
│   ├── DetailsPanel.tsx         # User details sidebar
│   └── TreeControls.tsx         # Zoom and controls
├── CRM/
│   └── CRMKanban.tsx       # Kanban board for leads
├── QRDisplay.tsx           # QR code display
└── LandingPage/
    └── (Landing page components)
```

---

## 2. Layout Components / Componentes de Layout

### 2.1 AppLayout

**File:** `frontend/src/components/layout/AppLayout.tsx`

**Purpose:** Main application layout with horizontal navigation bar.

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| children | ReactNode | Yes | Page content to render |

**Features:**

- ✅ Fixed horizontal navbar
- ✅ Responsive hamburger menu (mobile)
- ✅ Language selector (ES/EN)
- ✅ User dropdown menu
- ✅ Admin route protection

**Usage:**

```tsx
import AppLayout from './components/layout/AppLayout';

function ProtectedPage() {
  return (
    <AppLayout>
      <MyPageContent />
    </AppLayout>
  );
}
```

**Navigation Items:**
| Path | Label Key | Icon | Admin Only |
|------|-----------|------|------------|
| /dashboard | nav.dashboard | LayoutDashboard | No |
| /tree | nav.tree | TreeDeciduous | No |
| /crm | nav.crm | Users | No |
| /landing-pages | nav.landingPages | FileText | No |
| /profile | nav.profile | User | No |
| /admin | nav.admin | Shield | Yes |

---

## 3. Tree Visualization Components / Componentes de Árbol Visual

### 3.1 TreeNodeComponent

**File:** `frontend/src/components/tree/TreeNodeComponent.tsx`

**Purpose:** Custom node component for React Flow tree visualization.

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| data | TreeNodeData | Yes | Node data with user info |
| selected | boolean | No | Whether node is selected |

**Features:**

- Avatar with initial from email
- Position indicator (left/right)
- Downline stats (left/right count)
- Color-coded by leg (blue/purple)
- Handles for React Flow connections

**Visual Structure:**

```text
┌─────────────────────────────┐
│ [Avatar] user@email.com    │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 👥 Left: 5  │  👥 Right: 3 │
└─────────────────────────────┘
```

### 3.2 SearchBar

**File:** `frontend/src/components/tree/SearchBar.tsx`

**Purpose:** Search users in the network by email or referral code.

**Features:**

- Real-time search with debounce
- Dropdown with search results
- Click result to center tree on user
- Min 2 characters to search
- Loading state indicator

**Usage:**

```tsx
import SearchBar from './components/tree/SearchBar';

// In TreeView
<SearchBar onUserSelect={handleUserSelect} />;
```

### 3.3 DetailsPanel

**File:** `frontend/src/components/tree/DetailsPanel.tsx`

**Purpose:** Sidebar panel showing selected user details.

**Features:**

- Full user profile info
- Tree statistics (left/right/downline)
- "View Subtree" action
- Close button
- Responsive (collapsible on mobile)

### 3.4 TreeControls

**File:** `frontend/src/components/tree/TreeControls.tsx`

**Purpose:** Control panel for tree navigation.

**Controls:**
| Control | Description |
|---------|-------------|
| Zoom In (+) | Increase zoom level |
| Zoom Out (-) | Decrease zoom level |
| Fit View | Fit entire tree to viewport |
| Depth Selector | Select levels to display (1-10) |
| Minimap Toggle | Show/hide navigation minimap |

---

## 4. CRM Components / Componentes de CRM

### 4.1 CRMKanban

**File:** `frontend/src/components/CRM/CRMKanban.tsx`

**Purpose:** Kanban board for visual lead pipeline management.

**Columns:**
| Column | Status | Color |
|--------|--------|-------|
| New | new | blue |
| Contacted | contacted | yellow |
| Qualified | qualified | purple |
| Proposal | proposal | indigo |
| Negotiation | negotiation | orange |
| Won | won | green |
| Lost | lost | red |

**Features:**

- Drag and drop between columns
- Lead count per column
- Quick actions (view, edit, delete)
- Filter by assignee

---

## 5. Common Components / Componentes Comunes

### 5.1 QRDisplay

**File:** `frontend/src/components/QRDisplay.tsx`

**Purpose:** Display QR code for user's referral link.

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| url | string | Yes | URL to encode in QR |
| size | number | No | QR size in pixels (default: 200) |
| downloadName | string | No | Filename for download |

**Features:**

- Downloadable as PNG
- Responsive sizing
- Copy link button

---

## 6. Component Patterns / Patrones de Componentes

### 6.1 Bilingual Text / Texto Bilingüe

All user-facing text must use the i18n system:

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('module.title')}</h1>
      <p>{t('module.description')}</p>
    </div>
  );
}
```

### 6.2 Loading States / Estados de Carga

```tsx
// Loading spinner
{
  isLoading ? (
    <div className="flex justify-center py-12">
      <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
    </div>
  ) : (
    <Content />
  );
}
```

### 6.3 Error States / Estados de Error

```tsx
// Error with retry
{
  error ? (
    <div className="text-center py-12">
      <AlertCircle className="w-12 h-12 text-red-300 mx-auto mb-4" />
      <p className="text-slate-500 mb-4">{t('common.error')}</p>
      <button onClick={refetch}>{t('actions.retry')}</button>
    </div>
  ) : null;
}
```

### 6.4 Empty States / Estados Vacíos

```tsx
// Empty state with CTA
{
  items.length === 0 && (
    <div className="text-center py-12 bg-slate-50 rounded-xl">
      <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-slate-900 mb-2">{t('module.noItems')}</h3>
      <p className="text-slate-500 mb-4">{t('module.addFirst')}</p>
      <button onClick={handleAdd}>{t('module.addItem')}</button>
    </div>
  );
}
```

---

## 7. Styling Guidelines / Guías de Estilos

### 7.1 Color Palette

| Usage         | Color       | Tailwind Class      |
| ------------- | ----------- | ------------------- |
| Primary       | Emerald     | `text-emerald-600`  |
| Primary Light | Emerald 100 | `bg-emerald-100`    |
| Left Leg      | Blue        | `border-blue-500`   |
| Right Leg     | Purple      | `border-purple-500` |
| Success       | Green       | `text-green-600`    |
| Warning       | Amber       | `text-amber-600`    |
| Error         | Red         | `text-red-600`      |

### 7.2 Typography

| Element       | Class                                  |
| ------------- | -------------------------------------- |
| Page Title    | `text-2xl font-bold text-slate-900`    |
| Section Title | `text-lg font-semibold text-slate-900` |
| Body Text     | `text-slate-600`                       |
| Caption       | `text-sm text-slate-500`               |

### 7.3 Spacing

| Element        | Class         |
| -------------- | ------------- |
| Card Padding   | `p-6`         |
| Section Gap    | `space-y-6`   |
| Grid Gap       | `gap-4`       |
| Button Padding | `px-4 py-2.5` |

---

## 8. Accessibility / Accesibilidad

All components must be accessible:

| Requirement         | Implementation                        |
| ------------------- | ------------------------------------- |
| Keyboard navigation | Tab, Enter, Escape support            |
| ARIA labels         | `aria-label` on icon buttons          |
| Focus states        | `focus:ring-2 focus:ring-emerald-500` |
| Screen readers      | Semantic HTML                         |

---

## 9. Related Documents

- [PAGES.md](./PAGES.md) - Page components documentation
- [API_CLIENT.md](./API_CLIENT.md) - API service documentation
- [README.md](./README.md) - Project overview
