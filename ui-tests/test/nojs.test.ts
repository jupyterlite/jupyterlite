// Copyright (c) JupyterLite Contributors
// Distributed under the terms of the Modified BSD License.

import { test, expect } from '@playwright/test';

test.describe('JavaScript disabled', () => {
  test.use({ javaScriptEnabled: false });

  test('Show a message on the page to enable JavaScript', async ({ page }) => {
    await page.goto('lab/index.html');

    await page.waitForLoadState('domcontentloaded');

    const message = 'JupyterLite requires JavaScript to be enabled in your browser.';
    expect(page.getByText(message)).toBeVisible();
  });
});
