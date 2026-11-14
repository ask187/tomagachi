import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' keeps asset paths relative so the build works on any static host
export default defineConfig({
  base: './',
  plugins: [react()],
  test: { globals: true, environment: 'node' },
});
