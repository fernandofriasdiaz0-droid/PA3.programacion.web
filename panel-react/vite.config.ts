import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import os from 'os';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  cacheDir: path.join(os.tmpdir(), 'medisys-panel-react-vite-cache'),
  resolve: {
    preserveSymlinks: true
  },
  server: {
    port: 5173,
    host: true
  }
});
