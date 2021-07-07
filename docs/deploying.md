# Deploying

Deploying your JupyterLite requires:

- an actual HTTP server (doesn't presently work with `file://` URLs)

```{warning}
Serving some of the [kernels](./kernels/index.md) requires that your web server supports
serving `application/wasm` files with the correct headers
```

```{hint}
An HTTPS-capable server is recommended for all but the simplest `localhost` cases.
```

## Get an Empty JupyterLite Site

The minimum deployable site contains enough to run JupyterLab and RetroLab, but no
content.

```{hint}
Use of the CLI is optional, but **recommended**. It offers substantially better
integration with other Jupyter tools.
```

To get the [Python CLI](./cli.ipynb) and [API](./api/index.md) from [PyPI]:

```bash
python -m pip install --pre jupyterlite
# TODO: mamba install jupyterlite
```

To build an empty site (just the JupyterLite static assets):

```bash
jupyter lite init
```

### Static Site: The Hard Way

- download a release archive from [GitHub Releases][releases]
- download nightly/work-in-progress builds from [GitHub actions]
- clone/fork the [repository] and do a [development build](../contributing.md)
- _TBD: use `cookiecutter-jupyterlite`_
- _TBD: `yarn add @jupyterlite/builder` from `npmjs.com`_

[github actions]: https://github.com/jtpio/jupyterlite/actions
[releases]: https://github.com/jtpio/jupyterlite/releases
[pypi]: https://pypi.org/project/jupyterlite/

```{hint}
It is recommended to put these files under revision control. See [Configuring](./configuring.md)
for what you can configure in your JupyterLite.
```

## Build Tools

While the JupyterLite CLI will create the correct assets for JupyterLite, it might not
be enough to deploy along with the rest of your content.

### WebPack

> TBD

### sphinx

[Sphinx] is the workhorse of documentation of not only the scientific Python
documentation community, but also the broader Python ecosystem, and many languages
beyond it. It is well adapted to building sites of any size, and tools like [myst-nb]
enable make it very palletable to include executable, and even interactive, content.

JupyterLite assets can be copied to the default static directory in `conf.py`, e.g.
`docs/_static` with [`html_static_path`](#html_static_path), or replace the entire site
with [`html_extra_path`](#html_extra_path)

### `html_static_path`

This search path can be merged several layers deep, such that your theme assets, the
"gold master" JupyterLite assets, and any customizations you wish to make are combined.

```python
html_static_path = [
    "_static",
    "../upstream-jupyterlite",
    "../my-jupyterlite"        # <- these "win"
]
```

The composite directory will end up in `docs/_build/_static`.

```{hint}
See the JupyterLite [conf.py] for an example approach, though it's likely a good
deal more complicated than you will need, because it needs to build _itself_ first!
This complexity is managed in [dodo.py].
```

### `html_extra_path`

A slightly more aggressive approach is to use [`html_extra_path`][html_extra_path] to
simply _dump_ the assets directly into the doc folder. This approach can be used to
deploy a site that launches _directly_ into your JupyterLite.

Adapting the example above:

```python
html_extra_path = ["../upstream-jupyterlite", "../my-jupyterlite"]
```

Again, the last-written `index.html` will "win" and be shown to vistors to `/`, which
will immediately redirect to `appUrl` as defined in the [schema].

[html_static_path]:
  https://www.sphinx-doc.org/en/master/usage/configuration.html#confval-html_static_path
[html_extra_path]:
  https://www.sphinx-doc.org/en/master/usage/configuration.html#confval-html_extra_path
[sphinx]: https://www.sphinx-doc.org
[myst-nb]: https://github.com/executablebooks/MyST-NB
[conf.py]: https://github.com/jtpio/jupyterlite/blob/main/docs/conf.py
[dodo.py]: https://github.com/jtpio/jupyterlite/blob/main/dodo.py
[schema]: ./schema-v0.rst

## Standalone Servers

### Local

Suitable for local development, many languages provide easy-to-use servers that can
serve your JupyterLite locally while you get it working the way you want.

#### Jupyter

If you're already running a [Jupyter Server]-powered app, such as JupyterLab, your files
will be served correctly on e.g. `http://localhost:8888/files`.

#### Python

##### http.server

The `http` module in the Python standard library is a suitably-effective server for
local purposes.

```bash
python -m http.server -b 127.0.0.1
```

If you are using a recently-released Python 3.7+, this will correctly serve
`application/wasm` files for pyodide.

##### sphinx-autobuild

If using [Sphinx](#sphinx), [sphinx-autobuild][] provides a convenient way to manage
both static content and rich interactive HTML like your JupyterLite.

```bash
sphinx-autobuild docs docs/_build
```

This will regenerate your docs site and automatically refresh any browsers you have
open. As your JupyterLite is mostly comprised of static assets, changes will _not_
trigger a refresh by default.

Enabling the `-a` flag _will_ allow reloading when static assets change, but at the
price rebuild the _whole_ site when _any_ file changes... this can be improved with the
`-j<N>` flag, but is not compatible with all sphinx extensions.

```bash
sphinx-autobuild docs docs/_build -aj8
```

[sphinx-autobuild]: https://github.com/executablebooks/sphinx-autobuild

#### NodeJS

Most nodejs-based servers will be able to host JupyterLite without any problems. Note,
however, that `http-server` does not support the `application/wasm` MIME type.

## On-Premises

### nginx

> TBD

### httpd

> TBD

### IIS

> TBD

## Hosted

### Binder

A JupyterLite can be deployed behind `jupyter-server-proxy` using any
[local server](#local) method. This is a good way to preview deployment interactively of
a e.g. Lab extension that can work in both the "full" binder experience, and as a static
preview.

```{hint}
See the JupyterLite [binder configuration] for an example.
```

[binder configuration]: https://github.com/jtpio/jupyterlite/tree/main/.binder

### ReadTheDocs

The [Sphinx](#sphinx) deployment approach will work almost transparently with
[ReadTheDocs](https://readthedocs.org), for the small price of a `.readthedocs.yml` file
in the root of your repository.

```{hint}
See the JupyterLite [.readthedocs.yml] for an example.
```

```{hint}
You might also want to enable the [Autobuild Documentation for Pull Requests] feature of Read The Docs to
automatically get a preview link when opening a new pull request:

![rtd-pr-preview](https://user-images.githubusercontent.com/591645/119787419-78db1c80-bed1-11eb-9a60-5808fea59614.png)
```

[.readthedocs.yml]: https://github.com/jtpio/jupyterlite/blob/main/.readthedocs.yml
[autobuild documentation for pull requests]:
  https://docs.readthedocs.io/en/stable/pull-requests.html#preview-documentation-from-pull-requests

### Netlify

[Netlify](https://www.netlify.com/) makes it easy and convenient to host static websites
from existing git repositories, and make them widely available via their CDN.

To deploy your own JupyterLite on Netlify, you can start from the [JupyterLite Demo] by
generating a new repository from the template.

Then add a `runtime.txt` file with `3.7` as the content to specify Python 3.7 as
dependency.

Finally specify `jupyter lite build --output-dir dist` as the "Build Command", and
`dist` as "Published Directory":

![netlify-build](https://user-images.githubusercontent.com/591645/124728917-4846c380-df10-11eb-8256-65e60dd3f258.png)

You might also want to specify the `--debug` flag to get extra log messages:

![deploy-logs](https://user-images.githubusercontent.com/591645/124779931-79d88280-df42-11eb-8f94-93d5715c18bc.png)

### Vercel

> TBD

### GitHub Pages

JupyterLite can easily be deployed on GitHub Pages, using the `jupyterlite` CLI to add
content and extensions.

```{hint}
See the [JupyterLite Demo] for an example. That repository is a GitHub template repository
which makes it convenient to generate a new JupyterLite site with a single click.
```

### GitLab Pages

JupyterLite can easily be deployed on GitLab Pages, using the `jupyterlite` CLI and
setting the `output_path` to the `public` folder in your `.gitlab-ci.yml` file.

Suppose that your notebooks are stored in the `content` folder; and you don't require
any additional python dependencies and configuration overrides, the `.gitlab-ci.yml`
could look like.

```
image: python
pages:
  stage: deploy
  before_script:
    - python -m pip install jupyterlite
  script:
    - jupyter lite build --files content --output-dir public
  artifacts:
    paths:
      - public # mandatory, other folder won't work
  only:
    - main # the branch you want to publish
```

```{hint}
See the [gitlab pages template] for a more involved example.
```

[gitlab pages template]: https://gitlab.com/benabel/jupyterlite-template

### Heroku

> TBD

[jupyterlite demo]: https://github.com/jupyterlite/demo
