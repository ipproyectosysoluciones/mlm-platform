# Horizontal Navbar Layout - Specification

## 1. Overview / Descripción General

Componente de layout con navbar horizontal para navegación principal de la aplicación.

> Layout component with horizontal navbar for main application navigation.

---

## 2. Layout Structure / Estructura del Layout

### Desktop Layout (lg+) / Escritorio

```
┌─────────────────────────────────────────────────────────────────────┐
│ [Logo]   [Dashboard] [Árbol] [CRM] [Landing Pages]    [🇪🇸|🇺🇸] [👤] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                         Main Content Area                           │
│                         (with pt-16 padding)                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Mobile Layout (< lg) / Móvil

```
┌─────────────────────────────────┐
│ [Logo]              [☰] [👤]   │
├─────────────────────────────────┤
│ [Dashboard]                    │
│ [Árbol]                        │
│ [CRM]                          │
│ [Landing Pages]                │
│ ─────────────────────────────── │
│ [🇪🇸 ES] [🇺🇸 EN]              │
│ ─────────────────────────────── │
│ [Mi Perfil]                    │
│ [Cerrar Sesión]                │
└─────────────────────────────────┘
```

---

## 3. Components / Componentes

### 3.1 AppLayout

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| children | ReactNode | Yes | Page content to render |

**State:**
| State | Type | Default | Description |
|-------|------|---------|-------------|
| mobileMenuOpen | boolean | false | Mobile hamburger menu visibility |
| userMenuOpen | boolean | false | User dropdown visibility |

### 3.2 Navbar / Barra de Navegación

**Structure:**

```
[Logo] ──────────────── [Nav Links] ──────────────── [Lang] [User]
```

**Styling:**

- Fixed position: `fixed top-0 left-0 right-0`
- Height: `h-16` (64px)
- Background: `bg-white`
- Border: `border-b border-slate-200`
- Z-index: `z-50`

### 3.3 Logo

**Position:** Left side of navbar

**Content:**

- Icon or image (optional)
- Text: "MLM" or app name

### 3.4 NavLinks / Enlaces de Navegación

**Links to display:**
| Path | Label Key | Admin Only |
|------|-----------|------------|
| /dashboard | nav.dashboard | No |
| /tree | nav.tree | No |
| /crm | nav.crm | Yes |
| /landing-pages | nav.landingPages | No |

**Desktop:** Horizontal list, centered
**Mobile:** Vertical stack in hamburger menu

### 3.5 LanguageSelector

**Position:** Right side of navbar (before user menu)

**Structure:**

```
🇪🇸 ES | 🇺🇸 EN
```

**States:**

- Active language: `bg-emerald-100 text-emerald-700`
- Inactive language: `text-slate-500 hover:text-slate-700`

### 3.6 UserMenu / Menú de Usuario

**Position:** Right side of navbar

**Structure (collapsed):**

```
[Avatar Circle with Initial]
```

**Structure (expanded - dropdown):**

```
┌──────────────────────────┐
│ [Avatar] Nombre           │
│ Email del usuario         │
├──────────────────────────┤
│ 🔹 Mi Perfil             │
│ 🔹 Cerrar Sesión         │
└──────────────────────────┘
```

### 3.7 MobileMenu / Menú Móvil

**Trigger:** Hamburger button (☰ / ✕)

**Content:**

- Navigation links (same as desktop)
- Divider
- Language selector
- Divider
- User profile link
- Logout button

**Animation:** Slide down with `transition-all duration-200`

---

## 4. Responsive Breakpoints / Puntos de Quiebre

| Breakpoint | Width     | Behavior                             |
| ---------- | --------- | ------------------------------------ |
| Mobile     | < 1024px  | Hamburger menu visible, vertical nav |
| Desktop    | >= 1024px | Full horizontal nav, no hamburger    |

---

## 5. Accessibility / Accesibilidad

| Requirement         | Implementation                        |
| ------------------- | ------------------------------------- |
| Keyboard navigation | Tab through all interactive elements  |
| ARIA labels         | `aria-label` on icon buttons          |
| Focus states        | `focus:ring-2 focus:ring-emerald-500` |
| Screen readers      | Semantic HTML (`<nav>`, `<button>`)   |
| Escape to close     | `onKeyDown` handler for dropdowns     |

---

## 6. State Management / Gestión de Estado

### Local State (React useState)

```typescript
const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
const [userMenuOpen, setUserMenuOpen] = useState(false);
```

### Click Outside Detection

Menus close when clicking outside:

```typescript
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
      setUserMenuOpen(false);
    }
  };
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);
```

---

## 7. Integration with App.tsx

### Before

```tsx
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* ... more routes */}
      </Routes>
    </Router>
  );
}
```

### After

```tsx
import AppLayout from './components/layout/AppLayout';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes - no layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes - with AppLayout */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tree" element={<TreeView />} />
          <Route path="/crm" element={<CRM />} />
          <Route path="/landing-pages" element={<LandingPages />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </Router>
  );
}
```

---

## 8. Styling Constants / Constantes de Estilos

```typescript
const NAVBAR_HEIGHT = 'h-16'; // 64px
const NAVBAR_PADDING_TOP = 'pt-16'; // For main content
const BREAKPOINT_LG = 'lg'; // 1024px
const TRANSITION_DURATION = 'duration-200';
```

---

## 9. Acceptance Criteria / Criterios de Aceptación

### Functional / Funcionales

| #    | Criterion                               | Verified |
| ---- | --------------------------------------- | -------- |
| AC-1 | Navbar displays on all protected routes | ✅       |
| AC-2 | Mobile hamburger menu opens/closes      | ✅       |
| AC-3 | User dropdown opens/closes              | ✅       |
| AC-4 | Language selector changes language      | ✅       |
| AC-5 | All nav links navigate correctly        | ✅       |
| AC-6 | Logout clears auth and redirects        | ✅       |

### Visual / Visuales

| #    | Criterion                                     | Target |
| ---- | --------------------------------------------- | ------ |
| VC-1 | Navbar is 64px tall                           | ✅     |
| VC-2 | Content has proper top padding                | ✅     |
| VC-3 | Active nav link is highlighted                | ✅     |
| VC-4 | Hover states work on all interactive elements | ✅     |
| VC-5 | Mobile menu slides smoothly                   | ✅     |

### Responsive / Responsivo

| #    | Criterion                    | Verified |
| ---- | ---------------------------- | -------- |
| RC-1 | Desktop shows horizontal nav | ✅       |
| RC-2 | Mobile shows hamburger menu  | ✅       |
| RC-3 | Breakpoint at 1024px         | ✅       |

---

## 10. Out of Scope / Fuera de Alcance

- Sidebar navigation (replaced completely)
- Collapsible sidebar option
- Notification bell/dropdown
- Search bar in navbar
- Dark mode toggle

---

## 11. Status

**APPROVED**

## 12. Related Documents

- [proposal.md](./proposal.md) - Motivation and scope
- [design.md](./design.md) - Implementation details
