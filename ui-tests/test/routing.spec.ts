// Copyright (c) JupyterLite Contributors
// Distributed under the terms of the Modified BSD License.

import { expect, test } from '@playwright/test';

test.describe('Notebook pages routing', () => {
  const FILE_BROWSER = '#filebrowser';
  const DIALOG_HEADER = '.jp-Dialog-header';

  test('Notebook page without a path redirects to the file browser', async ({
    page,
  }) => {
    await page.goto('notebooks/index.html');

    await page.waitForURL('**/tree/index.html');
    await expect(page.locator(FILE_BROWSER)).toBeVisible();
  });

  test('Editor page without a path redirects to the file browser', async ({ page }) => {
    await page.goto('edit/index.html');

    await page.waitForURL('**/tree/index.html');
    await expect(page.locator(FILE_BROWSER)).toBeVisible();
  });

  test('Notebook page with a missing path offers to open the file browser', async ({
    page,
  }) => {
    await page.goto('notebooks/index.html?path=does-not-exist.ipynb');

    await expect(page.locator(DIALOG_HEADER)).toHaveText('Cannot Open File');
    await expect(page.locator('.jp-Dialog-body')).toContainText(
      'Could not find "does-not-exist.ipynb"',
    );
    // no phantom document for the missing file
    await expect(page.locator('.jp-NotebookPanel')).toHaveCount(0);

    await page.locator('.jp-Dialog-button.jp-mod-accept').click();

    await page.waitForURL('**/tree/index.html');
    await expect(page.locator(FILE_BROWSER)).toBeVisible();
  });

  test('Editor page with a missing path can stay on the page', async ({ page }) => {
    await page.goto('edit/index.html?path=does-not-exist.txt');

    await expect(page.locator(DIALOG_HEADER)).toHaveText('Cannot Open File');

    await page.locator('.jp-Dialog-button.jp-mod-reject').click();

    await expect(page.locator(DIALOG_HEADER)).toHaveCount(0);
    expect(page.url()).toContain('edit/index.html?path=does-not-exist.txt');
  });

  test('Notebook page with a folder path opens the folder in the file browser', async ({
    page,
  }) => {
    await page.goto('notebooks/index.html?path=data');

    await expect(page.locator(FILE_BROWSER)).toBeVisible();
    await expect(
      page.locator('.jp-DirListing-itemText', { hasText: 'iris.csv' }),
    ).toBeVisible();
    expect(page.url()).toContain('/tree/');
  });

  test('File browser page with a folder path opens the folder', async ({ page }) => {
    await page.goto('tree/index.html?path=data');

    await expect(page.locator(FILE_BROWSER)).toBeVisible();
    await expect(
      page.locator('.jp-DirListing-itemText', { hasText: 'iris.csv' }),
    ).toBeVisible();
  });

  test('File browser page with a missing path shows a dialog', async ({ page }) => {
    await page.goto('tree/index.html?path=does-not-exist.ipynb');

    await expect(page.locator(DIALOG_HEADER)).toHaveText('Cannot Open File');

    await page.locator('.jp-Dialog-button.jp-mod-accept').click();

    await expect(page.locator(DIALOG_HEADER)).toHaveCount(0);
    await expect(page.locator(FILE_BROWSER)).toBeVisible();
    expect(page.url()).toContain('tree/index.html');
  });

  test('File browser page with a notebook path redirects to the notebook page', async ({
    page,
  }) => {
    await page.goto('tree/index.html?path=empty.ipynb');

    await page.waitForURL('**/notebooks/index.html?path=empty.ipynb');
    await expect(page.locator('.jp-NotebookPanel')).toBeVisible();
  });

  test('Browsing a folder in the file browser keeps the URL loadable', async ({
    page,
  }) => {
    await page.goto('tree/index.html');

    await expect(page.locator(FILE_BROWSER)).toBeVisible();
    await page.locator('.jp-DirListing-itemText', { hasText: 'data' }).dblclick();

    await page.waitForURL('**/tree/index.html?path=data');

    await page.reload();
    await expect(
      page.locator('.jp-DirListing-itemText', { hasText: 'iris.csv' }),
    ).toBeVisible();
    expect(page.url()).toContain('tree/index.html?path=data');
  });

  test('Going back in the browser history returns to the previous folder', async ({
    page,
  }) => {
    await page.goto('tree/index.html');

    await expect(page.locator(FILE_BROWSER)).toBeVisible();
    await page.locator('.jp-DirListing-itemText', { hasText: 'data' }).dblclick();
    await page.waitForURL('**/tree/index.html?path=data');

    await page.goBack();
    await page.waitForURL('**/tree/index.html');
    await expect(
      page.locator('.jp-DirListing-itemText', { hasText: 'data' }),
    ).toBeVisible();
  });
});
