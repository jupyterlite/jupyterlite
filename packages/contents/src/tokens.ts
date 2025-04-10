import { IDisposable } from '@lumino/disposable';
import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import { PageConfig } from '@jupyterlab/coreutils';
import { Token } from '@lumino/coreutils';
import mime from 'mime';

/**
 * Commonly-used mimetypes
 */
export namespace MIME {
  export const JSON = 'application/json';
  export const PLAIN_TEXT = 'text/plain';
  export const OCTET_STREAM = 'octet/stream';
}

/**
 * A namespace for file constructs.
 */
export namespace FILE {
  /**
   * Build-time configured file types.
   */
  const TYPES: Record<string, Partial<IRenderMime.IFileType>> = JSON.parse(
    PageConfig.getOption('fileTypes') || '{}',
  );

  /**
   * Get a mimetype (or fallback).
   */
  export function getType(ext: string, defaultType: string | null = null): string {
    ext = ext.toLowerCase();
    for (const fileType of Object.values(TYPES)) {
      for (const fileExt of fileType.extensions || []) {
        if (fileExt === ext && fileType.mimeTypes && fileType.mimeTypes.length) {
          return fileType.mimeTypes[0];
        }
      }
    }

    return mime.getType(ext) || defaultType || MIME.OCTET_STREAM;
  }

  /**
   * Determine whether the given extension matches a given fileFormat.
   */
  export function hasFormat(
    ext: string,
    fileFormat: 'base64' | 'text' | 'json',
  ): boolean {
    ext = ext.toLowerCase();
    for (const fileType of Object.values(TYPES)) {
      if (fileType.fileFormat !== fileFormat) {
        continue;
      }
      for (const fileExt of fileType.extensions || []) {
        if (fileExt === ext) {
          return true;
        }
      }
    }
    return false;
  }
}

/**
 * The token for the BroadcastChannel broadcaster.
 */
export const IBroadcastChannelWrapper = new Token<IBroadcastChannelWrapper>(
  '@jupyterlite/contents:IBroadcastChannelWrapper',
);

export interface IBroadcastChannelWrapper extends IDisposable {
  enable(): void;
  disable(): void;
  enabled: boolean;
}
