import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e/playwright",
  // Updated timeout from snippet (was 45_000)
  timeout: 120000,
  // Updated expect timeout from snippet (was 5_000)
  expect: { timeout: 10000 },
  fullyParallel: true,
  retries: 0,
  reporter: [["html", { open: "never" }]],

  use: {
    // Uses process.env.BASE_URL || "http://localhost:3000" from snippet
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    headless: false,
    // Added viewport from snippet
    viewport: { width: 1366, height: 768 },
    // Added actionTimeout from snippet
    actionTimeout: 0,
    trace: "on-first-retry",
    // Retained from original config
    video: "retain-on-failure",
    // Retained from original config
    screenshot: "only-on-failure",
  },

  // Updated projects section from snippet to explicitly define browser and channel
  projects: [
    {
      name: "admin",
      use: { storageState: "e2e/states/admin.json", browserName: "chromium", channel: "msedge" },
    },
    {
      name: "team",
      use: { storageState: "e2e/states/team.json", browserName: "chromium", channel: "msedge" },
    },
    {
      name: "guest",
      use: { storageState: "e2e/states/guest.json", browserName: "chromium", channel: "msedge" },
    },
  ],

  webServer: {
    command: "npm run dev",
    port: 3000,
    reuseExistingServer: true,
  },
});