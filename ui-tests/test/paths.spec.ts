// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { expect, test } from '@jupyterlab/galata';

import { deleteItem, firefoxWaitForApplication, refreshFilebrowser } from './utils';

const FILE = '100% sure.txt';
const CONTENT = 'Percent-encoded names work.';
const EDITOR = '.jp-FileEditor .cm-content';
const TAB_LABEL = '#jp-main-dock-panel .lm-TabBar-tabLabel';
const DIALOG = '.jp-Dialog';
const DIALOG_INPUT = `${DIALOG} input[type="text"]`;

const listingItem = (name: string) =>
  `span.jp-DirListing-itemText > span:text-is("${name}")`;

/**
 * Custom waitForApplication for pages opening a file on load, without a launcher
 */
async function editorWaitForApplication({ baseURL }, use, testInfo) {
  const waitIsReady = async (page): Promise<void> => {
    await page.waitForSelector(EDITOR);
  };
  await use(waitIsReady);
}

test.describe('Deployment files with a percent sign', () => {
  test.use({
    waitForApplication: editorWaitForApplication,
  });

  test('Open from the editor page URL', async ({ page }) => {
    await page.goto(`edit/index.html?path=${encodeURIComponent(FILE)}`);

    await expect(page.locator(EDITOR)).toContainText(CONTENT);
  });

  test('Open from the lab URL', async ({ page }) => {
    await page.goto(`lab/index.html?path=${encodeURIComponent(FILE)}`);

    await expect(page.locator(TAB_LABEL, { hasText: FILE })).toBeVisible();
    await expect(page.locator(EDITOR)).toContainText(CONTENT);
  });
});

test.describe('Browser files with a percent sign', () => {
  test.use({
    waitForApplication: firefoxWaitForApplication,
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('lab/index.html');
  });

  test('Open from URL with a percent-encoded name', async ({ page, baseURL }) => {
    // https://github.com/jupyterlite/jupyterlite/issues/1211
    const url = `${baseURL}/files/${encodeURIComponent(FILE)}`;
    // like JupyterLab, the file is saved under the last segment of the URL as is
    const name = encodeURIComponent(FILE);

    await page.menu.clickMenuItem('File>Open from URL…');
    await page.locator(DIALOG_INPUT).fill(url);
    await page.getByRole('button', { name: 'Open' }).click();

    await expect(page.locator(TAB_LABEL, { hasText: name })).toBeVisible();
    await expect(page.locator(EDITOR)).toContainText(CONTENT);
    await expect(page.locator(DIALOG)).toHaveCount(0);

    await refreshFilebrowser({ page });
    expect(await page.filebrowser.isFileListedInBrowser(name)).toBeTruthy();

    // opening the file from the file browser reveals the same document
    await page.dblclick(listingItem(name));
    await expect(page.locator(TAB_LABEL, { hasText: name })).toHaveCount(1);
  });

  test('Save, rename and delete', async ({ page }) => {
    const saved = '100%.txt';
    const renamed = 'a%20b.txt';
    const content = 'saved';

    await page.menu.clickMenuItem('File>New>Text File');
    await page.locator(EDITOR).fill(content);

    // save the new file under a name with a percent sign
    await page.menu.clickMenuItem('File>Save Text');
    await page.locator(DIALOG_INPUT).fill(saved);
    await page.getByRole('button', { name: 'Rename and Save' }).click();
    await expect(page.locator(TAB_LABEL, { hasText: saved })).toBeVisible();
    await expect(page.locator(DIALOG)).toHaveCount(0);
    await page.menu.clickMenuItem('File>Close Tab');

    await refreshFilebrowser({ page });
    expect(await page.filebrowser.isFileListedInBrowser(saved)).toBeTruthy();

    // rename it from the file browser to a name that looks percent-encoded
    await page.click(listingItem(saved), { button: 'right' });
    await page.click('[data-command="filebrowser:rename"]');
    await page.fill('.jp-DirListing-editor', renamed);
    await page.press('.jp-DirListing-editor', 'Enter');

    await refreshFilebrowser({ page });
    expect(await page.filebrowser.isFileListedInBrowser(saved)).toBeFalsy();
    expect(await page.filebrowser.isFileListedInBrowser(renamed)).toBeTruthy();

    // the content survived the rename
    await page.dblclick(listingItem(renamed));
    await expect(page.locator(TAB_LABEL, { hasText: renamed })).toBeVisible();
    await expect(page.locator(EDITOR)).toContainText(content);
    await page.menu.clickMenuItem('File>Close Tab');

    await deleteItem({ page, name: renamed });

    await refreshFilebrowser({ page });
    expect(await page.filebrowser.isFileListedInBrowser(renamed)).toBeFalsy();
  });
});
