/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Load .env from parent directory (workspace root)
  envDir: path.resolve(__dirname, '..'),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Disable source maps in production for security
    sourcemap: false,
    // Minification settings
    minify: 'esbuild',
    // Target modern browsers for smaller bundles
    target: 'es2020',
    // Increase chunk size warning limit for Three.js
    chunkSizeWarningLimit: 600,
    // Rollup options for production optimization
    rollupOptions: {
      output: {
        // Chunk splitting for better caching
        manualChunks: (id) => {
          // Core vendor libraries
          if (id.includes('node_modules/react-dom')) return 'vendor'
          if (id.includes('node_modules/react-router')) return 'vendor'
          if (id.includes('node_modules/react/')) return 'vendor'
          
          // Three.js - separate chunk for game pages
          if (id.includes('node_modules/three')) return 'three'
          
          // UI libraries
          if (id.includes('node_modules/framer-motion')) return 'ui'
          if (id.includes('node_modules/clsx')) return 'ui'
          
          // State management
          if (id.includes('node_modules/zustand')) return 'state'
          
          // Date utilities
          if (id.includes('node_modules/date-fns')) return 'utils'
        },
      },
    },
  },
  // Strip console.log and debugger statements in production builds
  // TEMP: Disabled for bot debugging
  esbuild: {
    drop: [], // process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
