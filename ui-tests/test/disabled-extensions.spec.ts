// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { test } from '@jupyterlab/galata';
import type { IJupyterLabPageFixture } from '@jupyterlab/galata';

import { expect } from '@playwright/test';

import type { Locator, Route } from '@playwright/test';

import { firefoxWaitForApplication, treeWaitForApplication } from './utils';

/**
 * A federated extension of the test site, its only plugin and the theme it adds.
 */
const EXTENSION = 'jupyterlab-night';
const PLUGIN_ID = 'jupyterlab-night:plugin';
const THEME = 'JupyterLab Night';

/**
 * Add entries to the `disabledExtensions` list of the site configuration.
 */
async function disableExtensions(
  page: IJupyterLabPageFixture,
  entries: string[],
): Promise<void> {
  await page.route('jupyter-lite.json', async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    const config = body['jupyter-config-data'];
    config.disabledExtensions = [...(config.disabledExtensions ?? []), ...entries];
    return route.fulfill({ response, body: JSON.stringify(body) });
  });
}

/**
 * Open the plugin manager from the command palette, filtered on the extension.
 */
async function openPluginManager(
  page: IJupyterLabPageFixture,
  filter = EXTENSION,
): Promise<Locator> {
  await page.keyboard.press('ControlOrMeta+Shift+C');
  await page.keyboard.type('Advanced Plugin Manager');
  // The page can show before the command is added to the palette.
  await page
    .locator('.lm-CommandPalette-item', { hasText: 'Advanced Plugin Manager' })
    .click();
  const pluginManager = page.locator('.jp-pluginmanager');
  await pluginManager.getByRole('searchbox').fill(filter);
  await expect(
    pluginManager.getByRole('columnheader', { name: 'Plugin' }),
  ).toBeVisible();
  return pluginManager;
}

/**
 * The row of the plugin in the plugin manager.
 */
function pluginRow(pluginManager: Locator, pluginId = PLUGIN_ID): Locator {
  return pluginManager.getByRole('row').filter({ hasText: pluginId });
}

/**
 * Check that the plugin manager lists the plugin as disabled.
 */
async function expectListedAsDisabled(pluginManager: Locator): Promise<void> {
  const checkbox = pluginRow(pluginManager).getByRole('checkbox');
  await expect(checkbox).not.toBeChecked();
  await expect(checkbox).toBeDisabled();
}

/**
 * The themes listed in the Settings > Theme menu.
 */
async function listedThemes(page: IJupyterLabPageFixture): Promise<string[]> {
  const menu = await page.menu.openLocator('Settings>Theme');
  const themes = await menu!.locator('.lm-Menu-itemLabel').allInnerTexts();
  await page.menu.closeAll();
  return themes;
}

/**
 * Check that the plugin of the extension does not add its theme.
 */
async function expectThemeNotAdded(page: IJupyterLabPageFixture): Promise<void> {
  const themes = await listedThemes(page);
  expect(themes).toContain('JupyterLab Light');
  expect(themes).not.toContain(THEME);
}

/**
 * Hold back the requests for the extension code until `release` is called.
 */
async function holdExtensionCode(page: IJupyterLabPageFixture) {
  const held: Route[] = [];
  const isCode = (url: URL) =>
    url.pathname.includes(`/extensions/${EXTENSION}/static/`) &&
    !url.pathname.includes('remoteEntry');
  await page.route(isCode, (route) => {
    held.push(route);
  });
  return {
    held,
    release: async () => {
      await page.unroute(isCode);
      for (const route of held) {
        await route.continue();
      }
    },
  };
}

test.describe('Disabled federated extensions', () => {
  test.use({ waitForApplication: firefoxWaitForApplication });

  test('A plugin id disables the plugin', async ({ page }) => {
    await disableExtensions(page, [PLUGIN_ID]);

    await page.goto('lab/index.html');

    await expectListedAsDisabled(await openPluginManager(page));
    await expectThemeNotAdded(page);
  });

  test.describe('Deferred loading', () => {
    // Requests handled by the service worker bypass the routes.
    test.use({ serviceWorkers: 'block' });

    test('A package name defers loading the extension in JupyterLab', async ({
      page,
    }) => {
      await disableExtensions(page, [EXTENSION]);
      // A startup that waits for the held code never ends.
      const code = await holdExtensionCode(page);

      await page.goto('lab/index.html');

      const pluginManager = await openPluginManager(page);
      await expect(pluginRow(pluginManager)).toHaveCount(0);

      await code.release();

      await expectListedAsDisabled(pluginManager);
      await expectThemeNotAdded(page);
    });
  });
});

test.describe('Disabled federated extensions in Notebook', () => {
  test.use({
    waitForApplication: treeWaitForApplication,
    serviceWorkers: 'block',
  });

  test('A package name defers loading the extension in the file browser', async ({
    page,
  }) => {
    await disableExtensions(page, [EXTENSION]);
    const code = await holdExtensionCode(page);

    await page.goto('tree/index.html');

    // The plugin manager does not show on this page: check that the app
    // requests the code once started, to list the plugins of the extension.
    await expect.poll(() => code.held.length).toBeGreaterThan(0);
    await code.release();

    await expectThemeNotAdded(page);
  });
});

test.describe('Extensions disabled by the user', () => {
  test.use({ waitForApplication: firefoxWaitForApplication });

  test.beforeEach(async ({ page }) => {
    await page.goto('lab/index.html');
  });

  test('A core plugin is disabled and enabled from the plugin manager', async ({
    page,
  }) => {
    const pluginId = '@jupyterlab/theme-dark-extension:plugin';
    const theme = 'JupyterLab Dark';
    const setEnabled = async (enabled: boolean) => {
      const pluginManager = await openPluginManager(page, pluginId);
      await pluginManager.getByRole('checkbox', { name: /I understand/ }).check();
      const checkbox = pluginRow(pluginManager, pluginId).getByRole('checkbox');
      await checkbox.click();
      await expect(checkbox).toBeChecked({ checked: enabled });
    };

    await setEnabled(false);
    await page.reload();
    expect(await listedThemes(page)).not.toContain(theme);

    await setEnabled(true);
    await page.reload();
    expect(await listedThemes(page)).toContain(theme);
  });

  test('The in-browser services cannot be disabled', async ({ page }) => {
    const pluginId = '@jupyterlite/services-extension:settings';
    const pluginManager = await openPluginManager(page, pluginId);
    await pluginManager.getByRole('checkbox', { name: /I understand/ }).check();

    await expect(
      pluginRow(pluginManager, pluginId).getByRole('checkbox'),
    ).toBeDisabled();
  });

  test('An extension is disabled and enabled from the extension manager', async ({
    page,
  }) => {
    const toggle = async (action: 'Disable' | 'Enable') => {
      await page.sidebar.openTab('extensionmanager.main-view');
      await page
        .locator('.jp-extensionmanager-entry', { hasText: EXTENSION })
        .getByRole('button', { name: action })
        .click();
      await page.getByRole('button', { name: 'Ok', exact: true }).click();
    };

    await toggle('Disable');
    await page.reload();
    await expectThemeNotAdded(page);

    await toggle('Enable');
    await page.reload();
    expect(await listedThemes(page)).toContain(THEME);
  });
});
