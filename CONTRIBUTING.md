# Contributing

Thanks for contributing to JupyterLite!

> We follow [Project Jupyter's Code of Conduct][coc] for a friendly and welcoming
> collaborative environment.

## Setup

### Get the Code

```bash
git clone https://github.com/jtpio/jupyterlite
```

> if you don't have `git` yet, you might be able to use the instructions below to get it

### Prerequisites

You'll need:

- `git`
- `nodejs >=12`
- `yarn <2`
- `python >=3.8`

Various package managers on different operating systems provide these.

> A recommended approach for _any platform_ is to install [Mambaforge] and use the
> binder environment description checked into the repo.
>
> ```bash
> mamba env update --file .binder/environment.yml
> mamba activate jupyterlite-dev
> ```

## Development Tasks

### doit

[doit](https://github.com/pydoit/doit) handles the full software lifecycle, spanning
JavaScript to documentation building. It understands the dependencies between different
nested _tasks_, usually as files that change on disk.

#### List Tasks

To see all of the _tasks_ available, use the `list` action:

```bash
doit list --all --status
```

To get information about a specific _task_, use the info `info` _action_ with the _task_
name from the first column of `list`:

```bash
doit info build:js:app:classic
```

#### Task and Action Defaults

The default `doit` _action_ is `run` which... runs the named _tasks_.

The default tasks are `lint` and `build`, which do basically everything performed by
continuous integration, so the following are equivalent:

```bash
doit
doit lint build
doit run lint build
```

### JavaScript development

While most of the scripts below will be run (in the correct order based on changes) by
`doit`, the following _scripts_ (defined in `package.json`) are worth highlighting.

#### Quick start

Most of the [development tasks](#development-tasks) can be run with one command:

```bash
yarn bootstrap
```

#### Install JavaScript Dependencies

```bash
yarn
```

#### Build Apps

To build development assets:

```bash
yarn build
```

To build production assets:

```bash
yarn build:prod
```

#### Serve Apps

> These are **not real server solutions**, but they _will_ serve all of the assets types
> (including `.wasm`) correctly for JupyterLite under development, testing, and demo
> purposes.

To serve with `scripts/serve.js`, based on Node.js's
[`http`](https://nodejs.org/api/http.html) module:

```
yarn serve
```

To serve with Python's built-in
[`http.server`](https://docs.python.org/3/library/http.server.html) module (requires
Python 3.7+):

```
yarn serve:py
```

#### Watch Sources

```bash
yarn watch
```

#### Lint/Format Sources

```bash
yarn lint
```

#### Run Unit Tests

```bash
yarn build:test
yarn test
```

### Documentation

The documentation site, served on readthedocs.io, uses information from different parts
of the software lifecycle (e.g. contains a copy of the built `app` directory), so using
the [doit](#doit) tools are recommended.

#### Build Documentation

```bash
doit docs
```

#### Watch Documentation

```bash
doit watch:docs
```

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

JupyterLite become _real_ as [pull requests].

> Pull requests are a great place to discuss work-in-progress, but it is **highly
> recommended** to create an [issue](#issues) before starting work so the community can
> weigh in on choices.

- Fork the repo
- Make a new branch off `main`
- Make changes
- Run `doit lint test`
- Push to your fork
- Start the pull request
  - your `git` cli should offer you a link, as will the GitHub web UI
  - reference one or more [issue](#issues) so those that are interested can find your
    work
    - adding magic strings like `fixes #123` help tie the collaboration history together
- Wait for continuous integration
  - If stuff breaks, fix it or ask for help!

#### Previews

Each pull request is built and deployed on Read The Docs. You can check the live preview
by clicking on the Read The Docs check:

![rtd-pr-preview](https://user-images.githubusercontent.com/591645/119787419-78db1c80-bed1-11eb-9a60-5808fea59614.png)

### Releasing

> TBD

[issues]: https://github.com/jtpio/jupyterlite/issues
[new issue]: https://github.com/jtpio/jupyterlite/issues/new
[pull requests]: https://github.com/jtpio/jupyterlite/pulls
[repo]: https://github.com/jtpio/jupyterlite
[coc]: https://github.com/jupyter/governance/blob/master/conduct/code_of_conduct.md
[mambaforge]: https://github.com/conda-forge/miniforge
