import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor libraries into their own chunks
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'excel-vendor': ['exceljs', 'file-saver'],
          // Group utility functions
          'utils': [
            './src/shared/utils/dataStorage.js',
            './src/shared/utils/excelExport.js'
          ],
          // Group configuration and data
          'config-data': [
            './src/core/config/hackathonConfig.js',
            './src/core/config/juryData.js'
          ],
          // Group hooks
          'hooks': [
            './src/shared/hooks/useDebounce.js',
            './src/shared/hooks/useFormValidation.jsx',
            './src/shared/hooks/usePWA.js',
            './src/shared/hooks/useVirtualization.js',
            './src/shared/hooks/usePerformance.jsx',
            './src/shared/hooks/useIntersectionObserver.js',
            './src/shared/hooks/useMemoryManagement.js'
          ]
        },
        // Optimize asset naming for better caching
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext)) {
            return `assets/styles/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js'
      }
    },
    // Increase chunk size warning limit to 800 KB
    chunkSizeWarningLimit: 800,
    // Enable source maps for better debugging
    sourcemap: false, // Disable in production for smaller builds
    // Optimize dependencies
    target: 'esnext',
    minify: 'esbuild', // Use esbuild instead of terser for faster builds
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Optimize module federation
    modulePreload: {
      polyfill: false // Skip polyfill for modern browsers
    },
    // Enable asset inlining for small files
    assetsInlineLimit: 4096 // Inline assets < 4KB
  },
  // Optimize dev server
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: ['exceljs'] // Exclude heavy libraries from pre-bundling
  },
  // Enhanced server configuration
  server: {
    // Enable compression
    compress: true,
    // Optimize HMR
    hmr: {
      overlay: true
    }
  },
  // Enable experimental features for better performance
  experimental: {
    // Enable renderBuiltUrl for better asset optimization
    renderBuiltUrl(filename, { hostType }) {
      if (hostType === 'js') {
        return { js: `/${filename}` };
      }
      return { relative: true };
    }
  },
  // Define global constants for tree shaking
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
    __PROD__: JSON.stringify(process.env.NODE_ENV === 'production')
  }
})
