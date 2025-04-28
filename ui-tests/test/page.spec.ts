// Copyright (c) JupyterLite Contributors
// Distributed under the terms of the Modified BSD License.

import { expect, test } from '@playwright/test';

test.describe('Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    const context = page.context();
    const cdpSession = await context.newCDPSession(page);
    // simulate a slow CPU to the loading of the page takes longer
    await cdpSession.send('Emulation.setCPUThrottlingRate', { rate: 6 });
  });

  // Use plain Playwright for these tests since Galata waits for a JupyterLab element
  // to be visible before it considers the page loaded.
  test('Loading Indicator', async ({ page }) => {
    await page.goto('lab/index.html');

    const loadingIndicator = page.locator('#jupyterlite-loading-indicator');
    await loadingIndicator.waitFor({ state: 'visible' });

    expect(loadingIndicator.getByText('Loading JupyterLite...')).toBeTruthy();

    await loadingIndicator.waitFor({ state: 'hidden' });

    expect(await loadingIndicator.isVisible()).toBeFalsy();

    // check JupyterLab loads properly
    await page.locator('#jupyterlab-splash').waitFor({ state: 'detached' });
    await page.locator('.jp-Launcher').waitFor({ state: 'visible' });
  });
});
