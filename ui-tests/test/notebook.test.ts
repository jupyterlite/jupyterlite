// Copyright (c) JupyterLite Contributors
// Distributed under the terms of the Modified BSD License.

import { test } from '@jupyterlab/galata';

import { expect } from '@playwright/test';

import { treeWaitForApplication } from './utils';

test.use({
  waitForApplication: treeWaitForApplication,
});

test.describe('Notebook Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('tree/index.html');
    // create a new directory for now to avoid showing the default content
    const name = 'notebook';
    await page.menu.clickMenuItem('New>New Folder');
    await page.fill('.jp-DirListing-editor', name);
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
