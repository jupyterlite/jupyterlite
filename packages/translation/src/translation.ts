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
    if (!this._data) {
      const apiURL = URLExt.join(PageConfig.getBaseUrl(), 'api/translations/all.json');
      const response = await fetch(apiURL);
      const json = JSON.parse(await response.text());
      this._data = json;
    }
    if (!locale) {
      return {
        data: this._data?.metadata ?? {},
        message: ''
      };
    }
    const data = (this._data?.packs as JSONObject)[locale];
    return {
      data,
      message: ''
    };
  }

  private _data: JSONObject | null = null;
}
