import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Path resolution for clean imports
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "@/components": path.resolve(__dirname, "./components"),
      "@/hooks": path.resolve(__dirname, "./hooks"),
      "@/services": path.resolve(__dirname, "./services"),
      "@/contexts": path.resolve(__dirname, "./contexts"),
      "@/styles": path.resolve(__dirname, "./styles"),
    },
  },

  // Development server configuration
  server: {
    port: 5173, // Frontend port updated to avoid conflict
    host: true, // Enable access from network
    
    // ✅ Proxy configuration for API calls
    proxy: {
      // Proxy all /api requests to backend server
      '/api': {
        target: 'http://localhost:3000', // Backend runs on port 3000
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('🔥 Proxy error:', err.message);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            if (process.env.VITE_ENABLE_DEBUG === 'true') {
              console.log('📡 Proxying:', req.method, req.url, '→', options.target + req.url);
            }
          });
        }
      },
      
      // Proxy health check endpoint
      '/health': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      
      // Proxy any backend-specific endpoints
      '/backend': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/backend/, ''),
      }
    }
  },

  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: true,
    
    // Optimize bundle size
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['lucide-react'],
          charts: ['recharts'],
        }
      }
    }
  },

  // Environment variables configuration
  define: {
    // Make sure Vite environment variables are available
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },

  // CSS configuration
  css: {
    postcss: {
      plugins: [
        // PostCSS plugins will be auto-detected from postcss.config.js if it exists
      ],
    },
  },

  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'lucide-react',
      'recharts',
      'sonner@2.0.3'
    ],
  },

  // Plugin configuration
  esbuild: {
    // Remove console.log in production
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  }
});