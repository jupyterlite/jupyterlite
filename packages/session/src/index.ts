// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

/**
 * @deprecated This package is deprecated. Please import from @jupyterlite/services instead.
 *
 * This package now acts as a shim that re-exports session-related components from
 * @jupyterlite/services for backward compatibility.
 *
 * @example
 * ```typescript
 * // Old (deprecated):
 * import { LiteSessionClient } from '@jupyterlite/session';
 *
 * // New (recommended):
 * import { LiteSessionClient } from '@jupyterlite/services';
 * ```
 */

// Re-export session-related classes
export { LiteSessionClient } from '@jupyterlite/services';
