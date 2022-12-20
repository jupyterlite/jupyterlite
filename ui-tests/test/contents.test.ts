// Copyright (c) JupyterLite Contributors
// Distributed under the terms of the Modified BSD License.

import * as path from 'path';

import * as fs from 'fs/promises';

import { test } from '@jupyterlab/galata';

import { expect } from '@playwright/test';

import { config, createNewDirectory, deleteItem, download } from './utils';

test.use(config);

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
    await page.filebrowser.refresh();
    await page.notebook.open(notebook);
    expect(await page.notebook.isOpen(notebook)).toBeTruthy();

    await page.notebook.activate(notebook);
    expect(await page.notebook.isActive(notebook)).toBeTruthy();

    await page.notebook.runCellByCell();
  });

  test('Open a file in a subfolder existing on the server', async ({ page }) => {
    const file = 'data/iris.csv';
    await page.filebrowser.refresh();
    await page.filebrowser.open(file);
    expect(
      await page.filebrowser.isFileListedInBrowser(path.basename(file))
    ).toBeTruthy();
  });

  test('Create a new notebook, edit and reload', async ({ page }) => {
    const name = await page.notebook.createNew();

    await page.notebook.setCell(0, 'markdown', '## This is a markdown cell');
    await page.notebook.addCell('raw', 'This is a raw cell');
    await page.notebook.addCell('code', '2 + 2');

    await page.notebook.run();
    await page.notebook.save();

    expect((await page.notebook.getCellTextOutput(2))[0]).toBe('4');

    await page.reload();
    expect(
      await page.filebrowser.isFileListedInBrowser(path.basename(name))
    ).toBeTruthy();

    await page.notebook.open(name);

    expect((await page.notebook.getCellTextOutput(2))[0]).toBe('4');
  });

  test('Create a new notebook and delete it', async ({ page }) => {
    const name = await page.notebook.createNew();
    await page.notebook.close();

    expect(await page.filebrowser.isFileListedInBrowser(name)).toBeTruthy();

    await deleteItem({ page, name });
    await page.filebrowser.refresh();

    expect(await page.filebrowser.isFileListedInBrowser(name)).toBeFalsy();
  });

  test('Create a new folder with content and delete it', async ({ page }) => {
    const name = 'Custom Name';
    await createNewDirectory({ page, name });
    expect(await page.filebrowser.isFileListedInBrowser(name)).toBeTruthy();

    await page.filebrowser.openDirectory(name);
    await page.notebook.createNew();
    await page.notebook.close();
    await page.filebrowser.openHomeDirectory();
    await deleteItem({ page, name });
    await page.filebrowser.refresh();

    expect(await page.filebrowser.isFileListedInBrowser(name)).toBeFalsy();
  });

  test('Download a notebook', async ({ page }) => {
    const name = await page.notebook.createNew();
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
