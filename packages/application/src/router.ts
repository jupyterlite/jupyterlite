// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import type { IRouter } from '@jupyterlab/application';
import { Router } from '@jupyterlab/application';
import { Token } from '@lumino/coreutils';

/**
 * An interface for URL transformers
 */
export interface IURLTransformer {
  id: string;
  transform: (args: {
    url: URL;
    options: { skipRouting?: boolean; hard?: boolean };
  }) => {
    url: URL;
    options: { skipRouting?: boolean; hard?: boolean };
  };
}

/**
 * An interface for the custom URL router provider.
 *
 * Provides IRouter, plus the additional methods to transform `/path/`-based routes
 */
export interface ILiteRouter extends IRouter {
  /**
   * Add a URL transformer
   */
  addTransformer: (transformer: IURLTransformer) => void;
}

/**
 * A token for the ILiteRouter interface
 */
export const ILiteRouter = new Token<ILiteRouter>(
  '@jupyterlite/application:ILiteRouter',
);

/**
 * A custom router that extends the standard Router with URL transformation capabilities
 */
export class LiteRouter extends Router implements ILiteRouter {
  constructor(options: Router.IOptions) {
    super(options);
    this._transformers = [];
  }

  /**
   * Add a URL transformer
   */
  addTransformer(transformer: IURLTransformer): void {
    this._transformers.push(transformer);
  }

  /**
   * Navigate to a new path within the application.
   */
  navigate(url: string, options: { skipRouting?: boolean; hard?: boolean } = {}): void {
    const urlObj = new URL(url, window.location.href);

    // Apply all transformers
    let transformedUrl = urlObj;
    let transformedOptions = options;

    for (const transformer of this._transformers) {
      const result = transformer.transform({
        url: transformedUrl,
        options: transformedOptions,
      });
      transformedUrl = result.url;
      transformedOptions = result.options;
    }

    // Call the parent navigate method with transformed values
    super.navigate(
      transformedUrl.pathname + transformedUrl.search + transformedUrl.hash,
      transformedOptions,
    );
  }

  private _transformers: IURLTransformer[] = [];
}
