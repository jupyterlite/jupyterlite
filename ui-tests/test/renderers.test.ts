// Copyright (c) JupyterLite Contributors
// Distributed under the terms of the Modified BSD License.

import { test } from '@jupyterlab/galata';

import { ConsoleMessage, expect } from '@playwright/test';

test.describe('Renderers', () => {
  test('MathJax', async ({ page }) => {
    await page.goto('lab/index.html');

    let errorLogs = 0;
    let testEnded: (value: string | PromiseLike<string>) => void;
    const waitForTestEnd = new Promise<string>((resolve) => {
      testEnded = resolve;
    });

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

      const lower = text.toLowerCase();
      // TODO: handle test end based on some condition
      testEnded(text);
    };

    page.on('console', handleMessage);

    const latex = `This is an inline equation: $E=mc^2$.

And this is a display equation:

$$
\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}
$$
`;
    await page.notebook.setCell(0, 'markdown', latex);
    await page.notebook.run();
    await page.notebook.save();

    const output = await page.notebook.getCellTextOutput(0);
    expect(output).toBeTruthy();

    await waitForTestEnd;
    expect(errorLogs).toEqual(0);
  });
});
