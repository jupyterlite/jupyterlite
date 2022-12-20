// Copyright (c) JupyterLite Contributors
// Distributed under the terms of the Modified BSD License.

import { test } from '@jupyterlab/galata';

import { expect } from '@playwright/test';

import { config } from './utils';

test.use(config);

test.describe('General Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('lab/index.html');
    await page.sidebar.close('left');
  });

  test('Launch Screen', async ({ page }) => {
    const imageName = 'launch.png';
    expect(await page.screenshot()).toMatchSnapshot(imageName.toLowerCase());
  });

  test('Enter Simple Mode', async ({ page }) => {
    await page.setSimpleMode(true);
    expect(await page.isInSimpleMode()).toEqual(true);

    const imageName = 'simple-mode.png';
    expect(await page.screenshot()).toMatchSnapshot(imageName);
  });

  test('Toggle Dark theme', async ({ page }) => {
    await page.theme.setDarkTheme();

    // ensure the theme is persisted after a page reload
    await page.reload();
    await page.sidebar.close('left');

    const imageName = 'dark-theme.png';
    expect(await page.screenshot()).toMatchSnapshot(imageName.toLowerCase());
  });

  test('Toggle Light theme', async ({ page }) => {
    await page.theme.setDarkTheme();
    await page.theme.setLightTheme();

    expect(await page.theme.getTheme()).toEqual('JupyterLab Light');
  });

  test('Toggle Federated Theme', async ({ page }) => {
    await page.theme.setTheme('Darcula');

    expect(await page.theme.getTheme()).toEqual('Darcula');
  });
});
