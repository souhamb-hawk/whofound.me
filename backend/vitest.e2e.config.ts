import { defineConfig } from 'vitest/config';

/**
 * E2E test configuration
 * Run with: npm run test:e2e
 * Requires API_URL environment variable or running server on localhost:3000
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/e2e/**/*.test.ts'],
    testTimeout: 30000, // Longer timeout for network requests
  },
});

