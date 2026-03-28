import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { rmSync } from 'fs'
import { join } from 'path'

// Remove heavy folders from dist. Keep projects/ (New Capital images) and vps-data for static build.
function removeHeavyFromDist() {
  return {
    name: 'remove-heavy-from-dist',
    closeBundle() {
      const outDir = join(process.cwd(), 'dist')
      for (const dir of ['wp-uploads', 'listing-photos']) {
        try {
          rmSync(join(outDir, dir), { recursive: true })
        } catch (_) {}
      }
    },
  }
}

// https://vite.dev/config/
// base: '/' for arabianestate.com root. Use base: '/arabian-estate/' for subfolder.
export default defineConfig({
  base: '/',
  plugins: [react(), removeHeavyFromDist()],
  server: {
    allowedHosts: true,
  },
  build: {
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  publicDir: 'public',
})
