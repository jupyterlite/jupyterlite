// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { ReadonlyJSONObject, Token } from '@lumino/coreutils';

/**
 * The well-known name of the file. Can actually be configured by alternate
 * implementations, but the default is probably good enough for "best-effort."
 */
export const THIRD_PARTY_LICENSES = 'third-party-licenses.json';

/**
 * The token for the licenses service.
 */
export const ILicenses = new Token<ILicenses>('@jupyterlite/licenses:ILicenses');

/**
 * The interface for the Settings service.
 */
export interface ILicenses {
  /**
   * Get licenses
   *
   */
  get(): Promise<ILicenseResponse | undefined>;
}

/**
 * A named bundle of licenses
 */
export interface ILicenseBundles {
  [key: string]: ILicenseBundle;
}

/**
 * The JSON response from the API
 */
export interface ILicenseResponse {
  bundles: ILicenseBundles;
}

/**
 * A top-level report of the licenses for all code included in a bundle
 *
 * Note
 *
 * This is roughly informed by the terms defined in the SPDX spec, though is not
 * an SPDX Document, since there seem to be several (incompatible) specs
 * in that repo.
 *
 * @see https://github.com/spdx/spdx-spec/blob/development/v2.2.1/schemas/spdx-schema.json
 **/
export interface ILicenseBundle extends ReadonlyJSONObject {
  packages: IPackageLicenseInfo[];
}

/**
 * A best-effort single bundled package's information.
 *
 * Note
 *
 * This is roughly informed by SPDX `packages` and `hasExtractedLicenseInfos`,
 * as making it conformant would vastly complicate the structure.
 *
 * @see https://github.com/spdx/spdx-spec/blob/development/v2.2.1/schemas/spdx-schema.json
 **/
export interface IPackageLicenseInfo extends ReadonlyJSONObject {
  /**
   * the name of the package as it appears in package.json
   */
  name: string;
  /**
   * the version of the package, or an empty string if unknown
   */
  versionInfo: string;
  /**
   * an SPDX license identifier or LicenseRef, or an empty string if unknown
   */
  licenseId: string;
  /**
   * the verbatim extracted text of the license, or an empty string if unknown
   */
  extractedText: string;
}
