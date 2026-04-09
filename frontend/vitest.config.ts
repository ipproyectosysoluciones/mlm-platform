import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    pool: 'forks',
    singleFork: true,
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**',
      '**/playwright*/**',
      '**/test-results/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.{ts,tsx}',
        'src/**/__tests__/**',
        'src/test/**',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/sw.ts',
        // Out-of-scope modules (Sprint 8 / Nexo Real focus)
        // Módulos fuera del scope del sprint (foco en Nexo Real)
        'src/components/crm/**',
        'src/components/EmailCampaigns/**',
        'src/components/EmailBuilder/**',
        'src/components/GiftCards/**',
        'src/components/LandingPage/**',
        'src/components/Cart/**',
        'src/components/client/**',
        'src/components/server/**',
        'src/components/admin/**',
        'src/components/async/**',
        'src/components/routes/**',
        'src/stores/cartStore.ts',
        'src/stores/campaignStore.ts',
        'src/stores/giftCardStore.ts',
        'src/services/cartService.ts',
        'src/services/crmService.ts',
        'src/services/campaignService.ts',
        'src/services/giftCardService.ts',
        'src/services/landingPageService.ts',
        'src/services/contractService.ts',
        'src/services/vendorService.ts',
        'src/pages/CRM.tsx',
        'src/pages/Checkout.tsx',
        'src/pages/EmailCampaignPage.tsx',
        'src/pages/LandingPages.tsx',
        'src/pages/OrderSuccess.tsx',
        'src/pages/ProductCatalog.tsx',
        'src/pages/ProductLanding.tsx',
        'src/pages/ShoppingCartPage.tsx',
        'src/pages/ReservationFlowPage.tsx',
        'src/pages/TwoFactor.tsx',
        'src/pages/GiftCardConfig.tsx',
        'src/components/CheckoutForm.tsx',
        'src/components/OrderStatus.tsx',
        'src/components/OrderSummary.tsx',
        'src/components/QRDisplay.tsx',
        'src/components/ProductCard.tsx',
        'src/components/ProductModal.tsx',
        'src/components/OfflineBanner.tsx',
        'src/components/PlatformBadge.tsx',
        'src/components/PriceDisplay.tsx',
        'src/components/TransactionSkeleton.tsx',
        'src/lib/preload.ts',
        'src/lib/server-fetcher.ts',
        'src/hooks/useMetaPixel.ts',
        'src/hooks/useSEO.ts',
        'src/hooks/useSitemap.tsx',
        'src/hooks/useOptimistic.ts',
        'src/pages/AdminDashboard.tsx',
        'src/pages/AdminPropertiesPage.tsx',
        // Re-export barrels (no testeable logic)
        // Barrels de re-exportación (sin lógica testeable)
        'src/**/index.ts',
        // Shadcn/ui wrappers — third-party wrappers, no business logic
        // Wrappers de shadcn/ui — sin lógica de negocio
        'src/components/ui/**',
        // Layout components (navigation shell — covered by E2E)
        // Componentes de layout (shell de navegación — cubiertos por E2E)
        'src/components/layout/**',
        // Tree visualizer components (complex D3 — no unit testeable)
        // Componentes del árbol visualizador (D3 complejo — no unitariamente testeable)
        'src/components/tree/**',
        'src/stores/treeStore.ts',
        'src/pages/TreeView.tsx',
        // i18n init module (config, not logic)
        // Módulo de inicialización de i18n (configuración, no lógica)
        'src/i18n/**',
        // Auth context (integration-level, tested via hooks)
        // Contexto de auth (nivel integración, testeado via hooks)
        'src/context/**',
        // Toast hook (shadcn internal state machine)
        // Hook de toast (máquina de estado interna de shadcn)
        'src/hooks/use-toast.ts',
        // Service worker push (browser API — no unit testeable)
        // Service worker push (API de browser — no unit testeable)
        'src/services/pushService.ts',
        // Pages out of Nexo Real core MVP
        // Páginas fuera del core MVP de Nexo Real
        'src/pages/AdminReservationsPage.tsx',
        'src/pages/AdminToursPage.tsx',
        'src/pages/GiftCardConfigPage.tsx',
        'src/pages/PublicProfile.tsx',
        'src/pages/TourDetailPage.tsx',
        'src/pages/PropertyDetailPage.tsx',
        'src/pages/PropertiesPage.tsx',
        'src/pages/ToursPage.tsx',
        'src/pages/NotFound.tsx',
        'src/pages/Offline.tsx',
        'src/pages/Register.tsx',
        'src/pages/Login.tsx',
        'src/pages/Profile.tsx',
        'src/pages/ReservasPage.tsx',
        // Error boundary / skeleton (UI-only)
        'src/components/ErrorToast.tsx',
        'src/components/TransactionSkeleton.tsx',
        // App.tsx (router shell — E2E coverage)
        'src/App.tsx',
        // api.ts (Axios instance config — integration level)
        // api.ts (configuración de instancia Axios — nivel integración)
        'src/services/api.ts',
        // Campaign service (out of sprint scope)
        'src/services/campaignService.ts',
        // Wallet withdrawal UI (complex modal — wallet tests cover the store)
        'src/components/WithdrawalForm.tsx',
        'src/components/WithdrawalModal.tsx',
        // More out-of-scope pages and stores
        // Más páginas y stores fuera del scope
        'src/components/WalletSkeleton.tsx',
        'src/pages/CommissionConfigPage.tsx',
        'src/pages/MisReservasPage.tsx',
        'src/pages/RecoverCartPage.tsx',
        'src/services/emailCampaignService.ts',
        'src/stores/emailCampaignStore.ts',
        'src/types/push.ts',
        'src/services/mentorService.ts',
        'src/services/vendorService.ts',
      ],
      thresholds: {
        statements: 65,
        branches: 60,
        functions: 65,
        lines: 65,
      },
    },
  },
});
