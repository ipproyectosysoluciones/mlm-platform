import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// Feature flags from environment variables (opt-in by default in development)
// VITE_PWA_ENABLED=true - Enable PWA functionality
// VITE_PWA_OFFLINE=true - Enable offline support
const pwaEnabled = process.env.VITE_PWA_ENABLED === 'true';
const offlineEnabled = process.env.VITE_PWA_OFFLINE === 'true';

// Only enable PWA plugin if explicitly enabled via env var
const pwaPlugin =
  pwaEnabled || process.env.NODE_ENV === 'production'
    ? VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'favicon.svg',
          'icons/icon-72x72.png',
          'icons/icon-96x96.png',
          'icons/icon-128x128.png',
          'icons/icon-144x144.png',
          'icons/icon-152x152.png',
          'icons/icon-192x192.png',
          'icons/icon-384x384.png',
          'icons/icon-512x512.png',
          'icons/maskable-192x192.png',
          'icons/maskable-384x384.png',
          'icons/maskable-512x512.png',
          'icons/apple-touch-icon.png',
          'icons/favicon.ico',
        ],
        manifest: {
          name: 'MLM Platform - Binary Affiliations',
          short_name: 'MLM',
          description: 'Plataforma MLM con sistema de afiliaciones binarias',
          theme_color: '#4f46e5',
          background_color: '#f3f4f6',
          display: 'standalone',
          orientation: 'portrait-primary',
          scope: '/',
          start_url: '/',
          lang: 'es',
          categories: ['business', 'productivity', 'shopping', 'finance'],
          shortcuts: [
            {
              name: 'Dashboard',
              short_name: 'Dashboard',
              description: 'Ver tu panel de control',
              url: '/dashboard',
              icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96' }],
            },
            {
              name: 'Mi Árbol',
              short_name: 'Árbol',
              description: 'Ver tu red de afiliados',
              url: '/tree',
              icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96' }],
            },
            {
              name: 'Cartera',
              short_name: 'Cartera',
              description: 'Ver tu Wallet y comisiones',
              url: '/wallet',
              icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96' }],
            },
            {
              name: 'Catálogo',
              short_name: 'Catálogo',
              description: 'Explorar productos',
              url: '/products',
              icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96' }],
            },
          ],
          icons: [
            {
              src: '/icons/icon-72x72.png',
              sizes: '72x72',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icons/icon-96x96.png',
              sizes: '96x96',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icons/icon-128x128.png',
              sizes: '128x128',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icons/icon-144x144.png',
              sizes: '144x144',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icons/icon-152x152.png',
              sizes: '152x152',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icons/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icons/icon-384x384.png',
              sizes: '384x384',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icons/maskable-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: '/icons/maskable-384x384.png',
              sizes: '384x384',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: '/icons/maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
          screenshots: [
            {
              src: '/screenshot-dashboard.png',
              sizes: '1280x720',
              type: 'image/png',
              form_factor: 'wide',
              label: 'Dashboard principal',
            },
            {
              src: '/screenshot-tree.png',
              sizes: '1280x720',
              type: 'image/png',
              form_factor: 'wide',
              label: 'Vista del árbol de red',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/api\./i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60, // 1 hour
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'image-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
              },
            },
            {
              urlPattern: /\.(?:js|css)$/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'static-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
                },
              },
            },
            // Landing pages - NetworkFirst with offline fallback
            ...(offlineEnabled
              ? [
                  {
                    urlPattern: /\/landing(\/.*)?$/i,
                    handler: 'NetworkFirst' as const,
                    options: {
                      cacheName: 'landing-pages-cache',
                      networkTimeoutSeconds: 10,
                      expiration: {
                        maxEntries: 20,
                        maxAgeSeconds: 60 * 60 * 24, // 24 hours
                      },
                      cacheableResponse: {
                        statuses: [0, 200],
                      },
                    },
                  },
                ]
              : []),
            // Public profiles - StaleWhileRevalidate
            ...(offlineEnabled
              ? [
                  {
                    urlPattern: /\/ref\/[A-Z0-9]+$/i,
                    handler: 'StaleWhileRevalidate' as const,
                    options: {
                      cacheName: 'public-profiles-cache',
                      expiration: {
                        maxEntries: 50,
                        maxAgeSeconds: 60 * 60, // 1 hour
                      },
                    },
                  },
                ]
              : []),
          ],
        },
      })
    : null;

export default defineConfig({
  plugins: [react(), tailwindcss(), ...(pwaPlugin ? [pwaPlugin] : [])],
  build: {
    target: 'es2020',
    minify: 'esbuild',
    sourcemap: false,
    chunkSizeWarningLimit: 500,
  },
});
