# piplite

This is a companion package to
[micropip](https://github.com/pyodide/pyodide/tree/main/packages/micropip) which only
works inside a [pyodide](https://github.com/pyodide/pyodide/) runtime.

It adds the ability to use extra Warehouse-like API responses to resolve `pip`
dependencies, and can disable the fallback to `pypi.org`
