// Copyright (c) JupyterLite Contributors
// Distributed under the terms of the Modified BSD License.

import { test } from '@jupyterlab/galata';

import { ConsoleMessage, expect } from '@playwright/test';

import { firefoxWaitForApplication } from './utils';

test.use({
  waitForApplication: firefoxWaitForApplication,
});

test.describe('Renderers', () => {
  // this test can sometimes take longer to run as it uses the Pyodide kernel
  // TODO: remove
  test.setTimeout(120000);

  test('MathJax', async ({ page }) => {
    await page.goto('lab/index.html');

    let errorLogs = 0;
    const handleMessage = async (msg: ConsoleMessage) => {
      // Count 404 for MathJax fonts
      if (
        msg.type() === 'error' &&
        msg
          .location()
          .url.match(
            /js\/output\/chtml\/fonts\/tex-woff-v2\/MathJax_(Zero|Math-Italic|Main-Regular)\.woff$/,
          )
      ) {
        errorLogs += 1;
      }
    };

    page.on('console', handleMessage);

    // create a new notebook
    await page.notebook.createNew();

    const latex = `This is an inline equation: $E=mc^2$.

And this is a display equation:

$$
\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}
$$
`;
    await page.notebook.setCell(0, 'markdown', latex);
    await page.notebook.addCell('raw', '');
    await page.notebook.run();
    await page.notebook.save();

    // wait for MathJax to render
    await page.locator('.MathJax').last().isVisible();

    const cell = await page.notebook.getCell(0);
    expect(await cell!.screenshot()).toMatchSnapshot('latex.png');

    // there should not be any MathJax related 404
    expect(errorLogs).toEqual(0);
  });
});
