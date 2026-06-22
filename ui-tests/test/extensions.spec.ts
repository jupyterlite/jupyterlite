// Copyright (c) JupyterLite Contributors
// Distributed under the terms of the Modified BSD License.

import { test } from '@jupyterlab/galata';

import { expect } from '@playwright/test';

import { firefoxWaitForApplication } from './utils';

test.use({
  waitForApplication: firefoxWaitForApplication,
});

test.describe('Extension Manager', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('lab/index.html');
    await page.sidebar.openTab('extensionmanager.main-view');
  });

  test('should list the pre-installed extensions', async ({ page }) => {
    const panel = page.locator('.jp-extensionmanager-view');
    await expect(panel).toBeVisible();

    // the prebuilt extensions shipped with the site are listed as installed
    const names = panel.locator('.jp-extensionmanager-entry-name');
    await expect(names.first()).toBeVisible();

    // the kernel extension is always part of the deployment
    await expect(
      names.filter({ hasText: '@jupyterlite/pyodide-kernel-extension' }),
    ).toHaveCount(1);
  });

  test('should be a display-only listing', async ({ page }) => {
    const panel = page.locator('.jp-extensionmanager-view');
    await expect(panel.locator('.jp-extensionmanager-entry').first()).toBeVisible();

    // the per-entry action buttons (install / enable / disable) are not shown
    await expect(
      panel.locator('.jp-extensionmanager-entry-buttons').first(),
    ).toBeHidden();

    // the security disclaimer does not apply and is hidden
    await expect(panel.locator('.jp-extensionmanager-disclaimer')).toBeHidden();
  });
});
