import { ThemeManager as LabThemeManager } from '@jupyterlab/apputils';

import { URLExt } from '@jupyterlab/coreutils';

/**
 * A class that provides theme management.
 *
 * Note: Custom Theme Manager than core JupyterLab to be
 * able to override the `loadCSS` method for now.
 *
 */
export class ThemeManager extends LabThemeManager {
  constructor(options: LabThemeManager.IOptions) {
    super(options);
    this._themesUrl = options.url;
  }

  /**
   * Load a theme CSS file by theme name.
   *
   * @param path The path to the theme style.
   */
  loadCSS(path: string): Promise<void> {
    const href = URLExt.join(this._themesUrl, path);

    return new Promise((resolve, reject) => {
      const link = document.createElement('link');

      link.setAttribute('rel', 'stylesheet');
      link.setAttribute('type', 'text/css');
      link.setAttribute('href', href);
      link.addEventListener('load', () => {
        resolve(undefined);
      });
      link.addEventListener('error', () => {
        reject(`Stylesheet failed to load: ${href}`);
      });

      this._link = link;
      this._unloadCSS();
      document.body.appendChild(link);
    });
  }

  /**
   * Unload the previous theme.
   */
  private _unloadCSS(): void {
    this._link?.parentElement?.removeChild(this._link);
  }

  private _link: HTMLLinkElement | undefined = undefined;
  private _themesUrl = '';
}
