// Copyright (c) JupyterLite Contributors
// Distributed under the terms of the Modified BSD License.

import { test } from '@jupyterlab/galata';

import { expect } from '@playwright/test';

import { firefoxWaitForApplication, notebooksWaitForApplication } from './utils';

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

  test('Stdin using pyodide kernel', async ({ page }) => {
    // this test can sometimes take longer to run as it uses the Pyodide kernel
    test.setTimeout(120000);

    const notebook = 'stdin.ipynb';

    await page.goto('lab/index.html');
    await page.notebook.open(notebook);

    // Run a simple cell to check pyodide packages download and run.
    await page.notebook.runCell(0);
    let output = await page.notebook.getCellTextOutput(0);
    expect(output![0]).toEqual('3');

    // Run cell containing `input`.
    const cell1 = page.notebook.runCell(1); // Do not await yet.
    await page.locator('.jp-Stdin >> text=Prompt:').waitFor();
    await page.keyboard.insertText('My Name');
    await page.keyboard.press('Enter');
    await cell1; // await end of cell.

    output = await page.notebook.getCellTextOutput(1);
    expect(output![0]).toEqual('Prompt: My Name\n');

    // Check `input` value stored correctly.
    await page.notebook.runCell(2);
    output = await page.notebook.getCellTextOutput(2);
    expect(output![0]).toEqual("'My Name'");

    // Run cell containing `getpass`
    const cell3 = page.notebook.runCell(3); // Do not await yet.
    await page.locator('.jp-Stdin >> text=Password:').waitFor();
    await page.keyboard.insertText('hidden123');
    await page.keyboard.press('Enter');
    await cell3; // await end of cell.

    output = await page.notebook.getCellTextOutput(3);
    expect(output![0]).toEqual('Password: ········\n');

    // Check `getpass` value stored correctly.
    await page.notebook.runCell(4);
    output = await page.notebook.getCellTextOutput(4);
    expect(output![0]).toEqual("'hidden123'");

    // Check multiple `input` in the same cell.
    const cell5 = page.notebook.runCell(5); // Do not await yet.
    await page.locator('.jp-Stdin >> text=n0:').waitFor();
    await page.keyboard.insertText('abc');
    await page.keyboard.press('Enter');
    await page.locator('.jp-Stdin >> text=n1:').waitFor();
    await page.keyboard.insertText('xyz');
    await page.keyboard.press('Enter');
    await cell5; // await end of cell.

    await page.notebook.runCell(6);
    output = await page.notebook.getCellTextOutput(6);
    expect(output![0]).toEqual("('abc', 'xyz')");
  });
});

test.describe('Kernel status and logs', () => {
  test.use({
    waitForApplication: notebooksWaitForApplication,
  });

  test.setTimeout(120000);

  test('Clicking on kernel status indicator opens the log console', async ({
    page,
  }) => {
    await page.goto('notebooks/index.html?path=empty.ipynb');

    await page.waitForSelector('.jp-NotebookPanel');

    const logConsoleInitially = await page.locator('.jp-LogConsole').isVisible();
    expect(logConsoleInitially).toBe(false);

    await page.locator('.jp-KernelStatus').click();

    await page.waitForSelector('.jp-LogConsole');
    const logConsoleVisible = await page.locator('.jp-LogConsole').isVisible();
    expect(logConsoleVisible).toBe(true);
  });

  test('Kernel logs show expected messages after restart', async ({ page }) => {
    await page.goto('notebooks/index.html?path=empty.ipynb');
    await page.waitForSelector('.jp-NotebookPanel');

    await page.locator('.jp-KernelStatus').click();
    await page.waitForSelector('.jp-LogConsole');

    // Resize the log console to take half of the vertical space
    const handle = page.locator('.lm-SplitPanel-handle:visible');
    await handle.waitFor({ state: 'visible' });

    const viewportSize = page.viewportSize();
    if (!viewportSize) {
      throw new Error('Viewport size is null');
    }

    const handleBox = await handle.boundingBox();
    if (!handleBox) {
      throw new Error('Could not get handle bounding box');
    }
    const targetY = viewportSize.height / 2;

    await page.mouse.move(
      handleBox.x + handleBox.width / 2,
      handleBox.y + handleBox.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(handleBox.x + handleBox.width / 2, targetY);
    await page.mouse.up();

    // Switch the log level to info to see the kernel logs
    await page.locator('[aria-label="Log level"]').selectOption('info');

    // Restart the kernel
    await page.menu.clickMenuItem('Kernel>Restart Kernel and Run All Cells…');
    await page.getByRole('button', { name: 'Confirm Kernel Restart' }).click();

    // Wait for the indicator to show the green checkmark
    await page.waitForSelector('.jp-KernelStatus-success');

    // Check the Pyodide kernel logs are visible
    expect(page.getByText('Loaded micropip, packaging')).toBeVisible();
    expect(page.getByText('Loaded openssl, ssl')).toBeVisible();
  });

  test('Kernel shows error state with invalid package configuration', async ({
    page,
  }) => {
    // Mock jupyter-lite.json with invalid package configuration to put the kernel in error state
    await page.route('jupyter-lite.json', async (route, request) => {
      const response = await page.request.fetch(route.request());
      const body = await response.json();
      body['jupyter-config-data'].litePluginSettings = {
        '@jupyterlite/pyodide-kernel-extension:kernel': {
          loadPyodideOptions: {
            packages: ['unknownpackagetoload'],
          },
        },
      };
      return route.fulfill({
        response,
        body: JSON.stringify(body),
        headers: {
          ...response.headers(),
        },
      });
    });

    await page.goto('notebooks/index.html?path=empty.ipynb');
    await page.waitForSelector('.jp-NotebookPanel');

    await page.locator('.jp-KernelStatus').click();
    await page.waitForSelector('.jp-LogConsole');
    await page.waitForSelector('.jp-KernelStatus-error');

    expect(page.getByText('unknownpackagetoload')).toBeVisible();
  });
});
