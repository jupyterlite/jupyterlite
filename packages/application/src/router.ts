import { IRouter, Router } from '@jupyterlab/application';
import { Token } from '@lumino/coreutils';
/**
 * The Lite URL Router token.
 */
export const ILiteRouter = new Token<ILiteRouter>(
  '@jupyterlite/application:ILiteRouter'
);

/** An interface for the JupyterLite router */
export interface ILiteRouter extends IRouter {
  /** Add a route transformer */
  addTransformer(transformer: IRouteTransformer.ITransformer): void;
}

/** A namespace for route transformers */
export namespace IRouteTransformer {
  /** Options passed to transformers */
  export interface IOptions {
    url: URL;
    options: IRouter.INavOptions;
  }
  /** A transformer for path and options */
  export interface ITransformer {
    id: string;
    transform: (options: IOptions) => IOptions;
  }
}

export class LiteRouter extends Router implements ILiteRouter {
  navigate(path: string, options: IRouter.INavOptions = {}): void {
    debugger;
    const { origin } = window.location;
    let transformedOptions = { url: new URL(path, origin), options };
    for (const transformer of this._transformers.values()) {
      try {
        transformedOptions = transformer.transform(transformedOptions);
      } catch (err) {
        console.warn(`Route transformer ${transformer.id} failed: ${err}`);
      }
    }
    const newPath = transformedOptions.url.toString().replace(origin, '');
    super.navigate(newPath, transformedOptions.options);
  }

  addTransformer(transformer: IRouteTransformer.ITransformer): void {
    if (this._transformers.has(transformer.id)) {
      throw new Error(`Route transformer ${transformer.id} is already registered`);
    }
    this._transformers.set(transformer.id, transformer);
  }

  private _transformers: Map<string, IRouteTransformer.ITransformer> = new Map();
}
