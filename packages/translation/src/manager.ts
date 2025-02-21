// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { ServerConnection } from '@jupyterlab/services';
import { ITranslatorConnector, TranslationManager } from '@jupyterlab/translation';
import { LiteTranslatorConnector } from './connector';

/**
 * A custom translation manager.
 */
export class LiteTranslationManager extends TranslationManager {
  constructor(
    translationsUrl: string = '',
    stringsPrefix?: string,
    serverSettings?: ServerConnection.ISettings,
    connector?: ITranslatorConnector,
  ) {
    super(translationsUrl, stringsPrefix, serverSettings);
    // tmp: override the connector used in the parent class
    this['_connector'] = connector ?? new LiteTranslatorConnector();
  }
}
