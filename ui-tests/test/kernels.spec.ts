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
    await page.notebook.save();

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

  test('Restart Kernel and Run All Cells with error stops execution', async ({
    page,
  }) => {
    // this test can sometimes take longer to run as it uses the Pyodide kernel
    test.setTimeout(120000);

    const notebook = 'runall-error.ipynb';

    await page.goto('lab/index.html');
    await page.notebook.open(notebook);

    // Wait for the notebook to be ready
    await page.waitForSelector('.jp-Notebook.jp-mod-commandMode');

    // Execute "Restart Kernel and Run All Cells..."
    await page.menu.clickMenuItem('Kernel>Restart Kernel and Run All Cells…');
    await page.getByRole('button', { name: 'Confirm Kernel Restart' }).click();

    // Wait for the notebook to be in command mode after restart
    await page.waitForSelector('.jp-Notebook.jp-mod-commandMode');

    // Wait for the first few cells to execute successfully
    // Cell 0: foo = 1; foo - should have execution count [1] and output 1
    await page.locator('.jp-InputArea-prompt >> text="[1]:"').first().waitFor();
    let output = await page.notebook.getCellTextOutput(0);
    expect(output).toBeTruthy();
    expect(output![0]).toBe('1');

    // Cell 1: foo = 2; foo - should have execution count [2] and output 2
    await page.locator('.jp-InputArea-prompt >> text="[2]:"').first().waitFor();
    output = await page.notebook.getCellTextOutput(1);
    expect(output).toBeTruthy();
    expect(output![0]).toBe('2');

    // Cell 2: foo = 3; foo - should have execution count [3] and output 3
    await page.locator('.jp-InputArea-prompt >> text="[3]:"').first().waitFor();
    output = await page.notebook.getCellTextOutput(2);
    expect(output).toBeTruthy();
    expect(output![0]).toBe('3');

    // Cell 3: err - should have execution count [4] and error output
    await page.locator('.jp-InputArea-prompt >> text="[4]:"').first().waitFor();

    // Wait for the error to appear in the output
    await page
      .locator('.jp-OutputArea-output[data-mime-type="application/vnd.jupyter.stderr"]')
      .first()
      .waitFor();

    // Check that the error cell has an error output
    const errorOutput = await page
      .locator('.jp-OutputArea-output[data-mime-type="application/vnd.jupyter.stderr"]')
      .first()
      .textContent();
    expect(errorOutput).toContain('NameError');
    expect(errorOutput).toContain('err');

    // Verify that cells after the error (cells 4, 5, 6) do NOT have execution counts
    // They should still show empty execution count prompts [ ]:

    // Cell 4: foo = 4; foo - should NOT be executed (no execution count)
    const cell4Prompt = await page
      .locator('.jp-Cell')
      .nth(4)
      .locator('.jp-InputArea-prompt')
      .textContent();
    expect(cell4Prompt?.trim()).toBe('[ ]:');

    // Cell 5: foo = 5; foo - should NOT be executed (no execution count)
    const cell5Prompt = await page
      .locator('.jp-Cell')
      .nth(5)
      .locator('.jp-InputArea-prompt')
      .textContent();
    expect(cell5Prompt?.trim()).toBe('[ ]:');

    // Cell 6: foo - should NOT be executed (no execution count)
    const cell6Prompt = await page
      .locator('.jp-Cell')
      .nth(6)
      .locator('.jp-InputArea-prompt')
      .textContent();
    expect(cell6Prompt?.trim()).toBe('[ ]:');

    // Verify that cells 4, 5, 6 have no output
    const cell4Output = await page.notebook.getCellTextOutput(4);
    expect(cell4Output).toBeNull();

    const cell5Output = await page.notebook.getCellTextOutput(5);
    expect(cell5Output).toBeNull();

    const cell6Output = await page.notebook.getCellTextOutput(6);
    expect(cell6Output).toBeNull();

    // Verify the kernel status shows it's idle (not busy) after the error
    await page.locator('.jp-KernelStatus-success').waitFor();
  });

  test('Manual run after error works correctly', async ({ page }) => {
    // this test can sometimes take longer to run as it uses the Pyodide kernel
    test.setTimeout(120000);

    const notebook = 'runall-error.ipynb';

    await page.goto('lab/index.html');
    await page.notebook.open(notebook);

    // Execute "Restart Kernel and Run All Cells..." to trigger the error
    await page.menu.clickMenuItem('Kernel>Restart Kernel and Run All Cells…');
    await page.getByRole('button', { name: 'Confirm Kernel Restart' }).click();

    // Wait for the error to occur
    await page
      .locator('.jp-OutputArea-output[data-mime-type="application/vnd.jupyter.stderr"]')
      .first()
      .waitFor();

    // Now manually run cell 4 (foo = 4; foo) which should work since foo was set to 3 earlier
    await page.notebook.runCell(4);

    // Verify cell 4 now has execution count [5] and outputs 4
    await page.locator('.jp-InputArea-prompt >> text="[5]:"').first().waitFor();
    const output = await page.notebook.getCellTextOutput(4);
    expect(output).toBeTruthy();
    expect(output![0]).toBe('4');
  });

  test('Interrupt stops execution of following cells', async ({ page }) => {
    // this test can sometimes take longer to run as it uses the Pyodide kernel
    test.setTimeout(120000);

    const notebook = 'runall-interrupt.ipynb';

    await page.goto('lab/index.html');
    await page.notebook.open(notebook);

    // Execute "Restart Kernel and Run All Cells..."
    await page.menu.clickMenuItem('Kernel>Restart Kernel and Run All Cells…');
    await page.getByRole('button', { name: 'Confirm Kernel Restart' }).click();

    // Wait for the execution of the first cell to complete
    await page.locator('.jp-InputArea-prompt >> text="[1]:"').waitFor();

    // Expect the remaining four cells to be scheduled for execution
    const busyCells = page.locator('.jp-InputArea-prompt >> text="[*]:"');
    expect(busyCells).toHaveCount(4);

    // Interrupt the kernel while the second cell is executing
    await page.menu.clickMenuItem('Kernel>Interrupt Kernel');

    // Wait for the interruption error to show up
    const errorMessage = 'Kernel Interrupt: Interrupted';
    const interruptionError = page.locator(
      '.jp-OutputArea-output[data-mime-type="application/vnd.jupyter.stderr"]',
    );
    await interruptionError.waitFor();

    // Expect text explaining the error
    expect(interruptionError).toHaveText(errorMessage);

    // Expect the second cell to have produced an output
    const output = await page.notebook.getCellTextOutput(1);
    expect(output![0]).toBe('2');

    // Expect the error to show up on the third cell
    const error = await page.notebook.getCellTextOutput(2);
    expect(error![0]).toBe(errorMessage);

    // Expect all remaining cells to have cleared execution status
    const idleCells = page.locator('.jp-InputArea-prompt >> text="[ ]:"');
    expect(idleCells).toHaveCount(3);

    // Expect the remaining cells to not have any output
    for (const i of [3, 4]) {
      const cancelledCellOutput = await page.notebook.getCellTextOutput(i);
      expect(cancelledCellOutput).toBeNull();
    }
  });

  test('Interrupt stops execution of restarted kernel', async ({ page }) => {
    // this test can sometimes take longer to run as it uses the Pyodide kernel
    test.setTimeout(120000);

    const notebook = 'runall-interrupt.ipynb';

    await page.goto('lab/index.html');
    await page.notebook.open(notebook);

    // Execute "Restart Kernel and Run All Cells..."
    await page.menu.clickMenuItem('Kernel>Restart Kernel and Run All Cells…');
    await page.getByRole('button', { name: 'Confirm Kernel Restart' }).click();

    // Interrupt the kernel before the first cell executed
    await page.menu.clickMenuItem('Kernel>Interrupt Kernel');

    // Wait for the interruption error to show up
    const errorMessage = 'Kernel Interrupt: Interrupted';
    const interruptionError = page.locator(
      '.jp-OutputArea-output[data-mime-type="application/vnd.jupyter.stderr"]',
    );
    await interruptionError.waitFor();

    // Expect text explaining the error
    expect(interruptionError).toHaveText(errorMessage);

    // Expect all cells to have cleared execution status
    const idleCells = page.locator('.jp-InputArea-prompt >> text="[ ]:"');
    expect(idleCells).toHaveCount(5);
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
    expect(page.getByText('Loaded micropip')).toBeVisible();
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
