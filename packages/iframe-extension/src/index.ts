// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { IRenderMime } from '@jupyterlab/rendermime-interfaces';

import { PromiseDelegate } from '@lumino/coreutils';

import { Widget } from '@lumino/widgets';

/**
 * The MIME type for IFrame.
 */
const MIME_TYPE = 'text/html-sandboxed';

/**
 * The interface for the metadata
 */
interface IIFrameMetadata {
  /**
   * The suggested width of the IFrame
   */
  width?: string;

  /**
   * The suggested height of the IFrame
   */
  height?: string;
}

/**
 * A class for rendering an IFrame document.
 */
export class RenderedIFrame extends Widget implements IRenderMime.IRenderer {
  constructor() {
    super();
    this.addClass('jp-IFrameContainer');
    this._iframe = document.createElement('iframe');
    // Provide default dimensions
    this._iframe.width = '100%';
    this._iframe.height = '400px';
    this._iframe.onload = () => {
      this._ready.resolve(void 0);
    };
    this.node.appendChild(this._iframe);
  }

  /**
   * Render the IFrame into this widget's node.
   */
  async renderModel(model: IRenderMime.IMimeModel): Promise<void> {
    await this._ready.promise;
    const data = model.data[MIME_TYPE] as string | undefined;
    if (!data || !this._iframe.contentWindow) {
      return;
    }
    const metadata = model.metadata[MIME_TYPE] as IIFrameMetadata | undefined;
    this._iframe.width = metadata?.width ?? this._iframe.width;
    this._iframe.height = metadata?.height ?? this._iframe.height;
    this._iframe.contentWindow.document.write(data);
  }

  /**
   * Dispose of the resources held by the iframe widget.
   */
  dispose(): void {
    this._iframe.remove();
    super.dispose();
  }

  protected _iframe: HTMLIFrameElement;
  private _ready = new PromiseDelegate<void>();
}

/**
 * A mime renderer factory for IFrame data.
 */
export const rendererFactory: IRenderMime.IRendererFactory = {
  safe: false,
  mimeTypes: [MIME_TYPE],
  defaultRank: 100,
  createRenderer: options => new RenderedIFrame()
};

const extensions: IRenderMime.IExtension | IRenderMime.IExtension[] = [
  {
    id: '@jupyterlite/iframe-extension:factory',
    rendererFactory,
    dataType: 'string',
    documentWidgetFactoryOptions: {
      name: 'IFrame',
      primaryFileType: 'IFrame',
      fileTypes: ['IFrame'],
      defaultFor: ['IFrame']
    }
  }
];

export default extensions;
