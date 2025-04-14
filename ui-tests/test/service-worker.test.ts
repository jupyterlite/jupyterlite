// Copyright (c) JupyterLite Contributors
// Distributed under the terms of the Modified BSD License.

import { test } from '@jupyterlab/galata';

import { expect } from '@playwright/test';

import { firefoxWaitForApplication } from './utils';

test.use({
  waitForApplication: firefoxWaitForApplication,
});

test.describe('Service Worker Tests', () => {
  // set a longe timeout as these tests use Pyodide
  test.setTimeout(120000);

  test.beforeEach(async ({ page }) => {
    await page.goto('lab/index.html');
  });

  test('Create files in multiple tabs', async ({ page }) => {
    const notebook = 'file-access.ipynb';

    await page.menu.clickMenuItem('Settings>Autosave Documents');

    await page.notebook.open(notebook);
    await page.notebook.runCellByCell();

    // open a new tab
    const [newTab] = await Promise.all([
      page.waitForEvent('popup'),
      page.menu.clickMenuItem('View>Open in Jupyter Notebook'),
    ]);

    await newTab.waitForSelector('.jp-Notebook');

    // close the notebook on the first tab
    await page.notebook.close(true);

    // execute all cells in the new tab
    // TODO: check if Galata can support multiple tabs
    await newTab.getByRole('menuitem', { name: 'Run', exact: true }).click();
    await newTab.getByRole('menuitem', { name: 'Run All Cells', exact: true }).click();

    const expectedOutput = 'test_dir/data_99.npy';
    // wait for the execution to finish
    await expect(newTab.getByText(expectedOutput)).toBeVisible();

    // re-run all the cells in the first tab
    await page.notebook.open(notebook);
    await page.notebook.runCellByCell();

    const nCells = await page.notebook.getCellCount();
    const output = await page.notebook.getCellTextOutput(nCells - 1);
    expect(output).toBeTruthy();
    expect(output![0]).toContain(expectedOutput);
  });
});
