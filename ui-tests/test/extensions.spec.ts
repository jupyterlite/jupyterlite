// Copyright (c) Jupyter Development Team.
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

  test('should list the extensions shipped with the site', async ({ page }) => {
    const panel = page.locator('.jp-extensionmanager-view');
    await expect(panel).toBeVisible();

    // the kernel extension is always part of the deployment
    const entry = panel.locator('.jp-extensionmanager-entry', {
      hasText: '@jupyterlite/pyodide-kernel-extension',
    });
    await expect(entry).toHaveCount(1);
    await expect(entry.locator('.jp-extensionmanager-entry-version')).toHaveText(
      /^\d+\.\d+\.\d+/,
    );
  });

  test('should be a read-only listing', async ({ page }) => {
    const panel = page.locator('.jp-extensionmanager-view');
    await expect(panel.locator('.jp-extensionmanager-entry').first()).toBeVisible();

    // no install, uninstall, enable or disable actions
    await expect(panel.locator('.jp-extensionmanager-entry-buttons')).toHaveCount(0);

    // no registry to discover extensions from
    await expect(panel.locator('.jp-extensionmanager-searchresults')).toHaveCount(0);
  });
});
