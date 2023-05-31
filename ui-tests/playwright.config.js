const baseConfig = require('@jupyterlab/galata/lib/playwright-config');

module.exports = {
  ...baseConfig,
  timeout: 240000,
  reporter: [[process.env.CI ? 'github' : 'list'], ['html']],
  retries: 1,
  webServer: [
    {
      command: 'jlpm run start',
      port: 8000,
      timeout: 120 * 1000,
      reuseExistingServer: true,
    },
    {
      command: 'jlpm run start:embed',
      port: 8001,
      timeout: 120 * 1000,
      reuseExistingServer: true,
    },
  ],
};
