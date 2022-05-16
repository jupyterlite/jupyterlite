# About the Demo

This documentation site contains the JupyterLite Demo (the **Try** buttons on the top of
the screen) and uses a number of techniques described on this page.

## Demo Configuration

The following generated configuration powers the Demo, and is generated prior to
building the docs site, copied in during the build, and fetched by browsers from
`/_static/jupyter-lite.json`.

```{literalinclude} ../../build/docs-app/jupyter-lite.json
:language: json
```

## Demo Extension Notes

The `federated_extensions` above are copied from the documentation environment prior to
building this site with [Sphinx](../howto/deployment/sphinx.md), and are meant to
exercise different kinds of extensions, including themes, MIME renderers, Widgets, and
an shared document provider for [RTC](../howto/configure/rtc.md).

The demo disables autodetection of environment extensions with `ignore_sys_prefix`, as
the outer development environment includes a number of extensions with features that
don't work.
