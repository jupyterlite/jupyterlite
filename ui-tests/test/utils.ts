import { IJupyterLabPageFixture, test as base } from '@jupyterlab/galata';

// TODO: move back to playwright.config.ts after updating to JupyterLab 4 packages
// See https://github.com/jupyterlab/jupyterlab/pull/13140 for more information
base.use({
  appPath: '',
  baseURL: 'http://localhost:8000',
  autoGoto: false,
  video: 'retain-on-failure',
  acceptDownloads: true,
});

export const test = base;

// TODO: upstream in Galata?

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
    await window.galataip.app.commands.execute('filebrowser:download', { path });
  }, path);

  const download = await page.waitForEvent('download');

  // wait for download to complete
  return download.path();
}
