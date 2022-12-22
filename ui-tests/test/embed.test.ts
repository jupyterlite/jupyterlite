// Copyright (c) JupyterLite Contributors
// Distributed under the terms of the Modified BSD License.

import { expect, test } from '@playwright/test';

test.use({ baseURL: 'http://localhost:8001' });

/**
 * This test uses the raw Playwright since the host page does not expose window.jupyterapp
 */
test.describe('Embed the REPL app', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('embed/index.html');
    await page
      .frameLocator('#repl')
      .getByText('A JavaScript kernel running in the browser')
      .first()
      .waitFor({ state: 'visible' });
  });

  test('Page', async ({ page }) => {
    const imageName = 'embed-repl.png';
    expect(await page.screenshot()).toMatchSnapshot(imageName.toLowerCase());
  });
});
