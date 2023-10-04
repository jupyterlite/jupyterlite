import { IJupyterLabPageFixture } from '@jupyterlab/galata';

export async function deleteItem({
  page,
  name,
}: {
  page: IJupyterLabPageFixture;
  name: string;
}): Promise<void> {
  const item = await page.$(`xpath=${page.filebrowser.xpBuildFileSelector(name)}`);
  await item.click({ button: 'right' });
  await page.click('[data-command="filebrowser:delete"]');
  const button = await page.$('.jp-mod-accept');
  await button.click();
}

export async function download({
  page,
  path,
}: {
  page: IJupyterLabPageFixture;
  path: string;
}): Promise<string> {
  await page.evaluate(async (path: string) => {
    await window.galata.app.commands.execute('filebrowser:download', { path });
  }, path);

  const download = await page.waitForEvent('download');

  // wait for download to complete
  return download.path();
}

export async function createNewDirectory({
  page,
  name,
}: {
  page: IJupyterLabPageFixture;
  name: string;
}): Promise<void> {
  await page.click('[data-icon="ui-components:new-folder"]');
  await page.fill('.jp-DirListing-editor', name);
  await page.keyboard.down('Enter');
  await page.filebrowser.refresh();
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
