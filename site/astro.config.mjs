import { defineConfig } from 'astro/config';

// BASE_PATH lets the same build serve the preview at /<repo>/ and the final site at /.
// Every asset and link goes through import.meta.env.BASE_URL (docs/05).
export default defineConfig({
  output: 'static',
  site: 'https://harshthumar.github.io',
  base: process.env.BASE_PATH || '/',
  trailingSlash: 'always',
  vite: {
    build: {
      chunkSizeWarningLimit: 6000
    }
  }
});
