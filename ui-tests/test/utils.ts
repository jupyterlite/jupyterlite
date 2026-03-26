import { Buffer } from 'buffer';

import { expect, type IJupyterLabPageFixture } from '@jupyterlab/galata';

const dirListingItemTextSelector = (name: string) =>
  `span.jp-DirListing-itemText > span:text-is("${name}")`;

export type UploadFile = Readonly<{
  base64: string;
  mimeType: string;
  name: string;
  size: number;
}>;

export async function deleteItem({
  page,
  name,
}: {
  page: IJupyterLabPageFixture;
  name: string;
}): Promise<void> {
  const item = page.locator(dirListingItemTextSelector(name));
  await item.click({ button: 'right' });
  await page.click('[data-command="filebrowser:delete"]');
  const button = page.locator('.jp-mod-accept');
  await button.click();
}

export async function download({
  page,
  path,
}: {
  page: IJupyterLabPageFixture;
  path: string;
}): Promise<string> {
  const item = page.locator(dirListingItemTextSelector(path));
  await item.click({ button: 'right' });

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('[data-command="filebrowser:download"]'),
  ]);

  // wait for download to complete
  return download.path();
}

export async function chooseFilesForUpload(
  page: IJupyterLabPageFixture,
  files: UploadFile[],
): Promise<void> {
  const uploadButton = page.locator('.jp-id-upload');
  await expect(uploadButton).toBeVisible();

  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    uploadButton.click(),
  ]);

  await fileChooser.setFiles(
    files.map((file) => ({
      buffer: Buffer.from(file.base64, 'base64'),
      mimeType: file.mimeType,
      name: file.name,
    })),
  );
}

export async function uploadFiles(
  page: IJupyterLabPageFixture,
  files: UploadFile[],
): Promise<void> {
  await chooseFilesForUpload(page, files);

  for (const file of files) {
    await expect
      .poll(() => page.filebrowser.isFileListedInBrowser(file.name))
      .toBeTruthy();
  }
}

/**
 * Custom filebrowser refresh helper
 *
 * Temporary fix as Galata makes an API call to the server
 * https://github.com/jupyterlab/jupyterlab/pull/15607
 */
export async function refreshFilebrowser({ page }): Promise<void> {
  try {
    await page.filebrowser.refresh();
  } catch {
    // no-op
  }
}

/**
 * Custom filebrowser open directory helper
 *
 * Temporary fix as Galata makes an API call to the server
 * https://github.com/jupyterlab/jupyterlab/pull/15607
 */
export async function openDirectory({ page, directory }): Promise<void> {
  // workaround: double click on the directory to open it
  await page.dblclick(dirListingItemTextSelector(directory));
}

export async function createNewDirectory({
  page,
  name,
}: {
  page: IJupyterLabPageFixture;
  name: string;
}): Promise<void> {
  await page.click('[data-command="filebrowser:create-new-directory"]');
  await page.fill('.jp-DirListing-editor', name);
  await page.press('.jp-DirListing-editor', 'Enter');
  await refreshFilebrowser({ page });
}

/**
 * Workaround for Galata being stuck when testing on Firefox:
 * https://github.com/jupyterlab/jupyterlab/issues/15093
 */
export async function firefoxWaitForApplication({ baseURL }, use, testInfo) {
  const waitIsReady = async (page): Promise<void> => {
    await page.waitForSelector('.jp-LauncherCard');
  };
  await use(waitIsReady);
}

/**
 * Custom waitForApplication for the notebook file browser page
 */
export async function treeWaitForApplication({ baseURL }, use, testInfo) {
  const waitIsReady = async (page): Promise<void> => {
    await page.waitForSelector('#filebrowser');
  };
  await use(waitIsReady);
}

/**
 * Custom waitForApplication for the notebooks  page
 */
export async function notebooksWaitForApplication({ baseURL }, use, testInfo) {
  const waitIsReady = async (page): Promise<void> => {
    await page.waitForSelector('.jp-NotebookPanel');
  };
  await use(waitIsReady);
}

/**
 * Check if a directory is listed in the file browser
 */
export async function isDirectoryListedInBrowser({
  page,
  name,
}: {
  page: IJupyterLabPageFixture;
  name: string;
}): Promise<boolean> {
  const item = page.locator(dirListingItemTextSelector(name));
  return item.isVisible();
}
