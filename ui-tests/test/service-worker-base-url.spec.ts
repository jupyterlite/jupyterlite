// Copyright (c) JupyterLite Contributors
// Distributed under the terms of the Modified BSD License.

import { expect, test } from '@playwright/test';

/**
 * The heartbeat keeping the service worker alive must be sent under the base URL,
 * otherwise it falls outside of the scope of the service worker, is never
 * intercepted by it, and the browser is free to terminate it when idle.
 *
 * This uses the server serving the whole `ui-tests` directory, so that the app is
 * deployed under a base URL which is not the root of the origin, as is the case
 * for example on GitHub Pages project sites.
 */
const ORIGIN = 'http://localhost:8001';
const BASE_URL = `${ORIGIN}/ui-tests-app/`;

test.use({
  baseURL: ORIGIN,
});

test.describe('Service Worker heartbeat under a base URL', () => {
  test('is answered by the service worker', async ({ page }) => {
    await page.goto(`${BASE_URL}lab/index.html`);

    // the heartbeat is only sent once the service worker controls the page
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

    const response = await page.waitForResponse(
      (response) => response.url().includes('/api/service-worker-heartbeat'),
      // the first heartbeat is sent one interval after registration
      { timeout: 60000 },
    );

    expect(response.url()).toEqual(`${BASE_URL}api/service-worker-heartbeat`);
    expect(await response.text()).toEqual('ok');
  });
});
