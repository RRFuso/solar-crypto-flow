
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
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
      external: [
        'http-proxy-agent',
        'https-proxy-agent',
        'socks-proxy-agent',
        'pac-proxy-agent',
        'node:http',
        'node:https',
        'node:fs',
        'node:path',
        'node:url',
        'node:crypto',
        'node:zlib',
        'node:stream',
        'node:util',
        'node:querystring',
        'fs',
        'path',
        'crypto',
        'zlib',
        'querystring',
        'stream',
        'util',
        'url',
        'http',
        'https',
      ],
      output: {
        globals: {
          'http-proxy-agent': 'HttpProxyAgent',
          'https-proxy-agent': 'HttpsProxyAgent',
          'socks-proxy-agent': 'SocksProxyAgent',
          'pac-proxy-agent': 'PacProxyAgent',
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['ccxt']
  }
}));
