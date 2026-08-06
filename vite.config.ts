import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        manifest: {
          name: 'Sistem Monitoring Penerjemah',
          short_name: 'Master Translate',
          description: 'Sistem Monitoring Penerjemah by Master Translate — Kelola penerjemah profesional, pemantauan waktu tugas langsung, kapasitas beban kerja, dan kepatuhan SLA.',
          theme_color: '#ec4899',
          background_color: '#F8FAFC',
          display: 'standalone',
          orientation: 'portrait-primary',
          start_url: '/',
          scope: '/',
          lang: 'id',
          dir: 'ltr',
          categories: ['productivity', 'business'],
          icons: [
            {
              src: 'icons/icon-72x72.png',
              sizes: '72x72',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'icons/icon-96x96.png',
              sizes: '96x96',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'icons/icon-128x128.png',
              sizes: '128x128',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'icons/icon-144x144.png',
              sizes: '144x144',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'icons/icon-152x152.png',
              sizes: '152x152',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'icons/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'icons/icon-384x384.png',
              sizes: '384x384',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'icons/icon-512x512-maskable.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ],
          shortcuts: [
            {
              name: 'Dashboard',
              short_name: 'Dashboard',
              description: 'Buka halaman dashboard utama',
              url: '/?tab=dashboard',
              icons: [{ src: 'icons/icon-96x96.png', sizes: '96x96' }]
            },
            {
              name: 'Daftar Tugas',
              short_name: 'Tugas',
              description: 'Lihat daftar tugas terjemahan',
              url: '/?tab=assignments',
              icons: [{ src: 'icons/icon-96x96.png', sizes: '96x96' }]
            }
          ]
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      // Firebase SDK is ~733 kB minified — cannot be reduced further; suppress cosmetic warning.
      chunkSizeWarningLimit: 750,
      rollupOptions: {
        output: {
          manualChunks: {
            // Firebase SDK split into its own chunk
            'vendor-firebase': [
              'firebase/app',
              'firebase/auth',
              'firebase/firestore',
              'firebase/functions',
              'firebase/storage',
            ],
            // React + animation libraries
            'vendor-react': ['react', 'react-dom', 'motion'],
            // UI utilities
            'vendor-ui': ['lucide-react', 'clsx', 'tailwind-merge'],
          },
        },
      },
    },
  };
});
