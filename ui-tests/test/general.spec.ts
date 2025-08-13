// Copyright (c) JupyterLite Contributors
// Distributed under the terms of the Modified BSD License.

import { test } from '@jupyterlab/galata';

import { expect } from '@playwright/test';

import { firefoxWaitForApplication } from './utils';

test.use({
  waitForApplication: firefoxWaitForApplication,
});

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

  test('Multiple Document Mode (default)', async ({ page }) => {
    const mainDockPanel = page.locator('#jp-main-dock-panel');
    await expect(mainDockPanel).toHaveAttribute('data-mode', 'multiple-document');
  });

  test('Single Document Mode via URL parameter', async ({ page }) => {
    await page.goto('lab/index.html?mode=single-document');

    const mainDockPanel = page.locator('#jp-main-dock-panel');
    await expect(mainDockPanel).toHaveAttribute('data-mode', 'single-document');

    const tabBar = page.locator('.lm-DockPanel-tabBar').first();
    await expect(tabBar).toBeHidden();
  });

  test('Switch between Multiple and Single Document Modes', async ({ page }) => {
    const mainDockPanel = page.locator('#jp-main-dock-panel');
    await expect(mainDockPanel).toHaveAttribute('data-mode', 'multiple-document');

    const menuItem = 'View>Appearance>Simple Interface';
    await page.menu.clickMenuItem(menuItem);
    await expect(mainDockPanel).toHaveAttribute('data-mode', 'single-document');

    const tabBar = page.locator('.lm-DockPanel-tabBar').first();
    await expect(tabBar).toBeHidden();

    await page.menu.clickMenuItem(menuItem);
    await expect(mainDockPanel).toHaveAttribute('data-mode', 'multiple-document');

    await expect(tabBar).toBeVisible();
  });
});
