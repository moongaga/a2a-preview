import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/a2a-preview/',
  plugins: [react()],
  build: {
    target: 'es2020',
    outDir: 'dist',
    emptyOutDir: true,
  },
});
