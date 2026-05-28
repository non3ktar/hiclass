import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Hello, class!',
        short_name: 'Hello',
        description: 'Seu amigo de inglês com IA',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    proxy: {
      '/.netlify/functions/chat': {
        target: 'https://openrouter.ai',
        changeOrigin: true,
        rewrite: () => '/api/v1/chat/completions',
      }
    }
  },
  resolve: {
    alias: {
      '@renderer': path.resolve(__dirname, 'src'),
      '@shared': path.resolve(__dirname, 'src/shared')
    }
  }
})
