import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // maplibre-gl instantiates its own web worker via a relative import.meta.url
  // path; Vite's dependency pre-bundler rewrites/copies that incorrectly,
  // producing a 404 for maplibre-gl-worker.mjs and silently stalling all tile
  // loading. Excluding it from pre-bundling serves the package as real ES
  // modules instead, which resolves its worker correctly.
  optimizeDeps: {
    exclude: ['maplibre-gl'],
  },
})
