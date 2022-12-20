// Copyright (c) JupyterLite Contributors
// Distributed under the terms of the Modified BSD License.

import { test as base } from '@jupyterlab/galata';

import { expect } from '@playwright/test';

import { createNewDirectory, config } from './utils';

// TODO: fix upstream condition so it's not specific to JupyterLab?
const test = base.extend({
  waitForApplication: async ({ baseURL }, use, testInfo) => {
    const waitIsReady = async (page): Promise<void> => {
      await page.waitForSelector('#filebrowser');
    };
    await use(waitIsReady);
  },
});

test.use(config);

test.describe('Retro Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('retro/index.html');
    // create a new directory for now to avoid showing the default content
    const name = 'retro';
    await createNewDirectory({ page, name });
    await page.filebrowser.openDirectory(name);
  });

  test('Tree Screen', async ({ page }) => {
    const imageName = 'tree.png';
    expect(await page.screenshot()).toMatchSnapshot(imageName.toLowerCase());
  });

  test('Toggle Dark theme', async ({ page }) => {
    await page.theme.setDarkTheme();
    const imageName = 'dark-theme.png';
    expect(await page.screenshot()).toMatchSnapshot(imageName.toLowerCase());
  });

  test('Toggle Light theme', async ({ page }) => {
    await page.theme.setDarkTheme();
    await page.theme.setLightTheme();

    expect(await page.theme.getTheme()).toEqual('JupyterLab Light');
  });
});
