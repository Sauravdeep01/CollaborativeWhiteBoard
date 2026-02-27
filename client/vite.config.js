import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'
import { copyFileSync } from 'fs'

// Custom plugin: After build, copy index.html → 200.html for Render SPA fallback
function renderSPAFallback() {
  return {
    name: 'render-spa-fallback',
    closeBundle() {
      const outDir = resolve(__dirname, 'dist')
      try {
        copyFileSync(resolve(outDir, 'index.html'), resolve(outDir, '200.html'))
        console.log('✅ Created 200.html for Render SPA fallback')
      } catch (e) {
        console.warn('⚠️ Could not create 200.html:', e.message)
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    renderSPAFallback(),
  ],
})
