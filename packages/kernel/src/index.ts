// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

/**
 * @deprecated This package is deprecated and will be removed in 0.8.0. Please import from @jupyterlite/services instead.
 *
 * This package now acts as a shim that re-exports kernel-related components from
 * @jupyterlite/services for backward compatibility.
 *
 * @example
 * ```typescript
 * // Old (deprecated):
 * import { LiteKernelClient } from '@jupyterlite/kernel';
 *
 * // New (recommended):
 * import { LiteKernelClient } from '@jupyterlite/services';
 * ```
 */

// Re-export kernel-related classes (with their namespaces)
export {
  BaseKernel,
  LiteKernelClient,
  LiteKernelSpecClient,
  KernelSpecs,
} from '@jupyterlite/services';

// Re-export kernel-related interfaces (type-only)
export type { IKernel, IWorkerKernel, IRemoteKernel } from '@jupyterlite/services';

// Re-export kernel-related tokens (these are both types and values)
export { IKernelClient, IKernelSpecClient, IKernelSpecs } from '@jupyterlite/services';

// Re-export kernel-related constants
export { FALLBACK_KERNEL } from '@jupyterlite/services';
