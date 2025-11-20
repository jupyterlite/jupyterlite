// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { Licenses } from '@jupyterlab/apputils';

import { URLExt, PageConfig } from '@jupyterlab/coreutils';

import type { IFederatedExtension } from '@jupyterlite/types';

/**
 * A license bundle is a collection of packages and their licenses.
 */
type ILicenseBundles = { [key: string]: Licenses.ILicenseBundle };

/**
 * The well-known name of the file. Can actually be configured by alternate
 * implementations, but the default is probably good enough for "best-effort."
 */
export const THIRD_PARTY_LICENSES = 'third-party-licenses.json';

/**
 * An empty bundle.
 */
const EMPTY_BUNDLE: Licenses.ILicenseBundle = Object.freeze({ packages: [] });

/**
 * A JupyterLite implementation of the jupyterlab_server licenses route
 */
export class LiteLicensesClient extends Licenses.LicensesClient {
  /**
   * A GET handler for the licenses
   */
  async getBundles(): Promise<Licenses.ILicenseResponse> {
    return {
      bundles: {
        ...(await this._getFederated()),
        [this.appName]: await this._getAppLicenses(),
      },
    };
  }

  /**
   * Download the licenses in the requested format.
   */
  async download(options: Licenses.IDownloadOptions): Promise<void> {
    const link = document.createElement('a');
    link.href = await this._getDownloadLink(options);
    const extension = options.format === 'markdown' ? 'md' : options.format;
    link.download = `jupyterlite-licenses.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Get the app name (or default).
   */
  protected get appName(): string {
    return PageConfig.getOption('appName') || 'JupyterLite';
  }

  /**
   * Get the well-known URL of the app licenses.
   */
  protected get appLicensesUrl(): string {
    return URLExt.join(PageConfig.getBaseUrl(), 'build', THIRD_PARTY_LICENSES);
  }

  /**
   * Get the lab extension base url.
   */
  protected get labExtensionsUrl(): string {
    return PageConfig.getOption('fullLabextensionsUrl');
  }

  /**
   * Get the download link for the requested format
   */
  private async _getDownloadLink(options: Licenses.IDownloadOptions): Promise<string> {
    const bundles = await this.getBundles();
    let formattedData: string;
    let mime: string;

    // Format the data based on the requested format
    switch (options.format) {
      case 'json':
        formattedData = JSON.stringify(bundles, null, 2);
        mime = 'application/json';
        break;
      case 'markdown':
        formattedData = this._formatAsMarkdown(bundles);
        mime = 'text/markdown';
        break;
      case 'csv':
        formattedData = this._formatAsCSV(bundles);
        mime = 'text/csv';
        break;
      default:
        // Fallback to JSON
        formattedData = JSON.stringify(bundles, null, 2);
        mime = 'application/json';
    }

    // Create a blob with the appropriate MIME type
    const blob = new Blob([formattedData], { type: mime });

    // Generate a URL for the blob
    return URL.createObjectURL(blob);
  }

  /**
   * Format license data as Markdown
   */
  private _formatAsMarkdown(data: Licenses.ILicenseResponse): string {
    let md = '# Third-Party Licenses\n\n';

    // Process each bundle
    for (const [bundleName, bundle] of Object.entries(data.bundles)) {
      md += `## ${bundleName}\n\n`;

      // Process packages in the bundle
      for (const pkg of bundle.packages) {
        md += `### ${pkg.name}${pkg.versionInfo ? ` ${pkg.versionInfo}` : ''}\n\n`;

        if (pkg.licenseId) {
          md += `**License ID:** ${pkg.licenseId}\n\n`;
        }

        if (pkg.extractedText) {
          md += `\`\`\`\n${pkg.extractedText}\n\`\`\`\n\n`;
        }
      }
    }

    return md;
  }

  /**
   * Format license data as CSV
   */
  private _formatAsCSV(data: Licenses.ILicenseResponse): string {
    // CSV header
    const headers = ['Bundle', 'Package', 'Version', 'License ID', 'License Text'];
    let csv = `${headers.join(',')}\n`;

    // Process each bundle and package
    for (const [bundleName, bundle] of Object.entries(data.bundles)) {
      for (const pkg of bundle.packages) {
        const row = [
          this._escapeCSVField(bundleName),
          this._escapeCSVField(pkg.name),
          this._escapeCSVField(pkg.versionInfo || ''),
          this._escapeCSVField(pkg.licenseId || ''),
          this._escapeCSVField(pkg.extractedText || ''),
        ];
        csv += `${row.join(',')}\n`;
      }
    }

    return csv;
  }

  /**
   * Escape a field for CSV output
   */
  private _escapeCSVField(field: string): string {
    // If the field contains commas, quotes, or newlines, wrap it in quotes and escape any quotes
    if (field && (field.includes(',') || field.includes('"') || field.includes('\n'))) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }

  /**
   * Resolve the licenses for the app distribution itself, or the empty bundle.
   */
  private async _getAppLicenses(): Promise<Licenses.ILicenseBundle> {
    let bundle = EMPTY_BUNDLE;

    try {
      const response = await fetch(this.appLicensesUrl);
      bundle = response.json() as any;
    } catch (err) {
      console.warn('Could not resolve licenses for', this.appName);
    }

    return bundle;
  }

  /**
   * Resolve the licenses for all federated extensions.
   */
  private async _getFederated(): Promise<ILicenseBundles> {
    const bundles: ILicenseBundles = {};
    let federated: IFederatedExtension[];

    try {
      federated = JSON.parse(PageConfig.getOption('federated_extensions'));
    } catch {
      return bundles;
    }

    const promises = [] as Promise<any>[];

    for (const ext of federated) {
      promises.push(this._getOneFederated(ext, bundles));
    }

    try {
      await Promise.all(promises);
    } catch (err) {
      console.warn('Error resolving licenses', err);
    }

    return bundles;
  }

  /**
   * Update the bundles with the extension's licenses, or the empty bundle.
   */
  private async _getOneFederated(ext: IFederatedExtension, bundles: ILicenseBundles) {
    try {
      const url = URLExt.join(
        this.labExtensionsUrl,
        ext.name,
        'static',
        THIRD_PARTY_LICENSES,
      );
      const response = await fetch(url);
      bundles[ext.name] = await response.json();
    } catch {
      console.warn('Could not resolve licenses for', ext);
      bundles[ext.name] = EMPTY_BUNDLE;
    }
  }
}
