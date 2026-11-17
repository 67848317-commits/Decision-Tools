import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['packages/**/tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'packages/decision-core/src/**/*.ts',
        'packages/validation/src/**/*.ts',
        'packages/shared-data/src/decisions.ts',
      ],
      exclude: ['packages/**/tests/**'],
    },
  },
});
