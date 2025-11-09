import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Increase chunk size warning limit slightly (600KB)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Manual chunking strategy for optimal caching and loading
        manualChunks: (id) => {
          // Vendor chunks - these change rarely and can be cached long-term
          if (id.includes('node_modules')) {
            // React core - fundamental framework
            if (id.includes('react') && !id.includes('react-router') && !id.includes('@tanstack')) {
              return 'vendor-react';
            }

            // MUI core components (excluding icons and data components)
            if (id.includes('@mui/material') || id.includes('@emotion')) {
              return 'vendor-mui-core';
            }

            // MUI icons - separate chunk as they're large
            if (id.includes('@mui/icons-material')) {
              return 'vendor-mui-icons';
            }

            // MUI X Charts - only loaded on analytics page
            if (id.includes('@mui/x-charts')) {
              return 'vendor-mui-charts';
            }

            // MUI DataGrid - only loaded for admin pages
            if (id.includes('@mui/x-data-grid')) {
              return 'vendor-mui-datagrid';
            }

            // Supabase - backend SDK
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }

            // React Query - state management
            if (id.includes('@tanstack/react-query')) {
              return 'vendor-query';
            }

            // QR code libraries
            if (id.includes('qrcode') || id.includes('html5-qrcode')) {
              return 'vendor-qr';
            }

            // Animation library
            if (id.includes('framer-motion')) {
              return 'vendor-animation';
            }

            // Router
            if (id.includes('react-router')) {
              return 'vendor-router';
            }
          }

          // Feature-based chunks for application code
          if (id.includes('src/')) {
            // Admin features - only for admin users
            if (id.includes('src/pages/Admin') || id.includes('src/components/admin')) {
              return 'feature-admin';
            }

            // Analytics features - charts and analytics
            if (id.includes('src/pages/AnalyticsPage') ||
                id.includes('src/components/charts') ||
                id.includes('src/utils/analyticsCalculator') ||
                id.includes('src/utils/chartHelpers')) {
              return 'feature-analytics';
            }

            // Badge system
            if (id.includes('src/pages/BadgesPage') ||
                id.includes('src/pages/AdminBadgesPage') ||
                id.includes('src/components/badges') ||
                id.includes('src/utils/badgeChecker') ||
                id.includes('src/utils/badgeMetrics')) {
              return 'feature-badges';
            }

            // Friend system
            if (id.includes('src/pages/FriendsPage') ||
                id.includes('src/pages/ProfilePage') ||
                id.includes('src/components/friends')) {
              return 'feature-social';
            }

            // Session features
            if (id.includes('src/pages/SessionPage') ||
                id.includes('src/components/session')) {
              return 'feature-session';
            }

            // Settings and history
            if (id.includes('src/pages/SettingsPage') ||
                id.includes('src/pages/HistoryPage') ||
                id.includes('src/components/settings')) {
              return 'feature-settings';
            }
          }
        },
      },
    },
  },
})