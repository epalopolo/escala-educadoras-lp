import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/escala-educadoras-lp/',
  build: {
    outDir: 'dist',
    sourcemap: false
  },
  define: {
    'process.env': {}
  }
})
