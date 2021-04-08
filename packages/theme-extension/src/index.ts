import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ISplashScreen, IThemeManager } from '@jupyterlab/apputils';

import { PageConfig } from '@jupyterlab/coreutils';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

import { ThemeManager } from '@jupyterlite/theme';

/**
 * The command IDs used by the plugin.
 */
namespace CommandIDs {
  export const changeTheme = 'apputils:change-theme';

  export const themeScrollbars = 'apputils:theme-scrollbars';
}

/**
 * The themes plugin.
 */
const themes: JupyterFrontEndPlugin<IThemeManager> = {
  id: '@jupyterlite/apputils-extension:themes',
  autoStart: true,
  provides: IThemeManager,
  requires: [ISettingRegistry],
  optional: [ISplashScreen],
  activate: (
    app: JupyterFrontEnd,
    settings: ISettingRegistry,
    splash: ISplashScreen | null
  ): IThemeManager => {
    const host = app.shell;
    const commands = app.commands;
    const key = themes.id;
    const url = PageConfig.getOption('themesUrl');
    const manager = new ThemeManager({
      key,
      host,
      settings,
      splash: splash ?? undefined,
      url
    });

    let currentTheme: string;

    manager.themeChanged.connect((sender, args) => {
      const currentTheme = args.newValue;
      document.body.dataset.jpThemeLight = String(
        manager.isLight(currentTheme)
      );
      document.body.dataset.jpThemeName = currentTheme;
      if (
        document.body.dataset.jpThemeScrollbars !==
        String(manager.themeScrollbars(currentTheme))
      ) {
        document.body.dataset.jpThemeScrollbars = String(
          manager.themeScrollbars(currentTheme)
        );
      }
      // Set any CSS overrides
      manager.loadCSSOverrides();
      commands.notifyCommandChanged(CommandIDs.changeTheme);
    });

    commands.addCommand(CommandIDs.changeTheme, {
      label: args => {
        const theme = args['theme'] as string;
        const displayName = manager.getDisplayName(theme);
        return args['isPalette'] ? `Use Theme: ${displayName}` : displayName;
      },
      isToggled: args => args['theme'] === currentTheme,
      execute: args => {
        const theme = args['theme'] as string;
        if (theme === manager.theme) {
          return;
        }
        return manager.setTheme(theme);
      }
    });

    commands.addCommand(CommandIDs.themeScrollbars, {
      label: 'Theme Scrollbars',
      isToggled: () => manager.isToggledThemeScrollbars(),
      execute: () => manager.toggleThemeScrollbars()
    });

    return manager;
  }
};

const plugins: JupyterFrontEndPlugin<any>[] = [themes];

export default plugins;
