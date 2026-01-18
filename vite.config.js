import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],

  // Don't copy public/ to dist/ - we serve static files separately
  publicDir: false,

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        dashboard: resolve(__dirname, 'dashboard.html'),
        pullRequest: resolve(__dirname, 'pull_request.html'),
        admin: resolve(__dirname, 'admin.html'),
      },
    },
  },

  server: {
    host: '0.0.0.0',
    port: 3001,
  },

  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
      generateScopedName: '[path]___[name]__[local]___[hash:base64:5]',
    },
  },
});
