// Copyright (c) JupyterLite Contributors
// Distributed under the terms of the Modified BSD License.

import { expect, test } from '@jupyterlab/galata';

import { notebooksWaitForApplication } from './utils';

const editableContentSelector = '.cm-editor .cm-content[contenteditable="true"]';

test.describe('Scratchpad Console', () => {
  test.use({
    waitForApplication: notebooksWaitForApplication,
  });

  test('Should open scratchpad console and share kernel with notebook', async ({
    page,
  }) => {
    await page.goto('notebooks/index.html?path=javascript.ipynb');

    await page.hover('.jp-Notebook-ExecutionIndicator');
    await page.getByText('Kernel Status: Idle').waitFor();

    await page.menu.clickMenuItem('File>New>Scratchpad console');

    const consolePanel = page.locator('#jp-right-stack .jp-ConsolePanel');
    await expect(consolePanel).toBeVisible();

    const consoleInput = consolePanel
      .locator('.jp-CodeConsole-input')
      .locator(editableContentSelector);
    await consoleInput.waitFor();

    await consoleInput.fill('var a = 1;\na');
    await consoleInput.press('Shift+Enter');

    await expect(consolePanel.locator('.jp-OutputArea-output').first()).toHaveText('1');

    const codeCell = page.locator('.jp-CodeCell').first();
    const notebookCellInput = codeCell
      .locator('.jp-Cell-inputArea')
      .locator(editableContentSelector);

    await notebookCellInput.fill('a');
    await notebookCellInput.press('Shift+Enter');

    await expect(codeCell.locator('.jp-OutputArea-output').first()).toHaveText('1');
  });
});
