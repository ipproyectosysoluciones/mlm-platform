import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// ============================================
// Global axios mock — prevents real HTTP calls in all tests
// Fixes EnvironmentTeardownError from pending network requests during worker teardown
// If a specific test needs real axios, use vi.unmock('axios') in that file
// ============================================
const mockAxiosInstance = {
  get: vi.fn().mockResolvedValue({ data: { success: true, data: null } }),
  post: vi.fn().mockResolvedValue({ data: { success: true, data: null } }),
  put: vi.fn().mockResolvedValue({ data: { success: true, data: null } }),
  patch: vi.fn().mockResolvedValue({ data: { success: true, data: null } }),
  delete: vi.fn().mockResolvedValue({ data: { success: true, data: null } }),
  interceptors: {
    request: { use: vi.fn(), eject: vi.fn() },
    response: { use: vi.fn(), eject: vi.fn() },
  },
  defaults: {
    headers: {
      common: {},
    },
  },
};

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockAxiosInstance),
    isAxiosError: vi.fn((err: unknown) => err instanceof Error && 'isAxiosError' in err),
  },
}));

// Mock i18next
const mockT = (key: string, _options?: Record<string, unknown>) => {
  const translations: Record<string, string> = {
    'auth.welcome': 'Bienvenido',
    'auth.signIn': 'Iniciar Sesión',
    'auth.signInSubtitle': 'Ingresá a tu cuenta',
    'auth.noAccount': '¿No tenés cuenta?',
    'auth.signUp': 'Registrate',
    'auth.haveAccount': '¿Ya tenés cuenta?',
    'auth.loginError': 'Email o contraseña inválidos',
    'auth.passwordsNotMatch': 'Las contraseñas no coinciden',
    'auth.passwordMinLength': 'La contraseña debe tener al menos 8 caracteres',
    'auth.createAccount': 'Crear Cuenta',
    'auth.joinNetwork': 'Unite a nuestra red',
    'dashboard.welcome': 'Bienvenido',
    'dashboard.stats.totalReferrals': 'Total Referidos',
    'dashboard.stats.totalEarnings': 'Ganancias Totales',
    'dashboard.viewFullTree': 'Ver Árbol Completo',
    'nav.dashboard': 'Dashboard',
    'nav.tree': 'Árbol',
    'nav.profile': 'Perfil',
    'nav.properties': 'Propiedades',
    'nav.tours': 'Tours',
    'tree.title': 'Árbol Binario',
    'tree.empty.title': 'Sin Miembros Aún',
    'tree.empty.description': 'Tu red aparecerá aquí cuando tengas referidos.',
    'profile.title': 'Mi Perfil',
    'profile.accountSettings': 'Configuración de Cuenta',
    // Landing page / Página de inicio
    'landing.hero.badge': 'Plataforma Inmobiliaria & Turística',
    'landing.hero.title': 'Tu Próxima Propiedad o Aventura Te Espera',
    'landing.hero.subtitle':
      'Explorá propiedades exclusivas y paquetes de turismo en un solo lugar.',
    'landing.hero.ctaProperties': 'Ver Propiedades',
    'landing.hero.ctaTours': 'Ver Tours',
    'landing.hero.stats.properties': 'Propiedades',
    'landing.hero.stats.tours': 'Tours',
    'landing.hero.stats.countries': 'Países',
    'landing.hero.stats.clients': 'Clientes',
    'landing.featuredProperties.title': 'Propiedades Destacadas',
    'landing.featuredProperties.subtitle': 'Las mejores opciones seleccionadas para vos.',
    'landing.featuredProperties.viewAll': 'Ver todas',
    'landing.featuredProperties.loading': 'Cargando propiedades...',
    'landing.featuredProperties.empty': 'No hay propiedades destacadas.',
    'landing.featuredTours.title': 'Tours Destacados',
    'landing.featuredTours.subtitle': 'Experiencias únicas en los mejores destinos.',
    'landing.featuredTours.viewAll': 'Ver todos',
    'landing.featuredTours.loading': 'Cargando tours...',
    'landing.featuredTours.empty': 'No hay tours destacados.',
    'landing.cta.title': '¿Listo para empezar?',
    'landing.cta.subtitle': 'Registrate y accedé a todas las funcionalidades.',
    'landing.cta.button': 'Crear Cuenta Gratis',
    'landing.cta.login': 'Ya tengo cuenta',
    'landing.footer.tagline': 'Tu plataforma de propiedades y turismo.',
    'landing.footer.links': 'Enlaces',
    'landing.footer.rights': 'Todos los derechos reservados.',
  };
  return translations[key] || key;
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
    i18n: {
      language: 'es',
      changeLanguage: vi.fn(),
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
}));

// Mock ResizeObserver for React Flow
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverMock;

// Mock IntersectionObserver
class IntersectionObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
global.IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  }),
});
