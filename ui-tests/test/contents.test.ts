// Copyright (c) JupyterLite Contributors
// Distributed under the terms of the Modified BSD License.

import * as path from 'path';

import * as fs from 'fs/promises';

import { test } from '@jupyterlab/galata';

import { expect } from '@playwright/test';

import {
  createNewDirectory,
  deleteItem,
  download,
  isDirectoryListedInBrowser,
  openDirectory,
  refreshFilebrowser,
  treeWaitForApplication,
} from './utils';

import { firefoxWaitForApplication } from './utils';

test.use({
  waitForApplication: firefoxWaitForApplication,
});

test.describe('Contents Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('lab/index.html');
  });

  // TODO: Galata should support uploading files via the serviceManager.contents API
  // so it works in JupyterLite
  // ('Upload File', async ({ page, tmpPath }) => {
  //   const file = 'package.json';
  //   const renamed = 'renamed.json';
  //   await page.contents.uploadFile(
  //     path.resolve(__dirname, `../${file}`),
  //     `${tmpPath}/${file}`
  //   );
  //   await page.contents.renameFile(`${tmpPath}/${file}`, `${tmpPath}/${renamed}`);
  //   expect(await page.contents.fileExists(`${tmpPath}/${renamed}`)).toEqual(true);
  // });

  test('Open a file existing on the server', async ({ page }) => {
    const notebook = 'javascript.ipynb';
    await refreshFilebrowser({ page });
    await page.notebook.open(notebook);
    expect(await page.notebook.isOpen(notebook)).toBeTruthy();

    // TODO: uncomment after it is fixed upstream in Galata
    // https://github.com/jupyterlab/jupyterlab/issues/15093
    // await page.notebook.activate(notebook);
    // expect(await page.notebook.isActive(notebook)).toBeTruthy();

    await page.notebook.runCellByCell();
  });

  test('Edit a file existing on the server should not create a duplicate', async ({
    page,
  }) => {
    const notebook = 'javascript.ipynb';

    await page.notebook.open(notebook);
    await page.notebook.addCell('code', '2 + 2');
    await page.notebook.save();
    const entries = page.locator(`.jp-DirListing-content >> text="${notebook}"`);
    const count = await entries.count();
    expect(count).toBe(1);
  });

  test('Open a file in a subfolder existing on the server', async ({ page }) => {
    const file = 'data/iris.csv';
    await refreshFilebrowser({ page });
    await page.filebrowser.open(file);
    expect(
      await page.filebrowser.isFileListedInBrowser(path.basename(file)),
    ).toBeTruthy();
  });

  test('Create a new notebook, edit and reload', async ({ page }) => {
    // this test can sometimes take longer to run as it uses the Pyodide kernel
    test.setTimeout(120000);

    const name = await page.notebook.createNew();
    if (!name) {
      throw new Error('Notebook name is undefined');
    }

    await page.notebook.setCell(0, 'markdown', '## This is a markdown cell');
    await page.notebook.addCell('raw', 'This is a raw cell');
    await page.notebook.addCell('code', '2 + 2');

    await page.notebook.run();
    await page.notebook.save();

    const output = await page.notebook.getCellTextOutput(2);

    expect(output).toBeTruthy();
    expect(output![0]).toBe('4');

    await page.reload();
    expect(
      await page.filebrowser.isFileListedInBrowser(path.basename(name)),
    ).toBeTruthy();

    await page.notebook.open(name);

    const output2 = await page.notebook.getCellTextOutput(2);

    expect(output2).toBeTruthy();
    expect(output2![0]).toBe('4');
  });

  test('Create a new notebook and delete it', async ({ page }) => {
    const name = await page.notebook.createNew();
    if (!name) {
      throw new Error('Notebook name is undefined');
    }
    await page.notebook.close();

    expect(await page.filebrowser.isFileListedInBrowser(name)).toBeTruthy();

    await deleteItem({ page, name });
    await refreshFilebrowser({ page });

    expect(await page.filebrowser.isFileListedInBrowser(name)).toBeFalsy();
  });

  test('Create a new folder with content and delete it', async ({ page }) => {
    const name = 'Custom';
    await createNewDirectory({ page, name });
    expect(await isDirectoryListedInBrowser({ page, name })).toBeTruthy();

    await openDirectory({ page, directory: name });
    await page.notebook.createNew();
    await page.notebook.close();
    await page.filebrowser.openHomeDirectory();
    await deleteItem({ page, name });
    await refreshFilebrowser({ page });

    expect(await isDirectoryListedInBrowser({ page, name })).toBeFalsy();
  });

  test('Download a notebook', async ({ page }) => {
    const name = await page.notebook.createNew();
    if (!name) {
      throw new Error('Notebook name is undefined');
    }
    const source = '## Markdown cell';
    await page.notebook.setCell(0, 'markdown', source);
    await page.notebook.save();

    const path = await download({ page, path: name });
    expect(path).toBeTruthy();

    const content = await fs.readFile(path, { encoding: 'utf-8' });
    const lines = content.split('\n');

    // check the file is correctly formatted
    expect(lines.length).toBeGreaterThan(1);

    const parsed = JSON.parse(content);

    expect(parsed.cells[0].source).toEqual(source);
  });
});

test.describe('Copy shareable link', () => {
  // Playwright allows setting clipboard permissions only for Chromium
  // https://github.com/microsoft/playwright/issues/13037
  test.skip(({ browserName }) => browserName !== 'chromium', 'Chromium only!');
  test.use({
    permissions: ['clipboard-read', 'clipboard-write'],
  });

  const copyShareableLink = 'Copy Shareable Link';

  test.describe('JupyterLab application', () => {
    test('Copy shareable link in JupyterLab', async ({ page, baseURL }) => {
      await page.goto('lab/index.html');

      const name = await page.notebook.createNew();

      await page.sidebar.openTab('filebrowser');
      const contextmenu = await page.menu.openContextMenu(
        `.jp-DirListing-content >> text="${name}"`,
      );
      if (!contextmenu) {
        throw new Error('Could not open the context menu');
      }
      const item = await page.menu.getMenuItemInMenu(contextmenu, copyShareableLink);
      if (!item) {
        throw new Error(`${copyShareableLink} menu item is missing`);
      }
      await item.click();

      const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboardText).toEqual(`${baseURL}/lab/index.html?path=${name}`);
    });
  });

  test.describe('Notebook application', () => {
    test.use({
      waitForApplication: treeWaitForApplication,
    });

    test.beforeEach(async ({ page }) => {
      await page.goto('tree/index.html');
    });

    test('Copy Shareable Link to a notebook file', async ({ page, baseURL }) => {
      const name = 'javascript.ipynb';
      const contextmenu = await page.menu.openContextMenu(
        `.jp-DirListing-content >> text="${name}"`,
      );
      if (!contextmenu) {
        throw new Error('Could not open the context menu');
      }
      const item = await page.menu.getMenuItemInMenu(contextmenu, copyShareableLink);
      if (!item) {
        throw new Error(`${copyShareableLink} menu item is missing`);
      }
      await item.click();

      const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboardText).toEqual(`${baseURL}/notebooks/index.html?path=${name}`);
    });

    test('Copy Shareable Link to a markdown file', async ({ page, baseURL }) => {
      const name = 'README.md';
      const contextmenu = await page.menu.openContextMenu(
        `.jp-DirListing-content >> text="${name}"`,
      );
      if (!contextmenu) {
        throw new Error('Could not open the context menu');
      }
      const item = await page.menu.getMenuItemInMenu(contextmenu, copyShareableLink);
      if (!item) {
        throw new Error(`${copyShareableLink} menu item is missing`);
      }
      await item.click();

      const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboardText).toEqual(`${baseURL}/edit/index.html?path=${name}`);
    });
  });
});
