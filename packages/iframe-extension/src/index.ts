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
    this.node.appendChild(this._iframe);
  }

  /**
   * Render the IFrame into this widget's node.
   */
  async renderModel(model: IRenderMime.IMimeModel): Promise<void> {
    if (this._iframe.parentNode) {
      this._iframe.parentNode.removeChild(this._iframe);
    }

    const ready = new PromiseDelegate<void>();
    this._iframe = document.createElement('iframe');
    this._iframe.onload = () => {
      ready.resolve(void 0);
    };
    this.node.appendChild(this._iframe);
    await ready.promise;
    const data = model.data[MIME_TYPE] as string | undefined;
    if (!data || !this._iframe.contentWindow) {
      return;
    }
    const metadata = model.metadata[MIME_TYPE] as IIFrameMetadata | undefined;
    this._iframe.width = metadata?.width ?? '100%';
    this._iframe.height = metadata?.height ?? '400px';
    this._iframe.contentWindow.document.write(data);
  }

  /**
   * Dispose of the resources held by the iframe widget.
   */
  dispose(): void {
    this._iframe.remove();
    super.dispose();
  }

  private _iframe: HTMLIFrameElement;
}

/**
 * A mime renderer factory for IFrame data.
 */
export const rendererFactory: IRenderMime.IRendererFactory = {
  safe: false,
  mimeTypes: [MIME_TYPE],
  defaultRank: 100,
  createRenderer: (options) => new RenderedIFrame(),
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
      defaultFor: ['IFrame'],
    },
  },
];

export default extensions;
