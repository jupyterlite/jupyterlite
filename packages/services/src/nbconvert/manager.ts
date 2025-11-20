// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import type { Contents, NbConvert } from '@jupyterlab/services';
import { NbConvertManager } from '@jupyterlab/services';

import type { IExporter, INbConvertExporters } from './tokens';

/**
 * Options for creating a LiteNbConvertManager.
 */
export interface ILiteNbConvertManagerOptions extends NbConvertManager.IOptions {
  /**
   * The contents manager.
   */
  contentsManager: Contents.IManager;

  /**
   * The exporter registry.
   */
  exporters: INbConvertExporters;
}

/**
 * Custom NbConvert manager for JupyterLite with client-side export.
 */
export class LiteNbConvertManager extends NbConvertManager {
  /**
   * Construct a new LiteNbConvertManager.
   *
   * @param options The manager options
   */
  constructor(options: ILiteNbConvertManagerOptions) {
    super(options);
    this._contentsManager = options.contentsManager;
    this._exporters = options.exporters;
  }

  /**
   * Get the list of export formats available.
   */
  async getExportFormats(): Promise<NbConvert.IExportFormats> {
    return this._exporters.getExportFormats();
  }

  /**
   * Export a notebook to a given format.
   *
   * @param options The export options
   */
  async exportAs(options: NbConvert.IExportOptions): Promise<void> {
    const { format, path } = options;

    const model = await this._contentsManager.get(path, { content: true });
    const exporter = this._exporters.get(format);
    if (!exporter) {
      throw new Error(`Unknown export format: ${format}`);
    }
    await exporter.export(model, path);
  }

  private _contentsManager: Contents.IManager;
  private _exporters: INbConvertExporters;
}

/**
 * Implementation of the exporter registry.
 */
export class Exporters implements INbConvertExporters {
  /**
   * Register a new exporter.
   *
   * @param format The export format name
   * @param exporter The exporter instance
   */
  register(format: string, exporter: IExporter): void {
    this._exporters.set(format, exporter);
  }

  /**
   * Get an exporter by format.
   *
   * @param format The export format name
   * @returns The exporter or undefined if not found
   */
  get(format: string): IExporter | undefined {
    return this._exporters.get(format);
  }

  /**
   * Get all registered export formats.
   *
   * @returns A map of format names to their MIME types
   */
  getExportFormats(): Record<string, { output_mimetype: string }> {
    const formats: Record<string, { output_mimetype: string }> = {};

    for (const [format, exporter] of this._exporters) {
      formats[format] = { output_mimetype: exporter.mimeType };
    }

    return formats;
  }

  private _exporters = new Map<string, IExporter>();
}
