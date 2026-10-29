import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'

// Replaces the placeholder in dist/sw.js with every built asset so lazy-loaded
// screens work offline from the first visit, not only after being opened once.
function precacheManifest(): Plugin {
  return {
    name: 'precache-manifest',
    apply: 'build',
    closeBundle() {
      const assetsDir = join('dist', 'assets')
      const urls = readdirSync(assetsDir).map((name) => `/assets/${name}`)
      const swPath = join('dist', 'sw.js')
      writeFileSync(swPath, readFileSync(swPath, 'utf8').replace('[] /* __PRECACHE_ASSETS__ */', JSON.stringify(urls)))
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), precacheManifest()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
