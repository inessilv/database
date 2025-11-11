import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // ✅ Permite acesso externo (importante para Docker)
  },
  preview: {
    port: 80,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // ✅ Desabilitar sourcemaps em produção
  }
})