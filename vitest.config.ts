import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    testTimeout: 30000,
    hookTimeout: 15000,
    isolate: true,
    reporters: ['verbose'],
    // Set env vars that are required at module import time.
    // DATABASE_URL is intentionally absent so the db module returns null
    // and all stores use their in-memory fallback — keeping tests hermetic.
    env: {
      JWT_SECRET: 'academy-vitest-secret-at-least-32-chars-long!',
      NODE_ENV: 'test',
      VITEST: '1',
    },
  },
});
