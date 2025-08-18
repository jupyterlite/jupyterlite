// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { PathExt } from '@jupyterlab/coreutils';
import { RenderMimeRegistry, IUrlResolverFactory } from '@jupyterlab/rendermime';
import { Contents } from '@jupyterlab/services';

class UrlResolver extends RenderMimeRegistry.UrlResolver {
  constructor(options: RenderMimeRegistry.IUrlResolverOptions) {
    super(options);
    this._manager = options.contents;
  }
  private readonly _mimeTypes: Record<string, string> = {
    svg: 'image/svg+xml',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    bmp: 'image/bmp',
    ico: 'image/x-icon',
    tiff: 'image/tiff',
  };

  async resolveUrl(url: string) {
    if (this.isLocal(url)) {
      const cwd = encodeURI(PathExt.dirname(this.path));
      url = PathExt.resolve(cwd, url);

      const extension = url.split('.').pop()?.toLowerCase();
      if (extension && this._mimeTypes[extension]) {
        const reply = await this._manager.get(url, { content: true });
        const encoded = window.btoa(reply.content);
        return `data:${this._mimeTypes[extension]};base64,${encoded}`;
      }
    }
    return super.resolveUrl(url);
  }
  private _manager: Contents.IManager;
}

export const urlResolverPlugin: JupyterFrontEndPlugin<IUrlResolverFactory> = {
  id: '@jupyterlite/apputils-extension:url-resolver',
  autoStart: true,
  description:
    'A URL resolver which converts supported image URLs into base64 encoded data strings.',
  provides: IUrlResolverFactory,
  activate: (app: JupyterFrontEnd): IUrlResolverFactory => {
    app.serviceManager.contents;
    return {
      createResolver: (options) => new UrlResolver(options),
    };
  },
};
