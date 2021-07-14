// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { describe, galata, test } from '@jupyterlab/galata';

jest.setTimeout(60000);

describe('General Tests', () => {
  beforeAll(async () => {
    await galata.resetUI();
    galata.context.capturePrefix = 'general';
  });

  afterAll(async () => {
    galata.context.capturePrefix = '';
  });

  test('Launch Screen', async () => {
    const imageName = 'launch';
    await galata.capture.screenshot(imageName);
    expect(await galata.capture.compareScreenshot(imageName)).toBe('same');
  });

  test('Enter Simple Mode', async () => {
    await galata.toggleSimpleMode(true);
    expect(await galata.isInSimpleMode()).toBeTruthy();

    const imageName = 'simple-mode';
    await galata.capture.screenshot(imageName);
    expect(await galata.capture.compareScreenshot(imageName)).toBe('same');
  });

  test('Leave Simple Mode', async () => {
    await galata.toggleSimpleMode(false);
    expect(await galata.isInSimpleMode()).toBeFalsy();
  });

  test('Toggle Dark theme', async () => {
    await galata.theme.setDarkTheme();
    const imageName = 'dark-theme';
    await galata.capture.screenshot(imageName);
    expect(await galata.capture.compareScreenshot(imageName)).toBe('same');
  });

  test('Toggle Light theme', async () => {
    await galata.theme.setLightTheme();
    await expect(galata.theme.getTheme()).resolves.toEqual('JupyterLab Light');
  });
});
