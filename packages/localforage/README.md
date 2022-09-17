# `@jupyterlite/localforage`

This package contains JupyterLite utilities for working with
[localForage](https://github.com/localForage/localForage) and is used by other
components to provide browser-capability-aware persistence without a server.

It also offers the `IForager` pattern and a concrete `Forager` implementation which can
be useful for quickly bootstrapping configurable `localForage` instances, and is used by
`@jupyterlite/settings`, `@jupyterlite/contents` and `@jupyterlite/workspaces`.
