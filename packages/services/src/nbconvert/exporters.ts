// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import type { Contents } from '@jupyterlab/services';

import type { IExporter } from './tokens';

/**
 * Base class for notebook exporters.
 */
export abstract class BaseExporter implements IExporter {
  /**
   * The MIME type of the exported format.
   */
  abstract readonly mimeType: string;

  /**
   * Export a notebook to this format.
   *
   * @param model The notebook model to export
   * @param path The path to the notebook
   */
  abstract export(model: Contents.IModel, path: string): Promise<void>;

  /**
   * Trigger a browser download of the exported content.
   *
   * @param content The content to download
   * @param mimeType The MIME type of the content
   * @param filename The filename for the download
   */
  protected triggerDownload(content: string, mimeType: string, filename: string): void {
    const element = document.createElement('a');
    element.href = `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`;
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }
}

/**
 * Exporter for notebook format (.ipynb).
 */
export class NotebookExporter extends BaseExporter {
  /**
   * The MIME type of the exported format.
   */
  readonly mimeType = 'application/x-ipynb+json';

  /**
   * Export a notebook to .ipynb format.
   *
   * @param model The notebook model to export
   * @param path The path to the notebook
   */
  async export(model: Contents.IModel, path: string): Promise<void> {
    let content = '';
    switch (model.format) {
      case 'base64': {
        const decoded = atob(model.content);
        try {
          // If it contains JSON, format it nicely
          const parsed = JSON.parse(decoded);
          content = JSON.stringify(parsed, null, 2);
        } catch {
          // If it's not JSON, just use decoded text
          content = decoded;
        }
        break;
      }
      case 'json': {
        content = JSON.stringify(model.content, null, 2);
        break;
      }
      case 'text': {
        content = model.content;
        break;
      }
    }

    const mime = model.mimetype ?? 'application/json';
    this.triggerDownload(content, mime, path);
  }
}

/**
 * Exporter for executable script format.
 */
export class ScriptExporter extends BaseExporter {
  /**
   * The MIME type of the exported format.
   */
  readonly mimeType = 'text/x-script';

  /**
   * Export a notebook to executable script format.
   *
   * @param model The notebook model to export
   * @param path The path to the notebook
   */
  async export(model: Contents.IModel, path: string): Promise<void> {
    const { content, extension } = this.convertToScript(model.content);
    const filename = path.replace(/\.ipynb$/, extension);
    this.triggerDownload(content, 'text/plain', filename);
  }

  /**
   * Convert a notebook to a script file.
   *
   * @param content The notebook content
   * @returns The script content and file extension
   */
  private convertToScript(content: any): {
    content: string;
    extension: string;
  } {
    // Get the language from the notebook metadata
    const languageInfo = content.metadata?.language_info;
    const language = languageInfo?.name || 'python';
    const fileExtension = languageInfo?.file_extension || '.py';

    // Extract code cells and convert to script
    const cells = content.cells || [];
    const scriptLines: string[] = [];

    for (const cell of cells) {
      if (cell.cell_type === 'code') {
        // Add code cell content
        const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source;
        scriptLines.push(source);
        // Add blank line between cells
        scriptLines.push('');
      } else if (cell.cell_type === 'markdown' || cell.cell_type === 'raw') {
        // Add markdown and raw cells as comments
        const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source;
        const commentedSource = this.commentLines(source, language);
        scriptLines.push(commentedSource);
        // Add blank line between cells
        scriptLines.push('');
      }
    }

    return {
      content: scriptLines.join('\n') + '\n',
      extension: fileExtension,
    };
  }

  /**
   * Comment out lines based on the language.
   *
   * @param text The text to comment
   * @param language The programming language
   * @returns The commented text
   */
  private commentLines(text: string, language: string): string {
    const lines = text.split('\n');
    const commentChar = this.getCommentChar(language);

    return lines.map((line) => `${commentChar} ${line}`).join('\n');
  }

  /**
   * Get the comment character for a given language.
   *
   * @param language The programming language
   * @returns The comment character(s) for that language
   */
  private getCommentChar(language: string): string {
    // Map of languages to their comment characters
    const commentMap: { [key: string]: string } = {
      python: '#',
      r: '#',
      julia: '#',
      ruby: '#',
      bash: '#',
      shell: '#',
      perl: '#',
      javascript: '//',
      typescript: '//',
      java: '//',
      c: '//',
      cpp: '//',
      'c++': '//',
      scala: '//',
      go: '//',
      rust: '//',
      swift: '//',
      kotlin: '//',
      matlab: '%',
      octave: '%',
      lua: '--',
      sql: '--',
      haskell: '--',
    };

    return commentMap[language.toLowerCase()] || '#';
  }
}
