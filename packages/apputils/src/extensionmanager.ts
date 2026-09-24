// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { Dialog, showDialog } from '@jupyterlab/apputils';

import { PageConfig, URLExt } from '@jupyterlab/coreutils';

import type { IActionReply, IEntry } from '@jupyterlab/extensionmanager';
import { ListModel } from '@jupyterlab/extensionmanager';

import type { IFederatedExtension } from '@jupyterlite/types';

import { UserDisabledExtensions } from './disabledextensions';

/**
 * The extension manager model for JupyterLite.
 *
 * Lists the federated extensions shipped with the site from their `package.json`,
 * instead of querying the server extensions API.
 */
export class LiteExtensionListModel extends ListModel {
  /**
   * Fetch the federated extensions of the site as extension entries.
   *
   * Extensions disabled via the `disabledExtensions` of the site are skipped, as
   * they cannot be enabled from the browser.
   */
  protected async fetchInstalled(force: boolean): Promise<IEntry[]> {
    const extensions = JSON.parse(
      PageConfig.getOption('federated_extensions') || '[]',
    ) as IFederatedExtension[];
    const labExtensionsUrl = PageConfig.getOption('fullLabextensionsUrl');
    const userDisabled = await UserDisabledExtensions.get();

    return Promise.all(
      extensions
        .filter((extension) => !PageConfig.Extension.isDisabled(extension.name))
        .map(async ({ name }) => {
          const url = URLExt.join(labExtensionsUrl, name, 'package.json');
          let pkg: Private.IPackageJson = { name };
          try {
            const response = await fetch(url, { cache: force ? 'reload' : 'default' });
            if (!response.ok) {
              throw new Error(response.statusText);
            }
            pkg = await response.json();
          } catch (reason) {
            console.warn(`Could not fetch the package.json of ${name}:`, reason);
          }
          return Private.toEntry(pkg, !userDisabled.get(name));
        }),
    );
  }

  /**
   * Store the extension enabled or disabled by the user, applied on page reload.
   */
  protected async performAction(action: string, entry: IEntry): Promise<IActionReply> {
    await UserDisabledExtensions.set(entry.name, action === 'disable');
    const trans = this.translator.load('jupyterlab');
    void showDialog({
      title: trans.__('Information'),
      body: trans.__(
        'You will need to %1 to apply the changes.',
        trans.__('refresh the web page'),
      ),
      buttons: [Dialog.okButton({ label: trans.__('Ok') })],
    });
    return { status: 'ok', needs_restart: ['frontend'] };
  }
}

/**
 * A namespace for private functionality.
 */
namespace Private {
  /**
   * The `package.json` fields of a federated extension used by the listing.
   */
  export interface IPackageJson {
    name: string;
    version?: string;
    description?: string;
    homepage?: string;
    license?: string;
    author?: string | { name?: string };
    bugs?: string | { url?: string };
    repository?: string | { url?: string };
  }

  /**
   * Map the `package.json` of a federated extension to an extension entry.
   *
   * Federated extensions are bundled with the site, so they are always installed
   * and allowed, and their installed version is also the latest one.
   */
  export function toEntry(pkg: IPackageJson, enabled: boolean): IEntry {
    const { author, bugs, repository } = pkg;
    const version = pkg.version ?? '';
    return {
      name: pkg.name,
      description: pkg.description ?? '',
      homepage_url: pkg.homepage ?? '',
      installed: true,
      enabled,
      allowed: true,
      approved: false,
      status: 'ok',
      latest_version: version,
      installed_version: version,
      pkg_type: 'prebuilt',
      author: typeof author === 'string' ? author : author?.name,
      license: pkg.license,
      bug_tracker_url: typeof bugs === 'string' ? bugs : bugs?.url,
      repository_url: typeof repository === 'string' ? repository : repository?.url,
    };
  }
}
