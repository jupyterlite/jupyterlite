// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

/**
 * The interface for a federated extension, as it appears in `jupyter-config-data`
 *
 * TODO: sync with schema, Lab core, etc.
 */
export interface IFederatedExtension {
  /**
   * The npm-compatible name of the package
   */
  name: string;
  /**
   * The relative entrypoint to the WebPack remoteEntry
   */
  load: string;
  /**
   * Optional relative path to the extension
   */
  extension?: string;
  /**
   * Optional path to the style module
   */
  style?: string;
  /**
   * Optional relative path to the mimeExtension
   */
  mimeExtension?: string;
}
