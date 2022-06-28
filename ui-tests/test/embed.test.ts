// Copyright (c) JupyterLite Contributors
// Distributed under the terms of the Modified BSD License.

import { test as base } from '@jupyterlab/galata';

import { expect } from '@playwright/test';

// TODO: fix upstream condition so it's not specific to JupyterLab?
const test = base.extend({
  waitForApplication: async ({ baseURL }, use, testInfo) => {
    const waitIsReady = async (page): Promise<void> => {
      await page.frameLocator('iframe');
      await iframe.waitForSelector('.jp-InputArea');
    };
    await use(waitIsReady);
  },
});

test.describe('Embed the REPL app', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('embed/index.html');
  });

  test('Page', async ({ page }) => {
    const imageName = 'page.png';
    expect(await page.screenshot()).toMatchSnapshot(imageName.toLowerCase());
  });
});
