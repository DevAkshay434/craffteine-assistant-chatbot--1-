import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true,
    hmr: {
      clientPort: 443,
    },
  },
  preview: {
    allowedHosts: true,
  },
  build: {
    // Output assets to a subfolder to keep the dist directory clean
    assetsDir: 'assets',
  },
})
