// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { Token } from '@lumino/coreutils';

import type { Contents } from '@jupyterlab/services';

/**
 * The token for the exporter registry.
 */
export const INbConvertExporters = new Token<INbConvertExporters>(
  '@jupyterlite/services:INbConvertExporters',
  'A service for managing notebook exporters in JupyterLite',
);

/**
 * Interface for the exporter registry.
 */
export interface INbConvertExporters {
  /**
   * Register a new exporter.
   *
   * @param format The export format name
   * @param exporter The exporter instance
   */
  register(format: string, exporter: IExporter): void;

  /**
   * Get an exporter by format.
   *
   * @param format The export format name
   * @returns The exporter or undefined if not found
   */
  get(format: string): IExporter | undefined;

  /**
   * Get all registered export formats.
   *
   * @returns A map of format names to their MIME types
   */
  getExportFormats(): Record<string, { output_mimetype: string }>;
}

/**
 * Interface for a notebook exporter.
 */
export interface IExporter {
  /**
   * The MIME type of the exported format.
   */
  readonly mimeType: string;

  /**
   * Export a notebook to this format.
   *
   * @param model The notebook model to export
   * @param path The path to the notebook
   */
  export(model: Contents.IModel, path: string): Promise<void>;
}
