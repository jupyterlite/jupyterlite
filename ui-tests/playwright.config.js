const baseConfig = require('@jupyterlab/galata/lib/playwright-config');

module.exports = {
  ...baseConfig,
  timeout: 240000,
  reporter: [[process.env.CI ? 'dot' : 'list'], ['html']],
  use: {
    appPath: '',
    baseURL: 'http://localhost:8000',
    autoGoto: false,
    video: 'retain-on-failure',
    acceptDownloads: true,
  },
  retries: 1,
};
