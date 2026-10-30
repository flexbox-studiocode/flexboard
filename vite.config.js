import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Bind explicitly so `vite --port $PORT` under `vercel dev` always listens on
  // IPv4 localhost, avoiding ERR_CONNECTION_REFUSED from localhost/IPv6 mismatch.
  server: { host: '127.0.0.1' },
  preview: { host: '127.0.0.1' },
})
