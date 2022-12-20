// Copyright (c) JupyterLite Contributors
// Distributed under the terms of the Modified BSD License.

import { test } from '@jupyterlab/galata';

import { expect } from '@playwright/test';

import { config } from './utils';

test.use(config);

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
});
