// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { test } from '@jupyterlab/galata';
import type { IJupyterLabPageFixture } from '@jupyterlab/galata';

import { expect } from '@playwright/test';

import { firefoxWaitForApplication } from './utils';

/**
 * A plugin of a federated extension of the test site, and the theme it adds.
 */
const PLUGIN_ID = 'jupyterlab-night:plugin';
const THEME = 'JupyterLab Night';

/**
 * Another federated extension of the test site, which declares `disabledExtensions`.
 */
const DECLARING_EXTENSION = '@jupyterlite/p5-kernel-extension';

/**
 * Add entries to the `disabledExtensions` list of the site configuration, and
 * declare entries for another extension, as the build copies them from the
 * `package.json` of the extension.
 */
async function disableExtensions(
  page: IJupyterLabPageFixture,
  entries: string[],
  declared: string[] = [],
): Promise<void> {
  await page.route('jupyter-lite.json', async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    const config = body['jupyter-config-data'];
    config.disabledExtensions = [...(config.disabledExtensions ?? []), ...entries];
    if (declared.length) {
      const extension = config.federated_extensions.find(
        ({ name }: { name: string }) => name === DECLARING_EXTENSION,
      );
      extension.disabledExtensions = declared;
    }
    return route.fulfill({ response, body: JSON.stringify(body) });
  });
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

test.describe('Disabled federated extensions', () => {
  test.use({ waitForApplication: firefoxWaitForApplication });

  test('An extension disables the plugins it declares', async ({ page }) => {
    await disableExtensions(page, [], [PLUGIN_ID]);

    await page.goto('lab/index.html');

    const themes = await listedThemes(page);
    expect(themes).toContain('JupyterLab Light');
    expect(themes).not.toContain(THEME);
  });

  test('A disabled extension does not disable the plugins it declares', async ({
    page,
  }) => {
    await disableExtensions(page, [DECLARING_EXTENSION], [PLUGIN_ID]);

    await page.goto('lab/index.html');

    expect(await listedThemes(page)).toContain(THEME);
  });
});
