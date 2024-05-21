# Contributing

Thanks for contributing to JupyterLite!

> We follow [Project Jupyter's Code of Conduct][coc] for a friendly and welcoming
> collaborative environment.

## Setup

### Get the Code

```bash
git clone https://github.com/jupyterlite/jupyterlite
```

> if you don't have `git` yet, you might be able to use the instructions below to get it

### Prerequisites

You'll need:

- `git`
- `nodejs >=20,<21`
- `jupyterlab >=4.2,<4.3`
- `python >=3.11,<3.12`

Various package managers on different operating systems provide these.

> A recommended approach for _any platform_ is to install [Mambaforge] and use the
> Binder environment description checked into the repo.
>
> ```bash
> mamba env update --file .binder/environment.yml
> mamba activate jupyterlite-dev
> ```
>
> To get full archive reproducibility test output, only available on Linux, also run:
>
> ```bash
> mamba install -c conda-forge diffoscope
> ```

For speed in GitHub Actions, `python` and `nodejs` are installed directly. Provided you
already have these, to install the full development stack:

```bash
python -m pip install -r requirements-docs.txt -r requirements-lint.txt
```

## Development Tasks

### doit

[`doit`](https://github.com/pydoit/doit) handles the full software lifecycle, spanning
JavaScript to documentation building and link checking. It understands the dependencies
between different nested _tasks_, usually as files that change on disk.

#### List Tasks

To see all of the _tasks_ available, use the `list` action:

```bash
doit list --all --status
```

#### Task and Action Defaults

The default `doit` _action_ is `run` which... runs the named _tasks_.

The default tasks are `build` and `docs:app:build`, so the following are equivalent:

```bash
doit
doit build docs:app:build
doit run build docs:app:build
```

```{note}
For reference the default `doit` tasks are defined in the `DOIT_CONFIG` variable in the [dodo.py][dodo] file.
```

#### `doit serve`

A number of development servers can be started for interactive local development and
documentation authoring.

These offer different assets and tools, and obey different environment variables:

- `5000`: core assets from `./app`:
  - `doit serve:core:js`
  - `doit serve:core:py`
- `8000`: example site `./build/docs-app` on :
  - `doit serve:docs:app`
    - `LITE_ARGS` (a JSON list of strings) controls CLI arguments to `jupyter lite`
- `8888`: JupyterLab
  - `doit serve:lab`
    - `LAB_ARGS` (a JSON list of strings) controls CLI arguments to `jupyter lab`

### Core JavaScript development

The JupyterLite core JS development workflow builds:

- multiple apps for each of the `notebook`, `lab`, and `repl` frontends
  - the entrypoint for each app is located under `{appName}/index.html`. For example:
    - `lab/index.html`: opens the JupyterLab interface
    - `notebooks/index.html?path=example.ipynb`: opens the notebook interface with the
      `example.ipynb` notebook
    - `tree/index.html`: opens the file browser via the Jupyter Notebook interface
  - common configuration tools
- `typedoc` documentation
- > _TBD: a set of component tarballs distributed on `npmjs.com`. See [#7]._

from:

- a set of `packages` in the `@jupyterlite` namespace, , written in TypeScript
- some `buildutils`
- some `webpack` configuration
- some un-compiled, vanilla JS for very early-loading utilities
  - > TODO: fix this, perhaps with jsdoc tags

While most of the scripts below will be run (in the correct order based on changes) by
`doit`, the following _scripts_ (defined in `package.json`) are worth highlighting.

[#7]: https://github.com/jupyterlite/jupyterlite/issues/7

#### Quick start

Most of the [development tasks](#development-tasks) can be run with one command:

```bash
jlpm bootstrap
```

#### Install JavaScript Dependencies

```bash
jlpm
```

#### Build Apps

To build development assets:

```bash
jlpm build
```

To build production assets:

```bash
jlpm build:prod
```

#### Serve Apps

> These are **not real server solutions**, but they _will_ serve all of the assets types
> (including `.wasm`) correctly for JupyterLite development, testing, and demo purposes.

To serve with `scripts/serve.js`, based on Node.js's
[`http`](https://nodejs.org/api/http.html) module:

```bash
jlpm serve
```

To serve with Python's built-in
[`http.server`](https://docs.python.org/3/library/http.server.html) module (requires
Python 3.7+):

```bash
jlpm serve:py
```

#### Watch Sources

```bash
jlpm watch
```

#### Lint/Format Sources

```bash
jlpm lint
```

#### Run Unit Tests

```bash
jlpm build:test
jlpm test
```

#### Installing other kernels

By default this repository only includes the JavaScript kernel.

If you would like to setup a local environment with an additional, you can install
explicitely, before running the `jupyter lite build` command. For example:

- To install the Pyodide kernel: `pip install jupyterlite-pyodide-kernel`
- To install the Xeus Python kernel:
  https://jupyterlite-xeus.readthedocs.io/en/latest/environment.html

### UI Tests

`jupyterlite` uses the
[Galata](https://github.com/jupyterlab/jupyterlab/tree/master/galata) framework for end
to end and visual regression testing. Galata is build on top of
[Playwright](https://playwright.dev) provides a high level API to programmatically
interact with the JupyterLab UI, and tools for taking screenshots and generating test
reports.

#### Running the UI Tests locally

First install the dependencies:

```sh
cd ui-tests
jlpm install
```

The UI tests use a custom JupyterLite website:

```sh
# in ui-tests directory

# build
jlpm build
```

Then run the `test` script:

```sh
# in the ui-tests directory
jlpm test
```

You can pass additional arguments to `playwright` by appending parameters to the
command. For example to run the test in headed mode, `jlpm test --headed`.

Checkout the [Playwright Command Line Reference](https://playwright.dev/docs/test-cli/)
for more information about the available command line options.

#### Adding new UI tests

New test suites can be added to the `ui-tests/tests` directory. You can see some
additional example test suites in the
[JupyterLab repo](https://github.com/jupyterlab/jupyterlab/blob/master/galata/test). If
the tests in new suites are doing visual regression tests or HTML source regression
tests then you also need to add their reference images to the `-snapshots` directories.

#### Reference Image Captures

When adding a new visual regression test, first make sure your tests pass locally on
your development environment, with a reference snapshots generated in your dev
environment. You can generate new reference snapshots by running the following command:

```bash
jlpm test:update
```

To update the snapshots:

- push the new changes to the branch
- wait for the CI check to complete
- go to the artifacts section and download the `jupyterlite-chromium-updated-snapshots`
  and `jupyterlite-firefox-updated-snapshots` archives
- extract the archives
- copy the `-snapshots` directories to replace the existing ones
- commit and push the changes

Alternatively, you can also post a comment on the PR with the following content:

```
bot please update playwright snapshots
```

The bot should react to the comment by leaving a 👍 reaction, and trigger the snapshot
update in a background GitHub Action run.

The generated snapshots can be found on the Summary page of the CI check:

![reference-snapshots](https://user-images.githubusercontent.com/591645/141300086-d13c3221-a66d-45f5-b0ac-6f4795b16349.png)

#### Troubleshooting UI tests

The UI tests have the Playwright `trace` option enabled which is useful to have a more
in-depth look at failing tests on CI, including console errors and network calls.

To view the trace:

1. download the Playwright report from the GitHub Actions artifacts
2. start a web server (for example with `python -m http.server`) and open the report in
   a browser
3. navigate to the failing test
4. scroll to the "Trace" section of the test to open the trace in a new tab

![a screenshot showing the Playwright trace](https://github.com/jupyterlite/jupyterlite/assets/591645/76485f0e-0bc8-4d8e-9584-7e5f185c96cd)

For more information: https://playwright.dev/docs/trace-viewer

### (Server) Python Development

After all the `jlpm`-related work has finished, the terminal-compatible python uses the
`npm`-compatible tarball of `app` to build new sites combined with **original user
content**.

#### On testing

Extra `PYTEST_ARGS` can be passed as a (gross) JSON string:

```bash
PYTEST_ARGS='["-s", "-x", "--ff"]' doit test:py:jupyterlite-core
```

Several tasks invoke the `jupyter lite` CLI, which is further described in the main docs
site.

### Documentation

The documentation site, served on [jupyterlite.rtfd.io], uses information from different
parts of the software lifecycle (e.g. contains an archive of the built `app` directory),
so using the [doit](#doit) tools are recommended.

Additionally, some of the documentation is written in executable `.ipynb` which are
converted by [myst](https://myst-nb.readthedocs.io): use of `doit serve:lab` is
encouraged for editing these.

[jupyterlite.rtfd.io]: https://jupyterlite.rtfd.io

#### Build Documentation

```bash
doit docs
```

> Extra `sphinx-build` arguments are set by the `SPHINX_ARGS` environment variable. For
> example to fail on all warnings (the configuration for the ReadTheDocs build):
>
> ```bash
> SPHINX_ARGS='["-W"]' doit docs
> ```

#### Watch Documentation

```bash
doit watch:docs
```

> This also respects the `SPHINX_ARGS` variable. If working on the theme layer,
> `SPHINX_ARGS='["-a", "-j8"]'` is recommended, as by default static assets are not
> included in the calculation of what needs to be updated.

## Community Tasks

### Issues

JupyterLite features and bug fixes start as [issues] on GitHub.

- Look through the existing issues (and [pull requests]!) to see if a related issue
  already exists or is being worked on
- If it is new:
  - Start a [new issue]
  - Pick an appropriate template
  - Fill out the template
  - Wait for the community to respond

### Pull Requests

JupyterLite features and fixes become _real_ as [pull requests].

> Pull requests are a great place to discuss work-in-progress, but it is **highly
> recommended** to create an [issue](#issues) before starting work so the community can
> weigh in on choices.

- Fork the repo
- Make a new branch off `main`
- Make changes
- Run `doit`
- Push to your fork
- Start the pull request
  - your `git` CLI should offer you a link, as will the GitHub web UI
  - reference one or more [issue](#issues) so those that are interested can find your
    work
    - adding magic strings like `fixes #123` help tie the collaboration history together
- Wait for continuous integration
  - If stuff breaks, fix it or ask for help!

#### Previews

Each pull request is built and deployed on ReadTheDocs. You can view the live preview
site by clicking on the ReadTheDocs check:

![rtd-pr-preview](https://user-images.githubusercontent.com/591645/119787419-78db1c80-bed1-11eb-9a60-5808fea59614.png)

#### Artifacts

Additionally, several build artifacts are available from the each run on the [Actions]
page, including:

- test reports
- installable artifacts
- an app archive ready to be used as the input to the `jupyter lite` CLI with all the
  demo content and supporting extensions.

> You must be logged in to GitHub to download these.

[actions]: https://github.com/jupyterlite/jupyterlite/actions
[issues]: https://github.com/jupyterlite/jupyterlite/issues
[new issue]: https://github.com/jupyterlite/jupyterlite/issues/new
[pull requests]: https://github.com/jupyterlite/jupyterlite/pulls
[repo]: https://github.com/jupyterlite/jupyterlite
[coc]: https://github.com/jupyter/governance/blob/master/conduct/code_of_conduct.md
[mambaforge]: https://github.com/conda-forge/miniforge
[dodo]: https://github.com/jupyterlite/jupyterlite/blob/main/dodo.py
