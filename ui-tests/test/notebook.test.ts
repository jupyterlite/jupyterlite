// Copyright (c) JupyterLite Contributors
// Distributed under the terms of the Modified BSD License.

import { test } from '@jupyterlab/galata';

import { expect } from '@playwright/test';

import { treeWaitForApplication } from './utils';

test.use({
  waitForApplication: treeWaitForApplication,
});

test.describe('Notebook Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('tree/index.html');
    // create a new directory for now to avoid showing the default content
    const name = 'notebook';
    await page.menu.clickMenuItem('New>New Folder');
    await page.fill('.jp-DirListing-editor', name);
    await page.filebrowser.openDirectory(name);
  });

  test('Tree Screen', async ({ page }) => {
    const imageName = 'tree.png';
    expect(await page.screenshot()).toMatchSnapshot(imageName.toLowerCase());
  });

  test('Toggle Dark theme', async ({ page }) => {
    await page.theme.setDarkTheme();
    const imageName = 'dark-theme.png';
    expect(await page.screenshot()).toMatchSnapshot(imageName.toLowerCase());
  });

  test('Toggle Light theme', async ({ page }) => {
    await page.theme.setDarkTheme();
    await page.theme.setLightTheme();

    expect(await page.theme.getTheme()).toEqual('JupyterLab Light');
  });
});

test.describe('Notebook file opener', () => {
  const files = [
    {
      name: 'intro.ipynb',
      factory: 'JSON',
      imageName: 'notebook-as-json.png',
    },
    {
      directory: 'data',
      name: 'matplotlib.png',
      factory: 'Image',
      imageName: 'imageviewer.png',
    },
    {
      directory: 'data',
      name: 'iris.csv',
      factory: 'CSV Viewer',
      imageName: 'csvviewer.png',
    },
  ];

  files.forEach((file) => {
    const { name, directory, factory, imageName } = file;
    test(`Open ${name} with the ${factory} factory`, async ({ page }) => {
      await page.goto('tree/index.html');

      if (directory) {
        await page.filebrowser.openDirectory(directory);
      }

      const contextMenu = await page.menu.openContextMenu(
        `.jp-DirListing-content >> text="${name}"`,
      );
      if (!contextMenu) {
        throw new Error('Could not open the context menu');
      }
      await page.click('text=Open With');

      // Create a new notebook
      const [documentTab] = await Promise.all([
        page.waitForEvent('popup'),
        page.click(`.lm-Menu-itemLabel >> text=${factory}`),
      ]);

      await documentTab.waitForLoadState('domcontentloaded');

      const checkpointLocator = '.jp-NotebookCheckpoint';
      // wait for the checkpoint indicator to be displayed
      await documentTab.waitForSelector(checkpointLocator);

      // set the amount of seconds manually since it might display something different at each run
      await documentTab
        .locator(checkpointLocator)
        .evaluate((element) => (element.innerHTML = 'Last Checkpoint: 3 seconds ago'));

      expect(await documentTab.screenshot()).toMatchSnapshot(imageName.toLowerCase());

      await documentTab.close();
    });
  });
});
