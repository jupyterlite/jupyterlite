// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

declare module 'localforage-memoryStorageDriver' {
  import type { LocalForageDriver } from 'localforage';
  const memoryStorageDriver: LocalForageDriver;
  export default memoryStorageDriver;
}
