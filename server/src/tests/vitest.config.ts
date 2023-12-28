import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // ... Specify options here.
    setupFiles: './src/tests/test.setup.ts',
  },
});
