// Copyright (c) JupyterLite Contributors
// Distributed under the terms of the Modified BSD License.

import { test } from '@jupyterlab/galata';

import { expect } from '@playwright/test';

import type { ConsoleMessage } from '@playwright/test';

import { firefoxWaitForApplication, refreshFilebrowser } from './utils';

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

    await refreshFilebrowser({ page });
    expect(await page.notebook.isOpen(notebook)).toBeTruthy();
  });

  test('Create new workspace from UI using menu entry', async ({ page }) => {
    const workspaceName = 'test-workspace';

    const notebook = 'javascript.ipynb';
    await page.sidebar.open('left');
    await refreshFilebrowser({ page });
    await page.notebook.open(notebook);

    await page.waitForSelector('.jp-NotebookPanel');

    await page.menu.clickMenuItem('File>Workspaces>Save Current Workspace As…');

    await page.waitForSelector('.jp-Dialog');
    await page.fill('.jp-Dialog input[type="text"]', workspaceName);
    await page.click('.jp-Dialog .jp-mod-accept');

    // Allow JupyterLab's debounced workspace/layout save to flush to storage
    // (upstream debouncer delays persistence)
    await page.waitForTimeout(1000);

    await refreshFilebrowser({ page });

    const workspaceFile = `${workspaceName}.jupyterlab-workspace`;
    expect(await page.filebrowser.isFileListedInBrowser(workspaceFile)).toBeTruthy();
  });

  test('Switch workspaces using URL parameters', async ({ page }) => {
    await page.sidebar.open('left');
    await refreshFilebrowser({ page });

    const notebook1 = 'javascript.ipynb';
    await page.notebook.open(notebook1);
    await page.waitForSelector('.jp-NotebookPanel');
    // Allow JupyterLab's debounced workspace/layout save to flush to storage
    await page.waitForTimeout(1000);

    const customWorkspace = 'test-workspace';

    await page.goto(`lab/index.html?workspace=${customWorkspace}`);

    const notebookOpen = await page.notebook.isOpen(notebook1);
    expect(notebookOpen).toBeFalsy();

    // the URL should still contain the name of the current workspace
    expect(page.url()).toContain(`workspace=${customWorkspace}`);

    const notebook2 = 'intro.ipynb';
    await page.notebook.open(notebook2);

    await page.goto('lab/index.html');
    await page.waitForSelector('#jp-MainLogo');

    const originalNotebookRestored = await page.notebook.isOpen(notebook1);
    expect(originalNotebookRestored).toBeTruthy();

    expect(page.url()).not.toContain('workspace=');
  });

  test('Switch workspaces using workspace indicator in View menu', async ({ page }) => {
    // Create multiple workspaces to switch between
    const workspace1 = 'first';
    const workspace2 = 'second';

    // Navigate to first workspace and set up content
    await page.goto(`lab/index.html?workspace=${workspace1}`);
    await page.sidebar.open('left');
    await refreshFilebrowser({ page });

    const notebook1 = 'javascript.ipynb';
    await page.notebook.open(notebook1);
    await page.waitForSelector('.jp-NotebookPanel');
    // Allow JupyterLab's debounced workspace/layout save to flush to storage
    await page.waitForTimeout(1000);

    // Save first workspace to make it persistent
    await page.menu.clickMenuItem('File>Workspaces>Save Current Workspace As…');
    await page.waitForSelector('.jp-Dialog');
    await page.fill('.jp-Dialog input[type="text"]', workspace1);
    await page.click('.jp-Dialog .jp-mod-accept');
    await page.waitForTimeout(1000);

    // Navigate to second workspace and set up different content
    await page.goto(`lab/index.html?workspace=${workspace2}`);
    await page.waitForSelector('#jp-MainLogo');
    await page.sidebar.open('left');
    await refreshFilebrowser({ page });

    const notebook2 = 'intro.ipynb';
    await page.notebook.open(notebook2);
    await page.waitForSelector('.jp-NotebookPanel');
    // Allow JupyterLab's debounced workspace/layout save to flush to storage
    await page.waitForTimeout(1000);

    // Save second workspace
    await page.menu.clickMenuItem('File>Workspaces>Save Current Workspace As…');
    await page.waitForSelector('.jp-Dialog');
    await page.fill('.jp-Dialog input[type="text"]', workspace2);
    await page.click('.jp-Dialog .jp-mod-accept');
    // Allow JupyterLab's debounced workspace/layout save to flush to storage
    await page.waitForTimeout(1000);

    await page.menu.clickMenuItem('View>Appearance>Show Workspace Indicator');
    await page.waitForTimeout(500);

    // Test workspace switching using the workspace indicator
    const workspaceSelector = page.locator('.jp-WorkspaceSelector-header');
    await expect(workspaceSelector).toBeVisible();

    // Verify current workspace is displayed
    await expect(workspaceSelector).toContainText(workspace2);

    // Click to open workspace dropdown
    await workspaceSelector.click();
    await page.waitForSelector('.jp-WorkspaceSelector-dropdown');

    // Verify both workspaces are listed
    await expect(
      page.locator(`.jp-WorkspaceSelector-item:has-text("${workspace1}")`),
    ).toBeVisible();
    await expect(
      page.locator(`.jp-WorkspaceSelector-item:has-text("${workspace2}")`),
    ).toBeVisible();

    // Switch to first workspace via indicator
    await page.locator(`.jp-WorkspaceSelector-item:has-text("${workspace1}")`).click();

    // Wait for the expected notebook tab to appear
    await expect(
      page.getByRole('main').getByRole('tab', { name: notebook1 }),
    ).toBeVisible({ timeout: 10000 });

    // Verify workspace switch occurred
    expect(page.url()).toContain(`workspace=${workspace1}`);
    expect(await page.notebook.isOpen(notebook1)).toBeTruthy();
    expect(await page.notebook.isOpen(notebook2)).toBeFalsy();

    // Verify workspace indicator shows new workspace
    await expect(workspaceSelector).toContainText(workspace1);

    // Switch back to second workspace
    await workspaceSelector.click();
    await page.locator(`.jp-WorkspaceSelector-item:has-text("${workspace2}")`).click();

    // Wait for workspace restoration to complete
    await page.waitForTimeout(2000);

    // Wait for the expected notebook tab to appear
    await expect(
      page.getByRole('main').getByRole('tab', { name: notebook2 }),
    ).toBeVisible({ timeout: 10000 });

    // Verify switch back
    expect(page.url()).toContain(`workspace=${workspace2}`);
    expect(await page.notebook.isOpen(notebook2)).toBeTruthy();
    expect(await page.notebook.isOpen(notebook1)).toBeFalsy();
  });
});

/**
 * Tests for workspace loading behavior
 */
test.describe('Workspace Loading Tests', () => {
  test.use({
    waitForApplication: firefoxWaitForApplication,
  });

  test('No workspace warning on first page load', async ({ page, context }) => {
    await context.clearCookies();

    const warnings: string[] = [];
    page.on('console', (msg: ConsoleMessage) => {
      if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    await page.goto('lab/index.html');

    await page.waitForSelector('.jp-LauncherCard');

    const workspaceWarnings = warnings.filter(
      (w) =>
        w.includes('Failed to fetch workspace from local storage') ||
        w.includes('Failed to fetch id') ||
        w.includes('from StateDB') ||
        w.includes('Fetching workspace'),
    );

    expect(workspaceWarnings).toEqual([]);
  });
});
