# Releasing JupyterLite

## Automated Releases with `jupyter_releaser`

The recommended way to make a release is to use
[`jupyter_releaser`](https://github.com/jupyter-server/jupyter_releaser#typical-workflow).

### Specifying a version spec

The `next` version spec is supported and will bump the packages as follows. For example:

- `0.1.0a0` -> `0.1.0a1`
- `0.1.0b7` -> `0.1.0b8`
- `0.1.0` -> `0.1.1`

_The `next` version spec is automatically applied when using the releaser_.

To bump to another version, you can specify the Python version directly. For example:

- `0.1.0b8`
- `0.1.1`
- `1.2.0rc0`

## Release assets

JupyterLite is published to:

- PyPI: https://pypi.org/project/jupyterlite/
- npm: https://www.npmjs.com/package/@jupyterlite/server

Release assets are also available on GitHub. For example for
[`0.1.0a12`](https://github.com/jupyterlite/jupyterlite/releases/tag/v0.1.0a12):

![release-assets](https://user-images.githubusercontent.com/591645/136523208-5b33d111-c668-4bc1-935f-2cafd929422a.png)
