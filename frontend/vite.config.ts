import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      // usePolling disabled - only needed for Docker/WSL
      // usePolling: true
      ignored: ['**/node_modules/**', '**/.git/**']
    },
    hmr: {
      overlay: false  // Prevents error overlay from triggering reloads
    },
    proxy: {
      '/api': {
        target: 'http://api:8002',
        changeOrigin: true,
      },
      '/media': {
        target: 'http://nginx:80',
        changeOrigin: true,
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
