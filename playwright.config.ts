import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e/playwright",
  timeout: 45_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  retries: 0,
  reporter: [["html", { open: "never" }]],

  use: {
    baseURL: "http://localhost:3000",
    headless: false,
    trace: "on-first-retry",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  // We use only Chromium (Edge)
  projects: [
    {
      name: "admin",
      use: {
        ...devices["Desktop Edge"],
        storageState: "e2e/states/admin.json",
      },
    },
    {
      name: "team",
      use: {
        ...devices["Desktop Edge"],
        storageState: "e2e/states/team.json",
      },
    },
    {
      name: "guest",
      use: {
        ...devices["Desktop Edge"],
        storageState: "e2e/states/guest.json",
      },
    },
  ],

  webServer: {
    command: "npm run dev",
    port: 3000,
    reuseExistingServer: true,
  },
});
