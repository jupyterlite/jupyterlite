import { URLExt, PageConfig } from '@jupyterlab/coreutils';
import { IFederatedExtension } from '@jupyterlite/types';

import {
  ILicenseBundle,
  ILicenseBundles,
  ILicenseResponse,
  ILicenses,
  THIRD_PARTY_LICENSES
} from './tokens';

export class Licenses implements ILicenses {
  async get(): Promise<ILicenseResponse> {
    const appName = PageConfig.getOption('appName') || 'JupyterLite';
    return {
      bundles: {
        ...(await this._getFederated()),
        [appName]: await this._getAppLicenses()
      }
    };
  }

  async _getAppLicenses(): Promise<ILicenseBundle> {
    const url = URLExt.join(
      PageConfig.getOption('appUrl'),
      'build',
      THIRD_PARTY_LICENSES
    );
    const response = await fetch(url);
    return await response.json();
  }

  async _getFederated(): Promise<ILicenseBundles> {
    const bundles: ILicenseBundles = {};
    let federated: IFederatedExtension[];

    const labExtensionsUrl = PageConfig.getOption('fullLabextensionsUrl');

    try {
      federated = JSON.parse(PageConfig.getOption('federated_extensions'));
    } catch {
      return bundles;
    }

    for (const ext of federated) {
      try {
        const url = URLExt.join(
          labExtensionsUrl,
          ext.name,
          'static',
          THIRD_PARTY_LICENSES
        );
        const response = await fetch(url);
        bundles[ext.name] = await response.json();
      } catch {
        // nothing to see here
      }
    }

    return bundles;
  }
}
