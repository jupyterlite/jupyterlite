// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import type { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { PathExt } from '@jupyterlab/coreutils';
import { RenderMimeRegistry, IUrlResolverFactory } from '@jupyterlab/rendermime';
import type { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import type { Contents } from '@jupyterlab/services';

class UrlResolver extends RenderMimeRegistry.UrlResolver {
  constructor(options: RenderMimeRegistry.IUrlResolverOptions) {
    super(options);
    this._manager = options.contents;
  }
  private readonly _mimeTypes: Record<string, string> = {
    '.apng': 'image/apng',
    '.avif': 'image/avif',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.ico': 'image/x-icon',
    '.tiff': 'image/tiff',
  };

  async resolveUrl(url: string, context?: IRenderMime.IResolveUrlContext) {
    const acceptsBase64 =
      context &&
      (context.attribute === 'src' ||
        (context.attribute === 'href' && context.tag !== 'a'));
    if (this.isLocal(url) && acceptsBase64) {
      const cwd = encodeURI(PathExt.dirname(this.path));
      url = PathExt.resolve(cwd, url);

      const extension = PathExt.extname(url).toLowerCase();
      if (extension && this._mimeTypes[extension]) {
        const reply = await this._manager.get(url, { content: true });
        // Binary images (png/jpg etc.) will be returned in the base64 format already,
        // but svg images will be returned as text which needs base64 encoding.
        const encoded =
          reply.format === 'base64' ? reply.content : window.btoa(reply.content);
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
    return {
      createResolver: (options) => new UrlResolver(options),
    };
  },
};
