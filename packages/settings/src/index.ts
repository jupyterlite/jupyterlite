// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

/**
 * @deprecated This package is deprecated and will be removed in 0.8.0. Please import from @jupyterlite/services instead.
 *
 * This package now acts as a shim that re-exports settings-related components from
 * @jupyterlite/services for backward compatibility.
 *
 * @example
 * ```typescript
 * // Old (deprecated):
 * import { Settings } from '@jupyterlite/settings';
 *
 * // New (recommended):
 * import { Settings } from '@jupyterlite/services';
 * ```
 */

// Re-export settings-related classes
export { Settings } from '@jupyterlite/services';

// Re-export settings-related types
export type { SettingsFile } from '@jupyterlite/services';
