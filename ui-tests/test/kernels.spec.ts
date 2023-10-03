// Copyright (c) JupyterLite Contributors
// Distributed under the terms of the Modified BSD License.

import { test } from '@jupyterlab/galata';

import { expect } from '@playwright/test';

import { firefoxWaitForApplication } from './utils';

test.use({
  waitForApplication: firefoxWaitForApplication,
});

test.describe('Kernels', () => {
  test('Default kernel name', async ({ page }) => {
    // mock the default kernel name
    await page.route('jupyter-lite.json', async (route, request) => {
      const response = await page.request.fetch(route.request());
      const body = await response.json();
      body['jupyter-config-data'].defaultKernelName = 'javascript';
      return route.fulfill({
        response,
        body: JSON.stringify(body),
        headers: {
          ...response.headers(),
        },
      });
    });

    await page.goto('lab/index.html');
    await page.sidebar.close('left');

    const imageName = 'default-kernel-name.png';
    expect(await page.screenshot()).toMatchSnapshot(imageName.toLowerCase());
  });

  // check it is possible to open a notebook, shut down its kernel and open it again
  test('Kernel shutdown', async ({ page }) => {
    await page.goto('lab/index.html');
    const name = await page.notebook.createNew();
    if (!name) {
      throw new Error('Notebook name is undefined');
    }

    await page.click('[title="Running Terminals and Kernels"]');

    await page
      .locator(`.jp-RunningSessions-item.jp-mod-kernel >> text="${name}"`)
      .waitFor();
  });
});
