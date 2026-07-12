import { defineConfig } from 'vitest/config';

// Scratch config to run the pure-data spec quickly in Node with globals,
// bypassing the Angular unit-test builder (which boots a browser env).
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/app/pages/practice/practice-data.spec.ts'],
  },
});
