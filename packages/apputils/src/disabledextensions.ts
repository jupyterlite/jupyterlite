// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { PageConfig } from '@jupyterlab/coreutils';

import localforage from 'localforage';

/**
 * The key of the entries in the settings storage.
 */
const STORAGE_KEY = 'disabledExtensions';

/**
 * The plugins and extensions disabled or enabled by the user, stored in the browser.
 *
 * As the `disabledExtensions` of the JupyterLab user page config, it maps plugin ids
 * and extension names to whether they are disabled. It is stored with the user
 * settings, and applies on page load on top of the `disabledExtensions` of the site.
 */
export namespace UserDisabledExtensions {
  /**
   * Get whether the user disabled each plugin id or extension name.
   */
  export async function get(): Promise<Map<string, boolean>> {
    try {
      const stored = await Private.storage().getItem<Record<string, boolean>>(
        STORAGE_KEY,
      );
      return new Map(Object.entries(stored ?? {}));
    } catch (reason) {
      console.warn('Could not read the extensions disabled by the user:', reason);
      return new Map();
    }
  }

  /**
   * Get the plugin ids and extension names disabled by the user.
   */
  export async function list(): Promise<string[]> {
    return [...(await get())].filter(([, disabled]) => disabled).map(([name]) => name);
  }

  /**
   * Store whether the user disabled a plugin id or an extension name.
   */
  export function set(name: string, disabled: boolean): Promise<void> {
    return Private.enqueue(async () => {
      const entries = (await get()).set(name, disabled);
      await Private.storage().setItem(STORAGE_KEY, Object.fromEntries(entries));
    });
  }
}

/**
 * A namespace for private functionality.
 */
namespace Private {
  /**
   * Run the writes in turn, as each one reads the stored entries first.
   */
  export function enqueue(write: () => Promise<void>): Promise<void> {
    const result = writes.then(write);
    writes = result.catch(() => undefined);
    return result;
  }

  /**
   * Get the settings storage, with the options of the settings manager.
   */
  export function storage(): LocalForage {
    if (!_storage) {
      const baseUrl = PageConfig.getOption('baseUrl');
      const drivers = JSON.parse(
        PageConfig.getOption('settingsStorageDrivers') || 'null',
      );
      _storage = localforage.createInstance({
        version: 1,
        name:
          PageConfig.getOption('settingsStorageName') ||
          `JupyterLite Storage - ${baseUrl}`,
        storeName: 'settings',
        ...(drivers?.length ? { driver: drivers } : {}),
      });
    }
    return _storage;
  }

  let writes = Promise.resolve();
  let _storage: LocalForage | undefined;
}
