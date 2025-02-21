// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { PageConfig, URLExt } from '@jupyterlab/coreutils';
import { DataConnector } from '@jupyterlab/statedb';
import { ITranslatorConnector, Language } from '@jupyterlab/translation';

/**
 * A fake locale to retrieve all the language packs.
 */
const ALL = 'all';

/**
 * A class to fetch translation bundles.
 */
export class LiteTranslatorConnector
  extends DataConnector<Language, Language, { language: string }>
  implements ITranslatorConnector
{
  async fetch(opts: { language: string }): Promise<Language> {
    const { language: locale } = opts;

    const apiURL = URLExt.join(
      PageConfig.getBaseUrl(),
      `api/translations/${locale}.json`,
    );
    try {
      const response = await fetch(apiURL);
      const json = JSON.parse(await response.text());
      if (this._prevLocale !== ALL && locale === ALL) {
        // TODO: fix this logic upstream?
        // the upstream translation plugin relies on the comparison between
        // the display name and the native name to enable or disable the commands:
        // https://github.com/jupyterlab/jupyterlab/blob/befa831ffef36321b87f352a48fbe2439df6c872/packages/translation-extension/src/index.ts#L117
        const prev = this._prevLocale;
        json.data[prev].displayName = json.data[prev].nativeName;
        if (prev !== 'en') {
          json.data['en'].displayName = `${json.data['en'].nativeName} (default)`;
        }
      }
      this._prevLocale = locale;
      return json;
    } catch (e) {
      if (locale) {
        // TODO: fix type upstream: https://github.com/jupyterlab/jupyterlab/issues/17333
        return {
          data: {},
          message: `Language pack '${locale}' not installed!`,
        } as any;
      }
      return {
        // TODO: fix type upstream: https://github.com/jupyterlab/jupyterlab/issues/17333
        data: {
          en: { displayName: 'English', nativeName: 'English' },
        },
        message: '',
      } as any;
    }
  }
  private _prevLocale = '';
}
