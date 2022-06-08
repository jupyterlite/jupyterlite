# Configure the browser storage

By default JupyterLite uses the user's browser storage to store settings and site
preferences.

## Settings Storage

By default, all of a user's settings on the same domain will be available to all
JupyterLite instances hosted there. To create separate settings stores, change the
`jupyter-lite.json#jupyter-config-data/settingsStorageName` from the default of
`JupyterLite Storage`.

By default, the best available, persistent storage driver will be used. One may force a
particular set of drivers to try with
`jupyter-lite.json#jupyter-config-data/settingsStorageDrivers`. See more about
[local storage drivers](#local-storage-drivers).

## Local Storage Drivers

By default, the "best" [localForage] driver will be selected from the technologies
available in the user's browser.

[localforage]: https://github.com/localForage/localForage

To force choosing from a particular set of technologies, `settingsStorageDrivers` and
`contentsStorageDrivers` can be specified, with the first browser-compatible driver
being chosen.

| configuration value   | technology   | persistent? | note                                   |
| --------------------- | ------------ | ----------- | -------------------------------------- |
| `asyncStorage`        | IndexedDB    | yes         | usually the one selected               |
| `webSQLStorage`       | WebSQL       | yes         |                                        |
| `localStorageWrapper` | localStorage | yes         |                                        |
| `memoryStorageDriver` | in-memory    | **NO**      | requires `enableMemoryStorage`         |
| _other_               | _unknown_    | _unknown_   | may be added by third-party extensions |

## Volatile Memory Storage

Many extensions and features require the ability to at least _think_ they are saving and
loading contents and settings. If a user's data cannot be stored due to browser security
settings, a JupyterLite app will generally fail to fully initialize: while this might be
frustrating, losing a user's unique data creation is _even more_ frustating.

```{warning}
If persistence is **entirely** handled outside of JupyterLite, e.g. in an embedded
[`repl`](../../quickstart/embed-repl.md) it is possible to disable all persistence, assuring
**total user data loss** after every page/iframe reload:
- set `enableMemoryStorage` to `true`
- set `contentsStorageDrivers` and `settingsStorageDrivers` to `["memoryStorageDriver"]`
```
