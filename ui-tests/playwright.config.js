const baseConfig = require('@jupyterlab/galata/lib/playwright-config');

module.exports = {
  ...baseConfig,
  timeout: 240000,
  reporter: [[process.env.CI ? 'github' : 'list'], ['html']],
  retries: 1,
};
