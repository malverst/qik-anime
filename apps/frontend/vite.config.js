import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // FSD: все слои в src/
      '@fsd': fileURLToPath(new URL('./src', import.meta.url)),
    },
    // Bare-импорты из src резолвятся через node_modules этого проекта
    dedupe: ['react', 'react-dom', 'react-router-dom', 'motion', 'socket.io-client', 'hls.js', 'react-helmet-async'],
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
})
