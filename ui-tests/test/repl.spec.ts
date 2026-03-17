// Copyright (c) JupyterLite Contributors
// Distributed under the terms of the Modified BSD License.

import { test as base } from '@jupyterlab/galata';

import { expect } from '@playwright/test';

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

test.describe('Populate REPL prompt', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(
      'repl/index.html?toolbar=1&kernel=javascript&code=console.log("hello")&code=console.log("world")&execute=0',
    );
  });

  test('Populate prompt without executing', async ({ page }) => {
    const imageName = 'populate-prompt.png';
    expect(await page.screenshot()).toMatchSnapshot(imageName.toLowerCase());
  });
});

test.describe('Share current REPL state', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('repl/index.html?toolbar=1&kernel=javascript');
  });

  test('Round-trips the current prompt and REPL options', async ({ page }) => {
    await page.evaluate(async () => {
      const app = (window as any).jupyterapp;
      const panel = app.shell.currentWidget;

      panel.console.promptCell.model.sharedModel.setSource(
        'console.log("shared")\nconsole.log("state")',
      );
      panel.console.setConfig({
        clearCellsOnExecute: true,
        clearCodeContentOnExecute: false,
        hideCodeInput: true,
        showBanner: false,
      });

      await app.commands.execute('console:prompt-to-left');
    });

    await page.theme.setDarkTheme();
    await page.getByRole('button', { name: 'Copy Shareable Link' }).click();

    const sharedUrl = new URL(page.url());

    expect(sharedUrl.searchParams.get('toolbar')).toBe('1');
    expect(sharedUrl.searchParams.get('kernel')).toBe('javascript');
    expect(sharedUrl.searchParams.get('theme')).toBe('JupyterLab Dark');
    expect(sharedUrl.searchParams.get('promptCellPosition')).toBe('left');
    expect(sharedUrl.searchParams.get('clearCellsOnExecute')).toBe('1');
    expect(sharedUrl.searchParams.get('clearCodeContentOnExecute')).toBe('0');
    expect(sharedUrl.searchParams.get('hideCodeInput')).toBe('1');
    expect(sharedUrl.searchParams.get('showBanner')).toBe('0');
    expect(sharedUrl.searchParams.get('execute')).toBe('0');
    expect(sharedUrl.searchParams.getAll('code')).toEqual([
      'console.log("shared")',
      'console.log("state")',
    ]);

    await page.goto(sharedUrl.toString());

    await expect.poll(async () => page.theme.getTheme()).toBe('JupyterLab Dark');

    const state = await page.evaluate(() => {
      const app = (window as any).jupyterapp;
      const panel = app.shell.currentWidget;

      return {
        code: panel.console.promptCell.model.sharedModel.getSource(),
        config: panel.console._config,
        kernelName: panel.sessionContext.session?.kernel?.name ?? '',
        toolbarDisposed: panel.toolbar.isDisposed,
      };
    });

    expect(state.code).toBe('console.log("shared")\nconsole.log("state")');
    expect(state.config.promptCellPosition).toBe('left');
    expect(state.config.clearCellsOnExecute).toBe(true);
    expect(state.config.clearCodeContentOnExecute).toBe(false);
    expect(state.config.hideCodeInput).toBe(true);
    expect(state.config.showBanner).toBe(false);
    expect(state.kernelName).toBe('javascript');
    expect(state.toolbarDisposed).toBe(false);
  });
});
