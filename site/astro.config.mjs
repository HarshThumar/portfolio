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
      // The game is one lazy chunk loaded after the page; most of it is Rapier's wasm,
      // which the compat build inlines as base64. Its size is policed by check-budgets
      // (gzipped first-payload budget), so this warning would only repeat that check.
      chunkSizeWarningLimit: 6000
    }
  }
});
