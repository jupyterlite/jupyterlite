# Releasing JupyterLite

The current release process is still a bit manual, but should hopefully improve and be
more automated soon.

## Getting a clean environment

To get a clean environment, the simplest is to follow the documentation for
contributing: https://jupyterlite.readthedocs.io/en/latest/contributing.html

Alternatively, a local repository can be cleaned with:

```bash
git clean -fdx
```

## Update the Changelog

We use [`github-activity`](https://github.com/executablebooks/github-activity) to
generate the Changelog based on GitHub labels.

This can be generated locally by running `github-activity` locally.

Or using the _Draft Changelog_ GitHub Actions workflow from the Jupyter Releaser to
handle that automatically:
https://github.com/jupyter-server/jupyter_releaser#typical-workflow

## Update the version

To update the version:

1. JS packages: `yarn update:dependency --regex @jupyterlite <new-version-spec`
2. Python packages with the search / replace on the Python releated files

Here is an example commit that bumps the versions:
https://github.com/jupyterlite/jupyterlite/commit/99dcbe7e445901bd09b34b7f0a19ca13af37312a

TBD: streamline the bump version process and sync between Python and JS packages.

## Releasing on PyPI

To release the `jupyterlite` command line tool on PyPI:

1. Build everything: `doit`
2. `cd py/jupyterlite`
3. Check the `dist` folder
4. Install the `jupyterlite` wheel in a new environment to test it
5. Run `flit publish` to publish to PyPI

## Releasing on conda forge

TBD

## Releasing on npm

TBD
