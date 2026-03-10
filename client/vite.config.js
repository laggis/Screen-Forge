import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'loadingscreen.penguinhosting.host',
      '.penguinhosting.host',
    ],
    proxy: {
      '/api':     { target: 'http://localhost:3002', changeOrigin: true },
      '/auth':    { target: 'http://localhost:3002', changeOrigin: true },
      '/uploads': { target: 'http://localhost:3002', changeOrigin: true },
    }
  }
})
