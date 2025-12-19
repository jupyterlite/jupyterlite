// Copyright (c) JupyterLite Contributors
// Distributed under the terms of the Modified BSD License.

import { test } from '@jupyterlab/galata';

import { expect } from '@playwright/test';

import { firefoxWaitForApplication } from './utils';

const NO_CONTENT_URL = 'http://localhost:8002';

test.use({
  waitForApplication: firefoxWaitForApplication,
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

    await page.goto(`${NO_CONTENT_URL}/lab/index.html`);

    await page.waitForSelector('.jp-LauncherCard');

    expect(notFoundResponses).toEqual([]);
  });
});
