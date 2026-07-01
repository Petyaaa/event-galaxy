// @ts-check
const { defineConfig, devices } = require("@playwright/test");

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://campuspulse:campuspulse_dev_password@127.0.0.1:55434/campuspulse_enterprise?schema=public";
const sessionSecret = process.env.SESSION_SECRET || "dev-secret-for-campuspulse-enterprise-tests";

module.exports = defineConfig({
  testDir: "./tests",
  timeout: 180_000,
  expect: {
    timeout: 15_000,
  },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:3010",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: `DATABASE_URL='${databaseUrl}' SESSION_SECRET='${sessionSecret}' npx -y node@20 node_modules/next/dist/bin/next dev -p 3010 --hostname 127.0.0.1`,
    url: "http://127.0.0.1:3010/api/health",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
