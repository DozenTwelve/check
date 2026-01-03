import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  const proxyTarget = process.env.VITE_API_PROXY_TARGET || 'http://localhost:3001';
  const allowedHosts = process.env.VITE_ALLOWED_HOSTS
    ? process.env.VITE_ALLOWED_HOSTS.split(',').map((host) => host.trim()).filter(Boolean)
    : ['check.diamonddoge.org', 'localhost', '127.0.0.1'];

  return {
    plugins: [react()],
    server: {
      port: 5173,
      allowedHosts,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    }
  };
});
