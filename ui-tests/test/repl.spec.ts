// Copyright (c) JupyterLite Contributors
// Distributed under the terms of the Modified BSD License.

import { test as base } from '@jupyterlab/galata';

import { expect } from '@playwright/test';

import type { Page } from '@playwright/test';

import { waitForConsoleToSettle } from './utils';

// Use custom waitForApplication to wait for the REPL to be ready
const test = base.extend({
  waitForApplication: async ({ baseURL }, use, testInfo) => {
    const waitIsReady = async (page): Promise<void> => {
      await page.waitForSelector('.jp-InputArea');
    };
    await use(waitIsReady);
  },
});

test.describe('Basic REPL Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('repl/index.html?toolbar=1&kernel=javascript');
  });

  test('Page', async ({ page }) => {
    await waitForConsoleToSettle(page);
    const imageName = 'page.png';
    expect(await page.screenshot({ animations: 'disabled' })).toMatchSnapshot(
      imageName.toLowerCase(),
    );
  });

  test('Toggle Dark theme', async ({ page }) => {
    await page.theme.setDarkTheme();
    await waitForConsoleToSettle(page);
    const imageName = 'dark-theme.png';
    expect(await page.screenshot({ animations: 'disabled' })).toMatchSnapshot(
      imageName.toLowerCase(),
    );
  });

  test('Toggle Light theme', async ({ page }) => {
    await page.theme.setDarkTheme();
    await page.theme.setLightTheme();

    expect(await page.theme.getTheme()).toEqual('JupyterLab Light');
  });
});

test.describe('Populate REPL prompt', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(
      'repl/index.html?toolbar=1&kernel=javascript&code=console.log("hello")&code=console.log("world")&execute=0',
    );
  });

  test('Populate prompt without executing', async ({ page }) => {
    await waitForConsoleToSettle(page);
    const imageName = 'populate-prompt.png';
    expect(await page.screenshot({ animations: 'disabled' })).toMatchSnapshot(
      imageName.toLowerCase(),
    );
  });
});

test.describe('Share current REPL state', () => {
  // the prompt cell is rendered to the left of the console cells
  const promptIsLeftOfCells = async (page: Page): Promise<boolean> => {
    const promptBox = await page.locator('.jp-CodeConsole-promptCell').boundingBox();
    const cellsBox = await page.locator('.jp-CodeConsole-content').boundingBox();
    return !!promptBox && !!cellsBox && promptBox.x + promptBox.width <= cellsBox.x;
  };

  test('Round-trips the current prompt and REPL options', async ({
    page,
    context,
    browserName,
  }) => {
    await page.goto(
      'repl/index.html?toolbar=1&kernel=javascript&promptCellPosition=left&clearCellsOnExecute=1&clearCodeContentOnExecute=0&hideCodeInput=1&showBanner=0',
    );

    // the kernel name shows up in the toolbar once the session is started
    await expect(
      page.getByRole('button', { name: 'JavaScript (Web Worker)' }),
    ).toBeVisible();

    // the prompt moves to the left once the URL options are applied
    await expect.poll(() => promptIsLeftOfCells(page)).toBe(true);

    await page.locator('.jp-CodeConsole-promptCell .cm-content').click();
    await page.keyboard.type('console.log("shared")\nconsole.log("state")');

    await page.theme.setDarkTheme();
    await page.getByRole('button', { name: 'Copy a shareable link' }).click();

    const sharedUrl = new URL(page.url());
    expect(sharedUrl.search).toBe('');
    const sharedParams = new URLSearchParams(sharedUrl.hash.slice(1));

    expect(sharedParams.get('toolbar')).toBe('1');
    expect(sharedParams.get('kernel')).toBe('javascript');
    expect(sharedParams.get('theme')).toBe('JupyterLab Dark');
    expect(sharedParams.get('promptCellPosition')).toBe('left');
    expect(sharedParams.get('clearCellsOnExecute')).toBe('1');
    expect(sharedParams.get('clearCodeContentOnExecute')).toBe('0');
    expect(sharedParams.get('hideCodeInput')).toBe('1');
    expect(sharedParams.get('showBanner')).toBe('0');
    expect(sharedParams.get('execute')).toBe('0');
    expect(sharedParams.getAll('code')).toEqual([
      'console.log("shared")',
      'console.log("state")',
    ]);

    if (browserName === 'chromium') {
      // check the link was copied to the clipboard (not supported on firefox)
      await context.grantPermissions(['clipboard-read']);
      const clipboard = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboard).toBe(sharedUrl.toString());
    }

    await page.goto(sharedUrl.toString());

    // the prompt is populated with the shared code once the session is ready
    const prompt = page.locator('.jp-CodeConsole-promptCell');
    await expect(prompt).toContainText('console.log("shared")');
    await expect(prompt).toContainText('console.log("state")');

    await expect.poll(async () => page.theme.getTheme()).toBe('JupyterLab Dark');

    // the kernel and the toolbar are restored
    await expect(
      page.getByRole('button', { name: 'JavaScript (Web Worker)' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Copy a shareable link' }),
    ).toBeVisible();

    // the prompt is restored to the left, and the banner stays hidden
    await expect.poll(() => promptIsLeftOfCells(page)).toBe(true);
    await expect(page.locator('.jp-CodeConsole-banner')).toHaveCount(0);
  });

  test('Does not include default REPL options in the link', async ({ page }) => {
    await page.goto('repl/index.html?toolbar=1&kernel=javascript');

    // the banner shows up once the kernel is ready
    await expect(page.locator('.jp-CodeConsole-banner')).toContainText(
      'A JavaScript kernel running in the browser',
    );

    await page.locator('.jp-CodeConsole-promptCell .cm-content').click();
    await page.keyboard.type('console.log("shared")');

    await page.getByRole('button', { name: 'Copy a shareable link' }).click();

    const sharedUrl = new URL(page.url());
    expect(sharedUrl.search).toBe('');
    const sharedParams = new URLSearchParams(sharedUrl.hash.slice(1));

    expect(sharedParams.get('toolbar')).toBe('1');
    expect(sharedParams.get('kernel')).toBe('javascript');
    expect(sharedParams.get('execute')).toBe('0');
    expect(sharedParams.getAll('code')).toEqual(['console.log("shared")']);
    expect(sharedParams.has('promptCellPosition')).toBe(false);
    expect(sharedParams.has('clearCellsOnExecute')).toBe(false);
    expect(sharedParams.has('clearCodeContentOnExecute')).toBe(false);
    expect(sharedParams.has('hideCodeInput')).toBe(false);
    expect(sharedParams.has('showBanner')).toBe(false);
  });

  test('Shows a single notification when copying the link multiple times', async ({
    page,
  }) => {
    await page.goto('repl/index.html?toolbar=1&kernel=javascript');

    // the banner shows up once the kernel is ready
    await expect(page.locator('.jp-CodeConsole-banner')).toContainText(
      'A JavaScript kernel running in the browser',
    );

    const shareButton = page.getByRole('button', { name: 'Copy a shareable link' });
    const notifications = page.getByRole('alert');

    await shareButton.click();

    await expect(notifications).toHaveCount(1);
    await expect(notifications).toContainText('Link copied to clipboard');

    // type more code and copy the link again multiple times
    await page.locator('.jp-CodeConsole-promptCell .cm-content').click();
    await page.keyboard.type('\nconsole.log("extra")');

    await shareButton.click();
    await shareButton.click();

    // the link is updated with the new prompt content
    await expect(page).toHaveURL(/extra/);

    // re-sharing rewrites the fragment from the current state rather than
    // stacking onto the previous one, so the code is not duplicated
    const sharedParams = new URLSearchParams(new URL(page.url()).hash.slice(1));
    expect(
      sharedParams.getAll('code').filter((line) => line.includes('extra')),
    ).toHaveLength(1);

    // the notifications should not stack up
    await expect(notifications).toHaveCount(1);
    await expect(notifications).toContainText('Link copied to clipboard');
  });
});
