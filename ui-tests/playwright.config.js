// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

const baseConfig = require('@jupyterlab/galata/lib/playwright-config');

const blobOptions = process.env.BLOB_FILENAME
  ? { fileName: process.env.BLOB_FILENAME }
  : {};

module.exports = {
  ...baseConfig,
  retries: 1,
  expect: {
    // Give assertions made right after a page load, a reload or an upload
    // more room than the 5 seconds Playwright uses by default.
    timeout: 15000,
  },
  tag: process.env.PLAYWRIGHT_TEST_TAG,
  reporter: process.env.CI
    ? [
        ['blob', blobOptions],
        ['json', { outputFile: 'test-results/report.json' }],
      ]
    : [['list'], ['html', { open: 'on-failure' }]],
  use: {
    acceptDownloads: true,
    appPath: '',
    autoGoto: false,
    baseURL: 'http://localhost:8000',
    trace: 'retain-on-failure',
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
    {
      command: 'jlpm run start:no-content',
      port: 8002,
      timeout: 120 * 1000,
      reuseExistingServer: true,
    },
  ],
};
