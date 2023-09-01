const baseConfig = require('@jupyterlab/galata/lib/playwright-config');

module.exports = {
  ...baseConfig,
  use: {
    appPath: '',
    autoGoto: false,
    baseURL: 'http://localhost:8000',
    video: 'retain-on-failure',
  },
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
