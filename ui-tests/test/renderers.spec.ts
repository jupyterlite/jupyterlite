// Copyright (c) JupyterLite Contributors
// Distributed under the terms of the Modified BSD License.

import { test } from '@jupyterlab/galata';

import type { ConsoleMessage } from '@playwright/test';
import { expect } from '@playwright/test';

import { firefoxWaitForApplication } from './utils';

test.use({
  waitForApplication: firefoxWaitForApplication,
});

test.describe('Renderers', () => {
  // this test can sometimes take longer to run as it uses the Pyodide kernel
  // TODO: remove
  test.setTimeout(120000);

  test('MathJax', async ({ page, browserName }) => {
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

  test('Images in Markdown', async ({ page }) => {
    await page.goto('lab/index.html');

    const imageName = 'image.svg';

    // create a new svg image
    const content =
      '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" height="30px"><circle cx="50" cy="50" r="50" fill="red" /></svg>';
    await page.menu.clickMenuItem('File>New>Text File');
    await page.waitForSelector('.jp-FileEditor');
    await page.locator('.jp-FileEditor .cm-content').fill(content);

    // save as image.svg
    await page.menu.clickMenuItem('File>Save Text');
    await page.waitForSelector('.jp-Dialog');
    await page.locator('#jp-dialog-input-id').fill(imageName);
    await page.getByRole('button', { name: 'Rename and Save' }).click();

    // create a new notebook
    await page.notebook.createNew();

    const markdown = `![alt text](./${imageName})`;
    await page.notebook.setCell(0, 'markdown', markdown);
    await page.notebook.run();

    const cell = await page.notebook.getCellLocator(0);
    expect(await cell!.screenshot()).toMatchSnapshot('image-in-markdown.png');

    const markdownLink = `[link](./${imageName})`;
    await page.notebook.setCell(0, 'markdown', markdownLink);
    await page.notebook.run();

    const link = cell!.locator('a');
    await expect(link).not.toHaveAttribute('href', /^data:image\/svg\+xml;base64/);
  });
});
