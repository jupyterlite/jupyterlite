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
});
