// Copyright (c) JupyterLite Contributors
// Distributed under the terms of the Modified BSD License.

import { test as base } from '@jupyterlab/galata';

import { expect } from '@playwright/test';

import { config } from './utils';

// TODO: fix upstream condition so it's not specific to JupyterLab?
const test = base.extend({
  waitForApplication: async ({ baseURL }, use, testInfo) => {
    const waitIsReady = async (page): Promise<void> => {
      await page.waitForSelector('.jp-InputArea');
    };
    await use(waitIsReady);
  },
});

test.use(config);

test.describe('REPL Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('repl/index.html?toolbar=1&kernel=javascript');
  });

  test('Page', async ({ page }) => {
    const imageName = 'page.png';
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
