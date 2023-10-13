// Copyright (c) JupyterLite Contributors
// Distributed under the terms of the Modified BSD License.

import { test } from '@jupyterlab/galata';

import { expect } from '@playwright/test';

import { firefoxWaitForApplication } from './utils';

test.use({
  waitForApplication: firefoxWaitForApplication,
});

test.describe('Translation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('lab/index.html');
  });

  test('Switch to French', async ({ page }) => {
    const menuItem = 'Settings>Language>French (France) - Français (France)';
    await page.menu.clickMenuItem(menuItem);

    await page.locator('text="Change and reload"').click();

    await page.waitForLoadState();
    await page.waitForSelector('text="Lanceur"');

    // Language settings should be persisted on page reload
    await page.reload();
    expect(await page.locator('text="Lanceur"').first().isVisible()).toBeTruthy();
  });
});
