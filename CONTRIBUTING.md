# Contributing to JupyterLite

Thanks for contributing to JupyterLite!

> We follow [Project Jupyter's Code of Conduct][coc] for a friendly and welcoming
> collaborative environment.

## Setup

### Get the code

```bash
git clone https://github.com/jtpio/jupyterlite
```

> if you don't have `git` yet, you might be able to use the instructions below to get it

### Prerequisites

You'll need:

- `git`
- `nodejs >=12`
- `yarn <2`

Various package managers on different operating systems provide these.

> A recommended approach for _any platform_ is to install [Mambaforge] and use the
> binder environment description checked into the repo.
>
> ```bash
> mamba env update --file .binder/environment.yml
> mamba activate jupyterlite-dev
> ```

## Development Tasks

### JavaScript development

#### Quick start

Most of the [development tasks](#development-tasks) can be run with one command:

```bash
yarn bootstrap
```

#### Install

```bash
yarn
```

#### Build

To build development assets:

```bash
yarn build
```

To build production assets:

```bash
yarn build:prod
```

#### Serve

```
yarn serve
```

To serve with python's built-in http server:

```
yarn serve:py
```

#### Watch

```bash
yarn watch
```

#### Lint

```bash
yarn lint
```

#### Test

```bash
yarn build:test
yarn test
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
- Run the `lint` and `test`
- Push to your fork
- Start the pull request
  - your `git` cli should offer you a link, as will the GitHub web UI
  - reference one or more [issue](#issues) so those that are interested can find your
    work
    - adding magic strings like `fixes #123` help tie the collaboration history together
- Wait for continuous integration
  - If stuff breaks, fix it or ask for help!

### Releasing

> TBD

[issues]: https://github.com/jtpio/jupyterlite/issues
[new issue]: https://github.com/jtpio/jupyterlite/issues/new
[pull requests]: https://github.com/jtpio/jupyterlite/pulls
[repo]: https://github.com/jtpio/jupyterlite
[coc]: (https://github.com/jupyter/governance/blob/master/conduct/code_of_conduct.md)
[mambaforge]: https://github.com/conda-forge/miniforge/
