import { URLExt, PageConfig } from '@jupyterlab/coreutils';
import {
  ILicenseBundle,
  ILicenseResponse,
  ILicenses,
  THIRD_PARTY_LICENSES
} from './tokens';

export class Licenses implements ILicenses {
  async get(): Promise<ILicenseResponse> {
    return { bundles: { 'this app': await this._getAppLicenses() } };
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
}
