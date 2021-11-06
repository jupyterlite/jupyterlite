// Copyright (c) JupyterLite Contributors
// Distributed under the terms of the Modified BSD License.

import * as path from 'path';

import { test } from '@jupyterlab/galata';

import { expect } from '@playwright/test';

test.describe('Contents Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('lab/index.html');
  });

  // TODO: Galata should support uploading files via the serviceManager.contents API
  // so it works in JupyterLite
  test.skip('Upload File', async ({ page, tmpPath }) => {
    const file = 'package.json';
    const renamed = 'renamed.json';
    await page.contents.uploadFile(
      path.resolve(__dirname, `../${file}`),
      `${tmpPath}/${file}`
    );
    await page.contents.renameFile(`${tmpPath}/${file}`, `${tmpPath}/${renamed}`);
    expect(await page.contents.fileExists(`${tmpPath}/${renamed}`)).toEqual(true);
  });
});
