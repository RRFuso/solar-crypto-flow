import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api/binance': {
        target: 'https://api.binance.com/api/v3',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/binance/, ''),
        secure: true,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      }
    }
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    global: 'globalThis',
  },
  build: {
    rollupOptions: {
      external: [],
      output: {
        globals: {}
      }
    }
  }
}));