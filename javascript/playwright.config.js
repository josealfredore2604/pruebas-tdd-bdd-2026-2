const { defineConfig } = require('@playwright/test');

const puerto = 3100;

module.exports = defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: `http://localhost:${puerto}`,
  },
  webServer: {
    command: 'node src/server.js',
    url: `http://localhost:${puerto}`,
    env: { PORT: String(puerto) },
    reuseExistingServer: !process.env.CI,
  },
});
