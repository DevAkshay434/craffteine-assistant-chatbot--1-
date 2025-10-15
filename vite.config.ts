import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Output assets to a subfolder to keep the dist directory clean
    assetsDir: 'assets',
  },
})
