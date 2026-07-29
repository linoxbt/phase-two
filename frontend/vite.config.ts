import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Needed to accept requests through the cloudflared quick tunnel, which
    // arrives with a random *.trycloudflare.com Host header.
    allowedHosts: true,
  },
})
