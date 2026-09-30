import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Only use the GitHub Pages base path for production builds
  base: command === 'build' ? '/bus-tracker-vels/' : '/',
  server: {
    port: 5173,
  },
}))
