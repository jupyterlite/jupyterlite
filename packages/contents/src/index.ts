// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

/**
 * @deprecated This package is deprecated and will be removed in 0.8.0. Please import from @jupyterlite/services instead.
 *
 * This package now acts as a shim that re-exports contents-related components from
 * @jupyterlite/services for backward compatibility.
 *
 * @example
 * ```typescript
 * // Old (deprecated):
 * import { BrowserStorageDrive } from '@jupyterlite/contents';
 *
 * // New (recommended):
 * import { BrowserStorageDrive } from '@jupyterlite/services';
 * ```
 */

// Re-export contents-related classes
export {
  BrowserStorageDrive,
  DriveContentsProcessor,
  DriveFS,
  DriveFSEmscriptenStreamOps,
  DriveFSEmscriptenNodeOps,
  ServiceWorkerContentsAPI,
} from '@jupyterlite/services';

// Re-export contents-related interfaces and types
export type {
  IDriveContentsProcessor,
  IDriveStream,
  IStats,
  IEmscriptenFSNode,
  IEmscriptenStream,
  IEmscriptenNodeOps,
  IEmscriptenStreamOps,
  FS,
  ERRNO_CODES,
  PATH,
  TDriveMethod,
  TDriveData,
  TDriveRequest,
  TDriveResponse,
} from '@jupyterlite/services';

// Re-export contents-related constants, namespaces, and functions
export {
  DRIVE_NAME,
  DRIVE_SEPARATOR,
  BLOCK_SIZE,
  DIR_MODE,
  FILE_MODE,
  SEEK_CUR,
  SEEK_END,
  instanceOfStream,
  MIME,
  FILE,
} from '@jupyterlite/services';
