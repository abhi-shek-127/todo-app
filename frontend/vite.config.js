import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: false,
  },
  build: {
    // Transpile to ES2015 so the bundle works on devices from ~2016+
    // (Chrome 49+, Firefox 34+, Safari 10+, Edge 14+)
    target: 'es2015',
  },
});
