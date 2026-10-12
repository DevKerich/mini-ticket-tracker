import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development the UI runs on Vite (5173) and proxies API calls to Express,
// so the browser only ever talks to one origin (same as in Docker).
const API_URL = process.env.API_URL || 'http://localhost:3000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/tickets': API_URL,
    },
  },
});
