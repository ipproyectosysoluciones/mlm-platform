# Tasks: Horizontal Navbar Layout

## Phase 1: Layout Components / Componentes de Layout

- [x] 1.1 Create `AppLayout.tsx` component with horizontal navbar structure
- [x] 1.2 Implement mobile hamburger menu with slide-out drawer
- [x] 1.3 Add user dropdown menu with profile/logout options
- [x] 1.4 Implement responsive breakpoints (lg for horizontal, <lg for mobile)

## Phase 2: Navigation Items / Items de Navegación

- [x] 2.1 Add Dashboard link with icon and bilingual label
- [x] 2.2 Add Tree (Árbol) link with icon and bilingual label
- [x] 2.3 Add CRM link with icon and bilingual label
- [x] 2.4 Add Landing Pages link with icon and bilingual label
- [x] 2.5 Add active state styling for current route

## Phase 3: Language Switcher / Selector de Idioma

- [x] 3.1 Integrate LanguageSwitcher component into navbar
- [x] 3.2 Add flag icons (🇪🇸 / 🇺🇸) with language labels
- [x] 3.3 Persist language selection in localStorage
- [x] 3.4 Test language switching on all pages

## Phase 4: User Menu / Menú de Usuario

- [x] 4.1 Create user avatar with dropdown menu
- [x] 4.2 Add "Mi Perfil" / "My Profile" link
- [x] 4.3 Add "Cerrar Sesión" / "Logout" button
- [x] 4.4 Implement click-outside to close menu

## Phase 5: Styling & Responsive / Estilos y Responsive

- [x] 5.1 Apply Tailwind classes for horizontal layout
- [x] 5.2 Add mobile-specific styles for hamburger menu
- [x] 5.3 Test all breakpoints (mobile, tablet, desktop)
- [x] 5.4 Verify accessibility (ARIA labels, keyboard nav)

## Phase 6: Integration / Integración

- [x] 6.1 Wrap existing pages with AppLayout
- [x] 6.2 Update routing configuration if needed
- [x] 6.3 Test navigation flow between all pages
- [x] 6.4 Verify no console errors

## Phase 7: E2E Tests / Tests E2E

- [ ] 7.1 Write Playwright test for desktop navigation
- [ ] 7.2 Write Playwright test for mobile hamburger menu
- [ ] 7.3 Write Playwright test for language switching
- [ ] 7.4 Write Playwright test for user menu interactions

---

**Total: 28 tasks across 7 phases**

**Status: 24/28 Complete (86%)**

---

## Completion Notes (2026-03-27)

- All core functionality implemented
- AppLayout component (285 lines) with:
  - Horizontal navbar
  - Mobile hamburger menu
  - User dropdown
  - Language selector
  - i18n integration
  - Responsive design
- Integrated in App.tsx with ProtectedRoute
- Build passes
- 31 tests passing

**Note**: E2E tests (Phase 7) not implemented - can be added in future iteration.
