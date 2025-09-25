// Copyright (c) JupyterLite Contributors
// Distributed under the terms of the Modified BSD License.

import * as path from 'path';

import { promises as fs } from 'fs';

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

    await page.notebook.close();
    // wait for the state to be saved
    // TODO: find a better way than waiting?
    await page.waitForTimeout(1000);

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
    await page.notebook.save();
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
    await page.notebook.save();
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

  test('Download a custom file type', async ({ page }) => {
    await refreshFilebrowser({ page });
    await page.filebrowser.open('test.customfile');
    const path = await download({ page, path: 'test.customfile' });
    expect(path).toBeTruthy();

    const content = await fs.readFile(path, { encoding: 'utf-8' });
    const lines = content.split('\n');

    // check the file is correctly formatted
    expect(lines.length).toBeGreaterThan(1);

    const parsed = JSON.parse(content);

    expect(parsed.hello).toEqual('coucou');
  });

  test('Open in New Browser Tab with server files', async ({ page }) => {
    const testFile = 'README.md';
    await refreshFilebrowser({ page });

    expect(await page.filebrowser.isFileListedInBrowser(testFile)).toBeTruthy();

    const clickMenuItem = async (command): Promise<void> => {
      await page.menu.openContextMenuLocator(
        `.jp-DirListing-content >> text="${testFile}"`,
      );
      await page.getByText(command).click();
    };

    const [newTab] = await Promise.all([
      page.waitForEvent('popup'),
      clickMenuItem('Open in New Browser Tab'),
    ]);

    await newTab.waitForLoadState('networkidle');

    expect(newTab.url()).toContain(testFile);

    const content = await newTab.textContent('body');
    const text = 'This folder contains example notebooks and files';
    expect(content).toContain(text);

    await newTab.close();
  });

  test('Open in New Browser Tab should work with newly created text file', async ({
    page,
  }) => {
    await page.menu.clickMenuItem('File>New>Text File');

    await page.waitForSelector('.jp-FileEditor');

    const testContent =
      'This is a test text file created during testing.\nSecond line of content.';
    await page.locator('.jp-FileEditor .cm-content').fill(testContent);

    await page.menu.clickMenuItem('File>Save Text');

    await page.waitForSelector('.jp-Dialog');
    await page.getByRole('button', { name: 'Rename and Save' }).click();

    await refreshFilebrowser({ page });

    const fileName = 'untitled.txt';
    expect(await page.filebrowser.isFileListedInBrowser(fileName)).toBeTruthy();

    const clickMenuItem = async (command): Promise<void> => {
      await page.menu.openContextMenuLocator(
        `.jp-DirListing-content >> text="${fileName}"`,
      );
      await page.getByText(command).click();
    };

    const [newTab] = await Promise.all([
      page.waitForEvent('popup'),
      clickMenuItem('Open in New Browser Tab'),
    ]);

    expect(newTab).toBeTruthy();

    await newTab.waitForLoadState('networkidle');

    const content = await newTab.textContent('body');
    expect(content).toContain('This is a test text file created during testing.');
    expect(content).toContain('Second line of content.');

    await newTab.close();
  });

  test('DriveFS readlink raises error 28 (EINVAL)', async ({ page }) => {
    // this test can sometimes take longer to run as it uses the Pyodide kernel
    test.setTimeout(120000);

    const notebook = 'empty.ipynb';
    await page.notebook.open(notebook);

    // readlink call on directory in DriveFS.
    await page.notebook.setCell(0, 'code', 'import os; os.readlink("/")');

    // readlink call on directory not in DriveFS.
    await page.notebook.addCell('code', 'os.readlink("/drive")');

    await page.notebook.runCellByCell();

    const output0 = await page.notebook.getCellTextOutput(0);
    expect(output0).toBeTruthy();
    expect(output0![0]).toMatch("OSError: [Errno 28] Invalid argument: '/'");

    const output1 = await page.notebook.getCellTextOutput(1);
    expect(output1![0]).toMatch("OSError: [Errno 28] Invalid argument: '/drive'");
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
      await page.notebook.save();

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

test.describe('Clear Browser Data', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('lab/index.html');
  });

  test('Clear browser data should remove files', async ({ page }) => {
    const name = await page.notebook.createNew();
    if (!name) {
      throw new Error('Notebook name is undefined');
    }
    await page.notebook.save();
    await page.notebook.close();

    expect(await page.filebrowser.isFileListedInBrowser(name)).toBeTruthy();

    await page.menu.clickMenuItem('Help>Clear Browser Data');

    // Checkboxes are checked by default
    await page.getByRole('button', { name: 'Clear' }).click();

    // The page should reload, wait for it to be ready again
    await page.waitForLoadState('networkidle');
    await page.locator('.jp-Launcher').waitFor();

    // Check that the notebook is gone after reload
    await refreshFilebrowser({ page });
    expect(await page.filebrowser.isFileListedInBrowser(name)).toBeFalsy();
  });

  test('Clear only settings should preserve files', async ({ page }) => {
    const name = await page.notebook.createNew();

    if (!name) {
      throw new Error('Notebook name is undefined');
    }
    await page.notebook.save();
    await page.notebook.close();

    // wait for the state to be saved
    // TODO: find a better way than waiting?
    await page.waitForTimeout(1000);

    expect(await page.filebrowser.isFileListedInBrowser(name)).toBeTruthy();

    // Open the Clear Browser Data dialog from the Help menu
    await page.menu.clickMenuItem('Help>Clear Browser Data');

    // Only check settings, leave contents unchecked
    await page.locator('input#jp-ClearData-settings').check();
    await page.locator('input#jp-ClearData-contents').uncheck();

    await page.getByRole('button', { name: 'Clear' }).click();

    // The page should reload, wait for it to be ready again
    await page.waitForLoadState('networkidle');
    await page.locator('.jp-Launcher').waitFor();

    // Check that the notebook still exists after reload
    await refreshFilebrowser({ page });
    expect(await page.filebrowser.isFileListedInBrowser(name)).toBeTruthy();
  });

  test('Clear settings should reset theme to light theme', async ({ page }) => {
    // First switch to the dark theme
    await page.theme.setDarkTheme();

    // Open the Clear Browser Data dialog from the Help menu
    await page.menu.clickMenuItem('Help>Clear Browser Data');

    // Only check settings
    await page.locator('input#jp-ClearData-settings').check();
    await page.locator('input#jp-ClearData-contents').uncheck();

    await page.getByRole('button', { name: 'Clear' }).click();

    // The page should reload, wait for it to be ready again
    await page.waitForLoadState('networkidle');
    await page.locator('.jp-Launcher').waitFor();

    // Verify theme is reset to light theme (default)
    expect(await page.theme.getTheme()).toBe('JupyterLab Light');
  });
});
