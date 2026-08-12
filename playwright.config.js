const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  timeout: 15000,
  fullyParallel: false,
  workers: 1,
  reporter: "line",
  use: {
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    viewport: { width: 1280, height: 800 }
  }
});
