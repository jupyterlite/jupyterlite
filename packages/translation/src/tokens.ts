import { JSONObject, Token } from '@lumino/coreutils';

/**
 * The token for the settings service.
 */
export const ITranslation = new Token<ITranslation>(
  '@jupyterlite/translation:ITranslation'
);

/**
 * The interface for the Translation service.
 */
export interface ITranslation {
  /**
   * Get the translation data for a given locale
   *
   * @param locale the locale
   *
   */
  get(locale: string): Promise<JSONObject>;
}
