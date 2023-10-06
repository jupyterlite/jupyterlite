// Copyright (c) JupyterLite Contributors
// Distributed under the terms of the Modified BSD License.

import { test } from '@jupyterlab/galata';

import { ConsoleMessage, expect } from '@playwright/test';

test.describe('Renderers', () => {
  test('MathJax', async ({ page }) => {
    await page.goto('lab/index.html');

    let errorLogs = 0;

    const handleMessage = async (msg: ConsoleMessage) => {
      const text = msg.text();
      console.log(msg.type(), '>>', text);

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
    await page.notebook.run();
    await page.notebook.save();

    // wait for MathJax to render
    await page.locator('.MathJax').last().isVisible();

    expect(errorLogs).toEqual(0);
  });
});
