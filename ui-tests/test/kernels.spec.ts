// Copyright (c) JupyterLite Contributors
// Distributed under the terms of the Modified BSD License.

import { test } from '@jupyterlab/galata';

import { expect } from '@playwright/test';

import { firefoxWaitForApplication } from './utils';

test.use({
  waitForApplication: firefoxWaitForApplication,
});

test.describe('Kernels', () => {
  test('Basic code execution', async ({ page }) => {
    await page.goto('lab/index.html');
    const name = 'javascript.ipynb';
    await page.filebrowser.open(name);
    await page.notebook.run();
    await page.notebook.save();

    const output = await page.notebook.getCellTextOutput(2);
    expect(output).toBeTruthy();
  });

  test('Default kernel name', async ({ page }) => {
    // mock the default kernel name
    await page.route('jupyter-lite.json', async (route, request) => {
      const response = await page.request.fetch(route.request());
      const body = await response.json();
      body['jupyter-config-data'].defaultKernelName = 'javascript';
      return route.fulfill({
        response,
        body: JSON.stringify(body),
        headers: {
          ...response.headers(),
        },
      });
    });

    await page.goto('lab/index.html');
    await page.sidebar.close('left');

    const imageName = 'default-kernel-name.png';
    expect(await page.screenshot()).toMatchSnapshot(imageName.toLowerCase());
  });

  // check it is possible to open a notebook, shut down its kernel and open it again
  test('Kernel shutdown', async ({ page }) => {
    // this test can sometimes take longer to run as it uses the Pyodide kernel
    // TODO: remove
    test.setTimeout(120000);

    await page.goto('lab/index.html');
    const name = await page.notebook.createNew();
    if (!name) {
      throw new Error('Notebook name is undefined');
    }

    await page.notebook.save();
    await page.notebook.close(true);

    // shut down the kernel
    await page.getByTitle('Running Terminals and Kernels').first().click();
    await page
      .locator(`.jp-RunningSessions-item.jp-TreeItem.jp-mod-kernel >> text="${name}"`)
      .first()
      .waitFor();
    await page.locator('.jp-RunningSessions-item.jp-mod-kernel').first().hover();
    await page.getByTitle('Shut Down').first().click();

    // re-open the notebook
    await page.sidebar.openTab('filebrowser');
    await page.filebrowser.open(name);

    // try running cells
    await page.notebook.setCell(0, 'code', '2 + 2');
    await page.notebook.run();
    const output = await page.notebook.getCellTextOutput(0);

    expect(output).toBeTruthy();
    expect(output![0]).toBe('4');
  });

  test('Multiple kernel restarts', async ({ page }) => {
    // Common selectors
    const runningKernelsTab = page.getByTitle('Running Terminals and Kernels').first();
    const kernelSelector = '.jp-RunningSessions-item.jp-mod-kernel';
    const notebookReady = '.jp-Notebook.jp-mod-commandMode';

    await page.goto('lab/index.html');

    const name = await page.notebook.createNew();
    if (!name) {
      throw new Error('Notebook name is undefined');
    }

    // Run initial cell to verify kernel works
    await page.notebook.setCell(0, 'code', 'console.log("Initial run")');
    await page.notebook.run();
    let output = await page.notebook.getCellTextOutput(0);
    expect(output).toBeTruthy();
    expect(output![0].trim()).toBe('Initial run');

    // Verify only one kernel is running
    await runningKernelsTab.click();
    await page.locator(kernelSelector).first().waitFor();
    const initialKernels = await page.locator(kernelSelector).count();
    expect(initialKernels).toBe(1);

    // Perform multiple restarts
    for (let i = 0; i < 3; i++) {
      // Add a new cell for this iteration
      await page.notebook.addCell('code', `console.log("After restart ${i + 1}")`);

      // Restart the kernel and run all cells
      await page.menu.clickMenuItem('Kernel>Restart Kernel and Run All Cells…');
      await page.getByRole('button', { name: 'Confirm Kernel Restart' }).click();

      // Wait for kernel to be ready and cells to execute
      await page.waitForSelector(notebookReady);
      await page.waitForSelector(
        `.jp-Cell-outputArea >> text="After restart ${i + 1}"`,
      );

      // Get the output of the last cell
      const lastCellIndex = i + 1;
      output = await page.notebook.getCellTextOutput(lastCellIndex);
      expect(output).toBeTruthy();
      expect(output![0].trim()).toBe(`After restart ${i + 1}`);

      // Verify still only one kernel
      await runningKernelsTab.click();
      const kernels = await page.locator(kernelSelector).count();
      expect(kernels).toBe(1);
    }

    // add and run a final cell
    await page.notebook.addCell('code', 'console.log("Final check")');
    await page.notebook.run();
    output = await page.notebook.getCellTextOutput(4);
    expect(output).toBeTruthy();
    expect(output![0].trim()).toBe('Final check');
  });
});
