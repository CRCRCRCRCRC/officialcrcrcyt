import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import siteConfig from '../backend/config/site.js'

const { DEFAULT_SITE_URL, toSiteOrigin } = siteConfig

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env }
  const siteUrl =
    toSiteOrigin(env.VITE_SITE_URL) ||
    toSiteOrigin(env.VERCEL_PROJECT_PRODUCTION_URL) ||
    DEFAULT_SITE_URL

  return {
    plugins: [
      react(),
      {
        name: 'inject-site-url',
        transformIndexHtml: (html) => html.replaceAll('__SITE_ORIGIN__', siteUrl)
      }
    ],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
        '/sitemap.xml': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
        '/robots.txt': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        }
      }
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      __SITE_URL__: JSON.stringify(siteUrl)
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
            ui: ['lucide-react', 'framer-motion']
          }
        }
      }
    }
  }
})
