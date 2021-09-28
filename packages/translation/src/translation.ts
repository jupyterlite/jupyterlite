import { PageConfig, URLExt } from '@jupyterlab/coreutils';

import { JSONObject } from '@lumino/coreutils';

/**
 * A class to handle requests to /api/translations
 */
export class Translation {
  /**
   * Get the translation data for the given locale
   * @param locale The locale
   * @returns
   */
  async get(locale: string): Promise<JSONObject> {
    const apiURL = URLExt.join(
      PageConfig.getBaseUrl(),
      `api/translations/${locale}.json`
    );
    try {
      const response = await fetch(apiURL);
      const json = JSON.parse(await response.text());
      if (this._prevLocale !== 'all' && locale === 'all') {
        // TODO: fix this logic upstream?
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
        return {
          data: {},
          message: `Language pack '${locale}' not installed!`
        };
      }
      return {
        data: {
          en: { displayName: 'English', nativeName: 'English' }
        },
        message: ''
      };
    }
  }

  private _prevLocale = '';
}
