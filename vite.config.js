import { defineConfig } from 'vite';
import { cpSync, mkdirSync } from 'node:fs';

export default defineConfig({
  base: process.env.VITE_BASE || '/virtual-rites/',
  worker: { format: 'es' },
  plugins: [{
    name: 'ritual-library',
    closeBundle() {
      // Keep the editable JSON library and optional deck images at their existing URLs.
      mkdirSync('dist', { recursive: true });
      for (const dir of ['rituals', 'assets']) cpSync(dir, `dist/${dir}`, { recursive: true });
      mkdirSync('dist/worlds', { recursive: true });
      cpSync('worlds/index.json', 'dist/worlds/index.json');
    }
  }]
});
