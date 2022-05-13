# Developer Guide

## Contents

```{toctree}
:maxdepth: 2

configuring
cli
deploying
api/index
architecture
extensions
cli-addons
doit
```

## Frequently-Asked Questions

### How can I ship additional pyolite wheels?

User-installable wheels can be included at extension build time. Wheel indices can be
generated with the `jupyter lite pip index` [CLI](./cli.ipynb#pyolite-wheels) and then
included in `package.json#/piplite`: make sure to include the index and `.whl` files in
`package.json#/files` as well.
