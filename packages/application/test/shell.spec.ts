// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { SingleWidgetShell, ISingleWidgetShell } from '@jupyterlite/application';

import { Widget } from '@lumino/widgets';

describe('Shell', () => {
  let shell: ISingleWidgetShell;

  beforeEach(() => {
    shell = new SingleWidgetShell();
    Widget.attach(shell, document.body);
  });

  afterEach(() => {
    shell.dispose();
  });

  describe('#constructor()', () => {
    it('should create a shell instance', () => {
      expect(shell).toBeInstanceOf(SingleWidgetShell);
    });
  });
});
