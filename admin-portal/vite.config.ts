import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    // Support custom deployment paths via VITE_BASE_PATH (e.g. '/' or '/bus-tracker-vels/')
    base: env.VITE_BASE_PATH || (command === 'build' ? '/bus-tracker-vels/' : '/'),
    server: {
      port: 5173,
    },
  }
})
