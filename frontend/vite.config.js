import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // Cambiado a prompt para que NO recargue automáticamente
      includeAssets: ['favicon.ico', 'icon-192x192.png', 'icon-512x512.png'],
      manifest: {
        name: 'MindyLu Boutique',
        short_name: 'MindyLu',
        description: 'Gestión inteligente para tu boutique',
        theme_color: '#f02d73',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: 'icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
  server: {
    host: '0.0.0.0',
    port: 5173
  }
})
