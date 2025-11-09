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
        // Manual chunking strategy for vendor libraries only
        // Application code is automatically split by Vite through React.lazy() dynamic imports
        manualChunks: (id) => {
          // Only chunk vendor libraries from node_modules
          // Do NOT manually chunk application code (src/) - causes duplicate modules
          if (id.includes('node_modules')) {
            // Core dependencies stay in main bundle:
            // - React (foundational, needed by all chunks)
            // - React Query (depends on React.createContext)
            // - React Router (needed early for routing)
            // These must load first to avoid dependency issues

            // MUI core components and styling
            if (id.includes('@mui/material') || id.includes('@emotion')) {
              return 'vendor-mui';
            }

            // MUI icons - large, frequently used
            if (id.includes('@mui/icons-material')) {
              return 'vendor-mui-icons';
            }

            // MUI X Charts - only for analytics pages
            if (id.includes('@mui/x-charts')) {
              return 'vendor-charts';
            }

            // MUI DataGrid - only for admin pages
            if (id.includes('@mui/x-data-grid')) {
              return 'vendor-datagrid';
            }

            // Supabase client - backend communication
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }

            // QR code scanning and generation
            if (id.includes('qrcode') || id.includes('html5-qrcode')) {
              return 'vendor-qr';
            }

            // Framer Motion animations
            if (id.includes('framer-motion')) {
              return 'vendor-animation';
            }
          }

          // Let Vite automatically split application code based on dynamic imports
          // This prevents duplicate module instances and "already declared" errors
        },
      },
    },
  },
})