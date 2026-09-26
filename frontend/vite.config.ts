import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // In development the frontend (port 5173) and backend (port 8080) are
    // different origins, so direct browser calls to the backend would need
    // CORS. Instead, the Vite dev server forwards these paths to the backend,
    // and the browser only ever talks to one origin. This mirrors production,
    // where a single host (or reverse proxy) will serve both, so the backend
    // never needs a CORS policy that could be misconfigured to allow other sites.
    proxy: {
      '/actuator': 'http://localhost:8080',
    },
  },
})
