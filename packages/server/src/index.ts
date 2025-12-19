// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

/**
 * @deprecated The `@jupyterlite/server` package is deprecated and will be removed in 0.8.0.
 * Please use `@jupyterlite/apputils` instead.
 *
 * This package now re-exports from `@jupyterlite/apputils` for backward compatibility.
 *
 * @example
 * ```typescript
 * // Before
 * import { IServiceWorkerManager, ServiceWorkerManager } from '@jupyterlite/server';
 *
 * // After
 * import { IServiceWorkerManager, ServiceWorkerManager } from '@jupyterlite/apputils';
 * ```
 */

export {
  IServiceWorkerManager,
  ServiceWorkerManager,
  WORKER_NAME,
  SERVICE_WORKER_BROADCAST_CHANNEL_ID,
} from '@jupyterlite/apputils';
