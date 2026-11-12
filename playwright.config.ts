import { defineConfig, devices } from '@playwright/test';

// npm run test:e2e: the blog and event templates in a real browser, at phone and
// desktop widths, against the Figma frames (sizes), axe (accessibility) and
// sideways scrolling. Starts its own dev server on port 4317.
// Set WP_BASE=http://localhost:8888 to also check the local WordPress copy (e2e/wordpress.spec.ts).
export default defineConfig({
  testDir: 'e2e',
  outputDir: 'test-results',
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4317', ...devices['Desktop Chrome'] },
  webServer: {
    command: 'npx vite --port 4317 --strictPort',
    url: 'http://localhost:4317',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
