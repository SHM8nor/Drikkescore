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
        // Simplified manual chunking - only split large, independent vendor libraries
        // Let Vite handle complex dependency chains automatically
        manualChunks: (id) => {
          // Only chunk vendor libraries from node_modules
          // Do NOT manually chunk application code (src/) - causes duplicate modules
          if (id.includes('node_modules')) {
            // Core dependencies (React, React Query, React Router) stay in main bundle
            // They're needed early and have complex interdependencies

            // Supabase - independent backend SDK, safe to split
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }

            // QR libraries - independent, only used in specific features
            if (id.includes('qrcode') || id.includes('html5-qrcode')) {
              return 'vendor-qr';
            }

            // Framer Motion - independent animation library
            if (id.includes('framer-motion')) {
              return 'vendor-animation';
            }

            // Let Vite automatically chunk MUI packages
            // MUI has complex internal dependencies (@mui/system, @mui/utils, @emotion, etc.)
            // Manual chunking breaks circular dependencies and causes "Cannot access before initialization"
          }

          // Let Vite automatically split application code based on dynamic imports
          // This prevents duplicate module instances and "already declared" errors
        },
      },
    },
  },
})