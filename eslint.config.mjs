import tseslint from 'typescript-eslint';
import eslintPluginAstro from 'eslint-plugin-astro';

export default tseslint.config(
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.astro/**',
      '**/coverage/**',
      '**/progress/**',
      '**/.playwright-mcp/**',
      '**/assets/**',
      '**/assets-src/**',
      '.tmp/**'
    ]
  },
  {
    rules: {
      'no-empty': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 80, skipBlankLines: true, skipComments: true }]
    }
  },
  {
    files: ['scripts/**/*.mjs'],
    rules: {
      'no-console': 'off'
    }
  }
);
