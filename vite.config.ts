import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ✅ Fix for __dirname in ESM environments (like Replit)
const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5000,
    hmr: {
      protocol: "wss",
      clientPort: 443,
      host: process.env.REPLIT_DEV_DOMAIN,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    },
  },
  preview: {
    allowedHosts: true,
  },
  build: {
    assetsDir: "assets", // keep your assets organized
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"), // your main React app
        widget: resolve(__dirname, "widget-loader.js"), // ✅ your Shopify loader
      },
      output: {
        entryFileNames: "[name].js", // predictable filenames (main.js, widget.js)
      },
    },
  },
});
