# Horizontal Navbar Layout - Design

## 1. File Structure / Estructura de Archivos

```
frontend/src/components/layout/
└── AppLayout.tsx    # Main layout component (CREATED)
```

## 2. Component Code Structure / Estructura del Componente

```tsx
/**
 * AppLayout - Main application layout with horizontal navbar
 * / Layout principal de la aplicación con navbar horizontal
 *
 * @description
 * Provides consistent navigation across all protected routes.
 * Features:
 * - Fixed horizontal navbar (desktop)
 * - Collapsible hamburger menu (mobile)
 * - Language selector
 * - User dropdown menu
 *
 * @example
 * <AppLayout>
 *   <Dashboard />
 * </AppLayout>
 *
 * @module components/layout
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const location = useLocation();

  // State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Refs for click outside detection
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Navigation links configuration
  const navLinks = [
    { path: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { path: '/tree', label: t('nav.tree'), icon: GitBranch },
    { path: '/crm', label: t('nav.crm'), icon: Users, admin: true },
    { path: '/landing-pages', label: t('nav.landingPages'), icon: FileText },
  ];

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ... render methods
}
```

## 3. Styling / Estilos (Tailwind CSS)

### Navbar Container

```tsx
// Fixed at top, full width
<div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50">
```

### Content Wrapper

```tsx
// Main content with top padding to avoid navbar overlap
<div className="pt-16 min-h-screen bg-slate-50">
  <div className="p-6">{children}</div>
</div>
```

### Desktop Navigation

```tsx
// Hidden on mobile, flex on desktop
<div className="hidden lg:flex items-center gap-1">
  {navLinks.map((link) => (
    <NavLink
      key={link.path}
      to={link.path}
      className={({ isActive }) =>
        `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'
        }`
      }
    >
      <link.icon className="w-4 h-4 inline mr-2" />
      {link.label}
    </NavLink>
  ))}
</div>
```

### Mobile Hamburger Button

```tsx
// Visible on mobile, hidden on desktop
<button
  className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
  aria-label="Toggle menu"
>
  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
</button>
```

### Mobile Menu Dropdown

```tsx
// Slide down animation
<div
  className={`lg:hidden absolute top-16 left-0 right-0 bg-white border-b border-slate-200 shadow-lg transition-all duration-200 ${
    mobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
  }`}
>
  {/* Mobile nav links */}
  <div className="p-4 space-y-2">
    {navLinks.map((link) => (
      <NavLink
        key={link.path}
        to={link.path}
        onClick={() => setMobileMenuOpen(false)}
        className={({ isActive }) =>
          `flex items-center gap-3 px-4 py-3 rounded-lg ${
            isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'
          }`
        }
      >
        <link.icon className="w-5 h-5" />
        {link.label}
      </NavLink>
    ))}
  </div>
</div>
```

### Language Selector

```tsx
<div className="flex items-center gap-1">
  <button
    onClick={() => changeLanguage('es')}
    className={`px-2 py-1 rounded text-sm ${
      i18n.language === 'es'
        ? 'bg-emerald-100 text-emerald-700 font-medium'
        : 'text-slate-500 hover:text-slate-700'
    }`}
  >
    🇪🇸 ES
  </button>
  <button
    onClick={() => changeLanguage('en')}
    className={`px-2 py-1 rounded text-sm ${
      i18n.language === 'en'
        ? 'bg-emerald-100 text-emerald-700 font-medium'
        : 'text-slate-500 hover:text-slate-700'
    }`}
  >
    🇺🇸 EN
  </button>
</div>
```

### User Dropdown Menu

```tsx
// User menu button
<div className="relative" ref={userMenuRef}>
  <button
    onClick={() => setUserMenuOpen(!userMenuOpen)}
    className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded-lg"
  >
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-medium">
      {user?.email?.[0]?.toUpperCase() || 'U'}
    </div>
    <ChevronDown className="w-4 h-4 text-slate-500" />
  </button>

  {/* Dropdown */}
  <div
    className={`absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-2 transition-all ${
      userMenuOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
    }`}
  >
    <div className="px-4 py-2 border-b border-slate-100">
      <p className="font-medium text-slate-900 truncate">{user?.email}</p>
    </div>
    <NavLink
      to="/profile"
      onClick={() => setUserMenuOpen(false)}
      className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-50"
    >
      <User className="w-4 h-4" />
      {t('nav.myProfile')}
    </NavLink>
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 w-full px-4 py-2 text-red-600 hover:bg-red-50"
    >
      <LogOut className="w-4 h-4" />
      {t('nav.logout')}
    </button>
  </div>
</div>
```

## 4. App.tsx Integration / Integración con App.tsx

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import { useAuthStore } from './stores/auth';

// Public routes component
function PublicRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  );
}

// Protected routes wrapped in AppLayout
function ProtectedRoutes() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tree" element={<TreeView />} />
        <Route path="/crm" element={<CRM />} />
        <Route path="/landing-pages" element={<LandingPages />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppLayout>
  );
}

// Main App component
function App() {
  const { isAuthenticated } = useAuthStore();

  return <BrowserRouter>{isAuthenticated ? <ProtectedRoutes /> : <PublicRoutes />}</BrowserRouter>;
}
```

## 5. CSS Adjustments / Ajustes CSS

### For Content Area

```css
/* main-content needs top margin for fixed navbar */
.main-content {
  padding-top: 64px; /* h-16 = 64px */
}

/* Ensure content scrolls under navbar */
.full-height {
  min-height: 100vh;
  overflow-y: auto;
}
```

### For Mobile Menu

```css
/* Smooth transitions */
.mobile-menu {
  transition:
    opacity 200ms ease-out,
    transform 200ms ease-out;
}

/* Ensure mobile menu appears above content */
.mobile-menu {
  z-index: 40;
}
```

## 6. State Flow / Flujo de Estado

```
User clicks hamburger ──▶ setMobileMenuOpen(true) ──▶ Mobile menu appears
User clicks outside ────▶ setMobileMenuOpen(false) ──▶ Mobile menu hides
User clicks user menu ──▶ setUserMenuOpen(true) ────▶ User dropdown appears
User clicks outside ────▶ setUserMenuOpen(false) ────▶ User dropdown hides
User clicks nav link ───▶ Navigate ──────────────────▶ Page changes, menu closes
User changes language ──▶ changeLanguage('en') ──────▶ All text updates
```

## 7. Keyboard Navigation / Navegación por Teclado

```tsx
// Escape key closes menus
useEffect(() => {
  const handleEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setMobileMenuOpen(false);
      setUserMenuOpen(false);
    }
  };
  document.addEventListener('keydown', handleEscape);
  return () => document.removeEventListener('keydown', handleEscape);
}, []);

// Focus trap in mobile menu
<div role="dialog" aria-modal="true" tabIndex={-1}>
  {/* Menu content */}
</div>;
```

## 8. Performance Considerations / Consideraciones de Rendimiento

| Aspect        | Concern                            | Solution                        |
| ------------- | ---------------------------------- | ------------------------------- |
| Re-renders    | State changes cause full re-render | Components are already memoized |
| Mobile menu   | CSS transition vs JS animation     | CSS transitions for smoothness  |
| Click outside | Event listener on document         | Cleanup in useEffect return     |
| Bundle size   | Additional component               | ~5KB gzipped                    |

## 9. Browser Support / Soporte de Navegadores

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+
- iOS Safari 11+
- Chrome for Android 60+

## 10. Testing Checklist / Lista de Verificación

### Manual Testing

- [ ] Navbar displays at top of all protected pages
- [ ] Logo links to dashboard
- [ ] All nav links navigate correctly
- [ ] Active link is visually highlighted
- [ ] Mobile hamburger toggles menu
- [ ] Menu closes on link click (mobile)
- [ ] Menu closes on outside click (mobile)
- [ ] User dropdown opens/closes
- [ ] User dropdown closes on outside click
- [ ] Profile link navigates correctly
- [ ] Logout clears auth and redirects
- [ ] Language selector changes language
- [ ] Language change persists after reload
- [ ] All text is bilingual (ES/EN)
- [ ] Works on mobile viewport
- [ ] Works on tablet viewport
- [ ] Works on desktop viewport

### Visual Regression

- [ ] Navbar height is consistent (64px)
- [ ] Content padding prevents overlap
- [ ] Dropdowns have proper shadows
- [ ] Colors match design system
- [ ] Typography is consistent

## 11. Status

**IMPLEMENTED**

## 12. Related Documents

- [proposal.md](./proposal.md) - Motivation and scope
- [spec.md](./spec.md) - Requirements specification
