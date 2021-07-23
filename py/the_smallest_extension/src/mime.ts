import { Widget } from '@lumino/widgets';

const MIME_TYPE = 'application/vnd.jupyterlite.small';

const extension = {
  id: 'small-extension:mime',
  rendererFactory: {
    safe: true,
    mimeTypes: [MIME_TYPE],
    createRenderer: (): Widget => new Widget()
  },
  rank: 0,
  dataType: 'text',
  fileTypes: [
    {
      name: 'small',
      mimeTypes: [MIME_TYPE],
      extensions: ['.small']
    }
  ],
  documentWidgetFactoryOptions: {
    name: 'Small',
    primaryFileType: 'small',
    fileTypes: ['small'],
    defaultFor: ['small']
  }
};

export default extension;
