import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { createRequire } from 'module';

// Try to load Tailwind Vite plugin optionally. Some environments (native optional
// bindings) may fail; fall back to running without the plugin so the dev server
// can still start for API or build tasks.
let tailwindcss: any = null;
try {
  const require = createRequire(import.meta.url);
  tailwindcss = require('@tailwindcss/vite');
} catch (err) {
  // Log at runtime; avoid crashing the config loader.
  // eslint-disable-next-line no-console
  console.warn('Optional tailwind plugin failed to load; continuing without it.');
}

export default defineConfig(() => {
  return {
    plugins: [react(), ...(tailwindcss ? [tailwindcss()] : [])],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
