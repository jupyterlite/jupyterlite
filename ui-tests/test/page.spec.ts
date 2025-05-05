// Copyright (c) JupyterLite Contributors
// Distributed under the terms of the Modified BSD License.

import { expect, test } from '@playwright/test';

test.describe('Page Tests', () => {
  test.beforeEach(async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'This test only runs on Chromium');

    const context = page.context();
    const cdpSession = await context.newCDPSession(page);
    // simulate a slow CPU so the loading of the page takes longer
    await cdpSession.send('Emulation.setCPUThrottlingRate', { rate: 6 });
  });

  // Use plain Playwright for these tests since Galata waits for a JupyterLab element
  // to be visible before it considers the page loaded.
  test('Loading Indicator', async ({ page }) => {
    await page.goto('lab/index.html');

    const loadingIndicator = page.locator('#jupyterlite-loading-indicator');
    await loadingIndicator.waitFor({ state: 'visible' });

    await expect(loadingIndicator.getByText('Loading JupyterLite...')).toBeVisible();
    await loadingIndicator.waitFor({ state: 'hidden' });

    expect(await loadingIndicator.isVisible()).toBeFalsy();

    // check JupyterLab loads properly
    await page.locator('#jupyterlab-splash').waitFor({ state: 'detached' });
    await page.locator('.jp-Launcher').waitFor({ state: 'visible' });
  });

  test('No Loading Indicator on REPL Page', async ({ page }) => {
    await page.goto('repl/index.html');

    const loadingIndicator = page.locator('#jupyterlite-loading-indicator');

    const isIndicatorVisible = await loadingIndicator.isVisible().catch(() => false);
    expect(isIndicatorVisible).toBeFalsy();

    await expect(page.locator('.jp-CodeConsole')).toBeVisible({ timeout: 30000 });
  });

  test('Dark theme', async ({ page }) => {
    await page.goto('lab/index.html');
    await page.locator('.jp-Launcher').waitFor({ state: 'visible' });

    await page.getByRole('menuitem', { name: 'Settings' }).click();
    await page.locator('li[data-type=submenu]', { hasText: /^Theme$/ }).click();
    await page.getByRole('menuitem', { name: 'JupyterLab Dark', exact: true }).click();

    await page.reload();

    // Check if the dark theme class is applied to the body
    await expect(page.locator('body')).toHaveClass(/jp-mod-dark/, { timeout: 30000 });
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(17, 17, 17)');
  });
});
