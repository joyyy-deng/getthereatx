import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// npm test: unit and component tests in src/**/*.test.ts(x). Browser tests are in e2e/ (npm run test:e2e).
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
  },
});
