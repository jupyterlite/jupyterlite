// Copyright (c) JupyterLite Contributors
// Distributed under the terms of the Modified BSD License.

import { test } from '@jupyterlab/galata';

import { expect } from '@playwright/test';

import { refreshFilebrowser } from './utils';

/**
 * Custom waitForApplication for workspace tests that doesn't depend on the launcher
 * since it might not be displayed on the page
 */
async function workspaceWaitForApplication({ baseURL }, use, testInfo) {
  const waitIsReady = async (page): Promise<void> => {
    await page.waitForSelector('#jp-MainLogo');
  };
  await use(waitIsReady);
}

test.use({
  waitForApplication: workspaceWaitForApplication,
});

test.describe('Workspace Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('lab/index.html');
    await page.sidebar.close('left');
  });

  test('Notebook restoration after page reload', async ({ page }) => {
    const notebook = 'javascript.ipynb';
    await page.sidebar.open('left');
    await refreshFilebrowser({ page });
    await page.notebook.open(notebook);
    expect(await page.notebook.isOpen(notebook)).toBeTruthy();

    await page.notebook.runCellByCell();
    await page.notebook.save();

    await page.reload();
    await page.sidebar.close('left');

    // Verify the notebook is restored and open
    await refreshFilebrowser({ page });
    expect(await page.notebook.isOpen(notebook)).toBeTruthy();
  });
});
