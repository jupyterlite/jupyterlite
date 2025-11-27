// Copyright (c) JupyterLite Contributors
// Distributed under the terms of the Modified BSD License.

import { expect, test } from '@jupyterlab/galata';

import { notebooksWaitForApplication } from './utils';

const TEST_NOTEBOOK = 'file-access.ipynb';

test.describe('Notebook Exporters', () => {
  test.use({
    waitForApplication: notebooksWaitForApplication,
  });

  test.setTimeout(120000);

  test.beforeEach(async ({ page }) => {
    await page.goto(`notebooks/index.html?path=${TEST_NOTEBOOK}`);

    // wait for the kernel to be ready
    await page.hover('.jp-Notebook-ExecutionIndicator');
    await page.getByText('Kernel Status: Idle').waitFor();
  });

  test('Export notebook as ipynb', async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      await page.menu.clickMenuItem(
        'File>Save and Export Notebook As > Notebook (ipynb)',
      ),
    ]);

    const filename = download.suggestedFilename();
    expect(filename).toBe(TEST_NOTEBOOK);

    const path = await download.path();
    expect(path).not.toBeNull();

    const fs = await import('fs');
    const content = fs.readFileSync(path, 'utf-8');
    const notebook = JSON.parse(content);

    expect(notebook).toHaveProperty('cells');
    expect(notebook).toHaveProperty('metadata');
    expect(notebook).toHaveProperty('nbformat');
    expect(notebook.cells).toHaveLength(5);
  });

  test('Export notebook as script', async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      await page.menu.clickMenuItem(
        'File>Save and Export Notebook As > Executable Script',
      ),
    ]);

    const filename = download.suggestedFilename();
    expect(filename).toBe(TEST_NOTEBOOK.replace('.ipynb', '.py'));

    const path = await download.path();
    expect(path).not.toBeNull();

    const fs = await import('fs');
    const content = fs.readFileSync(path, 'utf-8');

    expect(content).toContain('print("done")');
  });
});
