// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  JupyterFrontEndPlugin,
  JupyterFrontEnd
} from '@jupyterlab/application';

import { ITranslator, TranslationManager } from '@jupyterlab/translation';

/**
 * A simplified Translator
 */
const translator: JupyterFrontEndPlugin<ITranslator> = {
  id: '@jupyterlab/translation:translator',
  activate: (app: JupyterFrontEnd): ITranslator => {
    const translationManager = new TranslationManager();
    return translationManager;
  },
  autoStart: true,
  provides: ITranslator
};

const plugins: JupyterFrontEndPlugin<any>[] = [translator];

export default plugins;
