// Copyright (c) JupyterLite Contributors
// Distributed under the terms of the Modified BSD License.

import { createHash } from 'crypto';

import { expect, test, type IJupyterLabPageFixture } from '@jupyterlab/galata';
import type { Contents } from '@jupyterlab/services';

import { firefoxWaitForApplication, refreshFilebrowser } from './utils';

// Deliberately larger than JupyterLab's 1 MiB upload chunking threshold.
const LARGE_UPLOAD_SIZE = 2 * 1024 * 1024 + 4096;

// Larger than JupyterLab's 15 MiB threshold that triggers a confirmation dialog.
const VERY_LARGE_UPLOAD_SIZE = 15 * 1024 * 1024 + 4096;

type UploadFile = {
  base64: string;
  mimeType: string;
  name: string;
  size: number;
};

type GeneratedBinaryFile = UploadFile & {
  sha256: string;
};

type GeneratedTextFile = UploadFile & {
  text: string;
};

type GeneratedNotebookFile = UploadFile & {
  source: string;
};

type UploadContentsModel = Pick<
  Contents.IModel,
  'content' | 'format' | 'path' | 'size' | 'type'
>;

test.use({
  waitForApplication: firefoxWaitForApplication,
});

test.describe('Upload Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('lab/index.html');
    await refreshFilebrowser({ page });
  });

  test('Upload multiple small text and binary files', async ({ page }) => {
    test.setTimeout(120000);

    const textFile = createTextFileFromContent(
      '00-upload-small.txt',
      `${createDeterministicText(4096, 'small-text')}\nCrème brûlée 😀\n`,
    );
    const binaryFile = createBinaryFile('01-upload-small.bin', 4096, 17);

    await uploadFiles(page, [textFile, binaryFile]);
    expect(await page.filebrowser.isFileListedInBrowser(textFile.name)).toBeTruthy();
    expect(await page.filebrowser.isFileListedInBrowser(binaryFile.name)).toBeTruthy();

    const uploadedText = await getFileModel(page, textFile.name);
    expect(uploadedText.type).toBe('file');
    expect(uploadedText.format).toBe('text');
    expect(uploadedText.size).toBe(textFile.size);
    expect(uploadedText.content).toBe(textFile.text);

    const uploadedBinary = await getFileModel(page, binaryFile.name);
    expect(uploadedBinary.type).toBe('file');
    expect(uploadedBinary.format).toBe('base64');
    expect(uploadedBinary.size).toBe(binaryFile.size);
    expect(uploadedBinary.content).toBe(binaryFile.base64);

    const editorContent = await openAndGetEditorContent(page, textFile.name);
    expect(editorContent).toBe(textFile.text);

    await verifyBinaryFileViaPython(
      page,
      binaryFile.name,
      binaryFile.size,
      binaryFile.sha256,
    );
  });

  test('Upload a large text file', async ({ page }) => {
    test.slow();

    const textFile = createTextFile(
      '02-upload-large.txt',
      LARGE_UPLOAD_SIZE,
      'large-text',
    );

    await uploadFiles(page, [textFile]);
    expect(await page.filebrowser.isFileListedInBrowser(textFile.name)).toBeTruthy();

    const uploadedText = await getFileModel(page, textFile.name);
    expect(uploadedText.type).toBe('file');
    expect(uploadedText.format).toBe('text');
    expect(uploadedText.size).toBe(textFile.size);
    expect(uploadedText.content).toBe(textFile.text);

    const editorContent = await openAndGetEditorContent(page, textFile.name);
    expect(editorContent).toBe(textFile.text);
  });

  test('Upload a large binary file', async ({ page }) => {
    test.setTimeout(120000);

    const binaryFile = createBinaryFile('03-upload-large.bin', LARGE_UPLOAD_SIZE, 29);

    await uploadFiles(page, [binaryFile]);
    expect(await page.filebrowser.isFileListedInBrowser(binaryFile.name)).toBeTruthy();

    const uploadedBinary = await getFileModel(page, binaryFile.name);
    expect(uploadedBinary.type).toBe('file');
    expect(uploadedBinary.format).toBe('base64');
    expect(uploadedBinary.size).toBe(binaryFile.size);
    expect(uploadedBinary.content).toBe(binaryFile.base64);

    await verifyBinaryFileViaPython(
      page,
      binaryFile.name,
      binaryFile.size,
      binaryFile.sha256,
    );
  });

  test('Upload a small notebook', async ({ page }) => {
    const notebook = createNotebookFileFromSource(
      '04-upload-small.ipynb',
      `${createDeterministicText(
        2048,
        'small-notebook-cell',
      )}\nCrème brûlée à Paris 😀\n`,
    );

    await uploadFiles(page, [notebook]);
    expect(await page.filebrowser.isFileListedInBrowser(notebook.name)).toBeTruthy();

    const uploadedNotebook = await getFileModel(page, notebook.name);
    expect(uploadedNotebook.type).toBe('notebook');
    expect(uploadedNotebook.format).toBe('json');
    expect(uploadedNotebook.size).toBe(notebook.size);
    expect(normalizeNotebookSource(uploadedNotebook.content.cells[0].source)).toBe(
      notebook.source,
    );

    const cellSource = await openAndGetNotebookCellSource(page, notebook.name);
    expect(cellSource).toBe(notebook.source);
  });

  test('Upload a large notebook', async ({ page }) => {
    test.slow();

    const notebook = createNotebookFile(
      '05-upload-large.ipynb',
      LARGE_UPLOAD_SIZE,
      'large-notebook',
    );

    await uploadFiles(page, [notebook]);
    expect(await page.filebrowser.isFileListedInBrowser(notebook.name)).toBeTruthy();

    const uploadedNotebook = await getFileModel(page, notebook.name);
    expect(uploadedNotebook.type).toBe('notebook');
    expect(uploadedNotebook.format).toBe('json');
    expect(uploadedNotebook.size).toBe(notebook.size);
    expect(normalizeNotebookSource(uploadedNotebook.content.cells[0].source)).toBe(
      notebook.source,
    );

    const cellSource = await openAndGetNotebookCellSource(page, notebook.name);
    expect(cellSource).toBe(notebook.source);
  });

  test('Upload a very large binary file with confirmation dialog', async ({ page }) => {
    test.setTimeout(240000);

    const binaryFile = createBinaryFile(
      '06-upload-very-large',
      VERY_LARGE_UPLOAD_SIZE,
      37,
    );

    const uploadButton = page.locator('.jp-id-upload');
    await expect(uploadButton).toBeVisible();

    const fileChooserPromise = page.waitForEvent('filechooser');
    await uploadButton.click();
    const fileChooser = await fileChooserPromise;

    await fileChooser.setFiles([
      {
        buffer: Buffer.from(binaryFile.base64, 'base64'),
        mimeType: binaryFile.mimeType,
        name: binaryFile.name,
      },
    ]);

    // Handle the large file size warning dialog
    const dialog = page.locator('.jp-Dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Upload' }).click();

    await expect
      .poll(() => page.filebrowser.isFileListedInBrowser(binaryFile.name))
      .toBeTruthy();

    // Wait for all chunks to finish uploading before verifying content.
    await expect
      .poll(async () => (await getFileModel(page, binaryFile.name)).size, {
        timeout: 120000,
      })
      .toBe(binaryFile.size);

    const uploadedBinary = await getFileModel(page, binaryFile.name);
    expect(uploadedBinary.type).toBe('file');
    expect(uploadedBinary.format).toBe('base64');
    expect(uploadedBinary.size).toBe(binaryFile.size);
    expect(uploadedBinary.content).toBe(binaryFile.base64);

    await verifyBinaryFileViaPython(
      page,
      binaryFile.name,
      binaryFile.size,
      binaryFile.sha256,
    );
  });
});

function createBinaryFile(
  name: string,
  size: number,
  seed: number,
): GeneratedBinaryFile {
  const bytes = new Uint8Array(size);

  for (let index = 0; index < size; index++) {
    bytes[index] = (index * 31 + seed) % 256;
  }

  return {
    base64: encodeBytesToBase64(bytes),
    mimeType: 'application/octet-stream',
    name,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    size: bytes.length,
  };
}

function createNotebookFile(
  name: string,
  sourceSize: number,
  label: string,
): GeneratedNotebookFile {
  return createNotebookFileFromSource(
    name,
    createDeterministicText(sourceSize, `${label}-cell`),
  );
}

function createNotebookFileFromSource(
  name: string,
  source: string,
): GeneratedNotebookFile {
  const content = JSON.stringify({
    cells: [
      {
        cell_type: 'markdown',
        metadata: {},
        source,
      },
    ],
    metadata: {
      kernelspec: {
        display_name: 'Python 3',
        language: 'python',
        name: 'python3',
      },
      language_info: {
        name: 'python',
      },
    },
    nbformat: 4,
    nbformat_minor: 5,
  });

  return {
    base64: encodeStringToBase64(content),
    mimeType: 'application/x-ipynb+json',
    name,
    size: Buffer.byteLength(content, 'utf8'),
    source,
  };
}

function createTextFile(name: string, size: number, label: string): GeneratedTextFile {
  return createTextFileFromContent(name, createDeterministicText(size, label));
}

function createTextFileFromContent(name: string, text: string): GeneratedTextFile {
  return {
    base64: encodeStringToBase64(text),
    mimeType: 'text/plain',
    name,
    size: Buffer.byteLength(text, 'utf8'),
    text,
  };
}

function createDeterministicText(size: number, label: string): string {
  const pattern = `${label}|0123456789|abcdefghijklmnopqrstuvwxyz|ABCDEFGHIJKLMNOPQRSTUVWXYZ\n`;
  return pattern.repeat(Math.ceil(size / pattern.length)).slice(0, size);
}

function encodeBytesToBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}

function encodeStringToBase64(content: string): string {
  return Buffer.from(content, 'utf8').toString('base64');
}

async function getFileModel(
  page: IJupyterLabPageFixture,
  path: string,
): Promise<UploadContentsModel> {
  return page.evaluate(async (filePath) => {
    const app = (window as any).jupyterapp;
    const model = await app.serviceManager.contents.get(filePath, { content: true });
    return {
      content: model.content,
      format: model.format,
      path: model.path,
      size: model.size,
      type: model.type,
    };
  }, path);
}

function normalizeNotebookSource(source: string | string[]): string {
  return Array.isArray(source) ? source.join('') : source;
}

async function uploadFiles(
  page: IJupyterLabPageFixture,
  files: UploadFile[],
): Promise<void> {
  const uploadButton = page.locator('.jp-id-upload');
  await expect(uploadButton).toBeVisible();

  const fileChooserPromise = page.waitForEvent('filechooser');
  await uploadButton.click();
  const fileChooser = await fileChooserPromise;

  await fileChooser.setFiles(
    files.map((file) => ({
      buffer: Buffer.from(file.base64, 'base64'),
      mimeType: file.mimeType,
      name: file.name,
    })),
  );

  for (const file of files) {
    await expect
      .poll(() => page.filebrowser.isFileListedInBrowser(file.name))
      .toBeTruthy();
  }
}

async function openAndGetEditorContent(
  page: IJupyterLabPageFixture,
  name: string,
): Promise<string> {
  await page.filebrowser.open(name);
  await page.waitForSelector('.jp-FileEditor');
  return page.evaluate(() => {
    const app = (window as any).jupyterapp;
    return app.shell.currentWidget.context.model.toString();
  });
}

async function openAndGetNotebookCellSource(
  page: IJupyterLabPageFixture,
  name: string,
  cellIndex: number = 0,
): Promise<string> {
  await page.notebook.open(name);
  expect(await page.notebook.isOpen(name)).toBeTruthy();
  return page.evaluate((index) => {
    const app = (window as any).jupyterapp;
    const widget = app.shell.currentWidget;
    return widget.content.model.cells.get(index).sharedModel.getSource();
  }, cellIndex);
}

async function verifyBinaryFileViaPython(
  page: IJupyterLabPageFixture,
  fileName: string,
  expectedSize: number,
  expectedSha256: string,
): Promise<void> {
  const pythonKernelName = await getPythonKernelName(page);
  const createdNotebookName = await page.notebook.createNew(undefined, {
    kernel: pythonKernelName,
  });
  if (!createdNotebookName) {
    throw new Error('Could not create verification notebook');
  }

  try {
    const code = [
      'import hashlib',
      `data = open(${JSON.stringify(fileName)}, 'rb').read()`,
      'size = len(data)',
      'digest = hashlib.sha256(data).hexdigest()',
      'print(f"{size},{digest}")',
    ].join('\n');

    await page.notebook.setCell(0, 'code', code);
    await page.notebook.runCell(0);

    const output = await page.notebook.getCellTextOutput(0);
    expect(output).toBeTruthy();
    expect(output![0].trim()).toBe(`${expectedSize},${expectedSha256}`);
  } finally {
    if (await page.notebook.isOpen(createdNotebookName)) {
      await page.notebook.close(true);
    }
    if (await page.filebrowser.contents.fileExists(createdNotebookName)) {
      await page.filebrowser.contents.deleteFile(createdNotebookName);
    }
  }
}

async function getPythonKernelName(page: IJupyterLabPageFixture): Promise<string> {
  const kernelName = await page.evaluate(async () => {
    const app = (window as any).jupyterapp;
    const kernelspecs = app.serviceManager.kernelspecs?.specs?.kernelspecs ?? {};

    for (const name of ['python3', 'python']) {
      if (kernelspecs[name]?.language === 'python') {
        return name;
      }
    }

    for (const [name, spec] of Object.entries(kernelspecs) as Array<[string, any]>) {
      if (spec?.language === 'python') {
        return name;
      }
    }

    return null;
  });

  if (!kernelName) {
    throw new Error('Could not find a Python kernel for binary upload verification');
  }

  return kernelName;
}
