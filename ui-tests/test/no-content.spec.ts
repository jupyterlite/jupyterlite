// Copyright (c) JupyterLite Contributors
// Distributed under the terms of the Modified BSD License.

import { expect, test } from '@playwright/test';

test.use({
  baseURL: 'http://localhost:8002',
});

test.describe('No Content Tests', () => {
  test('No 404 errors when loading JupyterLite without content', async ({ page }) => {
    const notFoundResponses: string[] = [];

    // Listen for all network responses and capture 404s
    page.on('response', (response) => {
      if (response.status() === 404) {
        notFoundResponses.push(response.url());
      }
    });

    await page.goto('lab/index.html');

    await page.waitForSelector('.jp-LauncherCard');

    expect(notFoundResponses).toEqual([]);
  });
});
