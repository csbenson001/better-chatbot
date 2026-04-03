/**
 * Standalone Playwright config for file generation E2E tests.
 * Does NOT depend on the auth-states setup project.
 * Tests sign in directly via the UI.
 */
import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";

config();

export default defineConfig({
  testDir: "./tests/features",
  timeout: 180 * 1000,
  fullyParallel: false, // Run serially — E2B sessions are expensive
  retries: 0,
  workers: 1,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report-file-gen" }],
  ],
  use: {
    baseURL: "http://localhost:3001",
    ignoreHTTPSErrors: true,
    trace: "on-first-retry",
    screenshot: "on",
    video: "off",
    ...devices["Desktop Chrome"],
  },
  projects: [
    {
      name: "file-generation",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "BETTER_AUTH_URL=http://localhost:3001 pnpm dev --port 3001",
    url: "http://localhost:3001",
    reuseExistingServer: false,
    timeout: 120 * 1000,
  },
});
