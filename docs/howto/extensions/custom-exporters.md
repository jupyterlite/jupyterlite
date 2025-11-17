# Adding Custom Notebook Exporters

## Introduction

JupyterLite provides a built-in notebook export system that allows users to download
notebooks in different formats. By default, JupyterLite includes exporters for:

- **Notebook (ipynb)**: Download the notebook as a `.ipynb` file
- **Executable Script**: Convert and download the notebook as an executable script
  (e.g., `.py` for Python notebooks)

You can extend this functionality by creating custom exporters in your JupyterLite
extension or plugin. This allows you to add support for additional export formats such
as HTML, PDF, Markdown, or any custom format you need.

The export system in JupyterLite is based on the following extension points:

1. **`INbConvertExporters`**: A token that provides access to the exporter registry
2. **`IExporter`**: An interface that all exporters must implement registered exporters

## Creating a Custom Exporter

### Step 1: Implement the `IExporter` Interface

Create a class that implements the `IExporter` interface from `@jupyterlite/services`:

````typescript
import { Contents } from '@jupyterlab/services';
import { IExporter } from '@jupyterlite/services';

export class MarkdownExporter implements IExporter {
  /**
   * The MIME type of the exported format.
   */
  readonly mimeType = 'text/markdown';

  /**
   * Export a notebook to Markdown format.
   *
   * @param model The notebook model to export
   * @param path The path to the notebook
   */
  async export(model: Contents.IModel, path: string): Promise<void> {
    const content = this._convertToMarkdown(model.content);
    const filename = path.replace(/\.ipynb$/, '.md');
    this.triggerDownload(content, this.mimeType, filename);
  }

  /**
   * Convert notebook content to Markdown.
   */
  private _convertToMarkdown(notebook: any): string {
    const cells = notebook.cells || [];
    const lines: string[] = [];

    for (const cell of cells) {
      const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source;

      if (cell.cell_type === 'markdown' || cell.cell_type === 'raw') {
        lines.push(source);
      } else if (cell.cell_type === 'code') {
        lines.push('```' + (notebook.metadata?.language_info?.name || 'python'));
        lines.push(source);
        lines.push('```');
      }
      lines.push(''); // blank line between cells
    }

    return lines.join('\n');
  }

  /**
   * Trigger a browser download of the exported content.
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
````

### Step 2: Register the Exporter in a Plugin

Create a JupyterLab plugin that requires the `INbConvertExporters` token and registers
your custom exporter. Note that this should be a `ServiceManagerPlugin` since exporters
are part of the services layer:

```typescript
import { ServiceManagerPlugin } from '@jupyterlab/services';
import { INbConvertExporters } from '@jupyterlite/services';
import { MarkdownExporter } from './exporters';

/**
 * Plugin to register custom exporters.
 */
const exporterPlugin: ServiceManagerPlugin<void> = {
  id: 'my-extension:custom-exporters',
  autoStart: true,
  requires: [INbConvertExporters],
  activate: (_: null, exporters: INbConvertExporters): void => {
    // Register the custom exporter
    exporters.register('Markdown', new MarkdownExporter());

    console.log('Custom Markdown exporter registered');
  },
};

export default exporterPlugin;
```

### Step 3: Build

1. Build your extension following the standard JupyterLab extension build process
2. Install the extension in your environment
3. Build your JupyterLite site with `jupyter lite build`
4. The custom exporter will now appear in the File menu under "Save and Export Notebook
   As..."

## See Also

- [Create a frontend extension](frontend.md)
- [JupyterLab Extension Tutorial](https://jupyterlab.readthedocs.io/en/stable/extension/extension_tutorial.html)
