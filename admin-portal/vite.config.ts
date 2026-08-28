import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Required for GitHub Pages — the site is served at
  // https://AbdulArshath007.github.io/bus-tracker-vels/
  base: '/bus-tracker-vels/',
})
