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
   * The relative path to the extension
   */
  extension: string;
  /**
   * The relative entrypoint to the WebPack remoteEntry
   */
  load: string;
  /**
   * Optional path to the style module
   */
  style?: string;
}
