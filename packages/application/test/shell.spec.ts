// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { NotebookShell, INotebookShell } from '@jupyter-notebook/application';

import { Widget } from '@lumino/widgets';

describe('Shell', () => {
  let shell: INotebookShell;

  beforeEach(() => {
    shell = new NotebookShell();
    Widget.attach(shell, document.body);
  });

  afterEach(() => {
    shell.dispose();
  });

  describe('#constructor()', () => {
    it('should create a LabShell instance', () => {
      expect(shell).toBeInstanceOf(NotebookShell);
    });
  });
});
