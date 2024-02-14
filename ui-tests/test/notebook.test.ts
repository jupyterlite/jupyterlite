// Copyright (c) JupyterLite Contributors
// Distributed under the terms of the Modified BSD License.

import { expect, test } from '@jupyterlab/galata';

import {
  notebooksWaitForApplication,
  openDirectory,
  treeWaitForApplication,
} from './utils';

test.describe('Notebook Tests', () => {
  test.use({
    waitForApplication: treeWaitForApplication,
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('tree/index.html');
    // create a new directory for now to avoid showing the default content
    const name = 'notebook';
    await page.menu.clickMenuItem('New>New Folder');
    await page.fill('.jp-DirListing-editor', name);
    await page.press('.jp-DirListing-editor', 'Enter');
    await openDirectory({ page, directory: name });
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
  test.use({
    waitForApplication: treeWaitForApplication,
  });

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
        await openDirectory({ page, directory });
      }

      const contextMenu = await page.menu.openContextMenu(
        `.jp-DirListing-content >> text="${name}"`,
      );
      if (!contextMenu) {
        throw new Error('Could not open the context menu');
      }
      await page.click('text=Open With');

      // Open the document
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

test.describe('Notebook favicons', () => {
  test.use({
    waitForApplication: notebooksWaitForApplication,
  });

  // this test can sometimes take longer to run as it uses the Pyodide kernel
  // TODO: remove
  test.setTimeout(120000);

  // TODO: rewrite with page.notebook when fixed upstream in Galata
  // and usable in Jupyter Notebook without active tabs
  // https://github.com/jupyterlab/jupyterlab/issues/11763
  test('Busy favicon when executing a cell', async ({ page }) => {
    await page.goto('notebooks/index.html?path=empty.ipynb');

    const getFavicon = async () => {
      return page.locator('link[rel="icon"]').first().getAttribute('href');
    };

    // wait for the kernel to be ready
    await page.hover('.jp-Notebook-ExecutionIndicator');
    await page.getByText('Kernel Status: Idle').waitFor();

    const favicon = await getFavicon();

    // execute a cell that takes 5 seconds to complete
    await page.getByRole('textbox').fill('import asyncio\nawait asyncio.sleep(5)');
    await page.keyboard.press('Control+Enter');

    const busyFavicon = await getFavicon();

    expect(busyFavicon).not.toEqual(favicon);
    expect(busyFavicon).toContain('busy');

    // wait for execution to complete
    await page.locator('.jp-InputArea-prompt >> text="[1]:"').first().waitFor();

    const finalFavicon = await getFavicon();
    expect(finalFavicon).toEqual(favicon);
  });
});

test.describe('Switch between Notebook and JupyterLab', () => {
  const NOTEBOOK = 'empty.ipynb';

  test.use({
    waitForApplication: async function ({ baseURL }, use, testInfo) {
      const waitIsReady = async (page): Promise<void> => {
        const selector = page.url().includes('lab')
          ? `text=${NOTEBOOK}`
          : '.jp-NotebookPanel';
        await page.waitForSelector(selector);
      };
      await use(waitIsReady);
    },
  });

  test('Open the notebook file browser', async ({ page }) => {
    await page.goto('lab/index.html');

    const [treePage] = await Promise.all([
      page.waitForEvent('popup'),
      page.menu.clickMenuItem('Help>Launch Jupyter Notebook File Browser'),
    ]);

    await treePage.waitForSelector('#filebrowser');

    expect(treePage.url()).toContain('tree');
  });

  test('Open a notebook with JupyterLab', async ({ page }) => {
    await page.goto(`notebooks/index.html?path=${NOTEBOOK}`);

    const [labPage] = await Promise.all([
      page.waitForEvent('popup'),
      page.locator('.jp-ToolbarButtonComponent >> text=JupyterLab').first().click(),
    ]);

    await labPage.waitForSelector('.jp-NotebookPanel');

    expect(labPage.url()).toContain('lab');
  });

  test('Open a notebook with Notebook', async ({ page }) => {
    await page.goto(`lab/index.html?path=${NOTEBOOK}`);

    const [notebookPage] = await Promise.all([
      page.waitForEvent('popup'),
      page.locator('.jp-ToolbarButtonComponent >> text=Notebook').first().click(),
    ]);

    await notebookPage.waitForSelector('.jp-NotebookPanel');

    expect(notebookPage.url()).toContain('notebooks');
  });
});
