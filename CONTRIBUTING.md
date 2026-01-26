# Contributing

Thanks for contributing to JupyterLite!

We follow
[Project Jupyter's Code of Conduct](https://github.com/jupyter/governance/blob/main/docs/conduct/code_of_conduct.md)
for a friendly and welcoming collaborative environment.

## Setup

### Prerequisites

You'll need:

- `git`
- `nodejs >=24,<25`
- `python >=3.10`

**Tip**: You can use any Python package manager you prefer (`pip`, `conda`, etc.) for
installing Python dependencies.

### Quick Start

Install all dependencies and set up the dev environment:

```bash
# 1. Install build dependencies (includes JupyterLab which provides `jlpm`)
pip install --group build

# 2. Install Node.js dependencies and Python packages
jlpm install
jlpm install:py
```

The `jlpm install:py` command installs remaining Python dependencies and packages in
editable mode.

You can also install dependencies manually:

```bash
pip install --group dev     # Core dev tools
pip install --group all-dev # All dev dependencies (dev + docs + lint + test)

# Python package in editable mode
pip install -e './py/jupyterlite-core[all,test]'
```

Available dependency groups:

| Group      | Description                                     |
| ---------- | ----------------------------------------------- |
| `build`    | Minimal build dependencies (hatch, jupyterlab)  |
| `dev`      | Core development (includes `build`)             |
| `docs`     | Documentation building (Sphinx, themes)         |
| `lint`     | Linting tools (ruff, pre-commit)                |
| `test`     | Testing (pytest and plugins)                    |
| `demo`     | Demo site extensions (widgets, libraries)       |
| `ui-tests` | UI/Playwright tests (includes `build`)          |
| `release`  | Release process (includes `build` + `lint`)     |
| `all-dev`  | All dev dependencies (dev + docs + lint + test) |

**Note**: Dependency groups (PEP 735) require pip 24.1+ or
[uv](https://docs.astral.sh/uv/).

Then run the build command:

```bash
jlpm build
```

## Development Workflow

### Local Development

| Command          | Description                                              |
| ---------------- | -------------------------------------------------------- |
| `jlpm dev:watch` | Build and watch for changes (creates `_site/` directory) |
| `jlpm dev:serve` | Serve `_site/` on http://localhost:8000                  |
| `jlpm dev:build` | One-off build (no watching)                              |

The recommended workflow uses two terminal windows:

```bash
# Terminal 1: Watch and rebuild on changes
jlpm dev:watch

# Terminal 2: Serve the site (run after Terminal 1 creates _site/)
jlpm dev:serve
```

Refresh your browser after changes. For Python package changes or new extensions,
restart `dev:watch`.

#### Directory Structure

| Directory   | Purpose                                                               |
| ----------- | --------------------------------------------------------------------- |
| `app/`      | The JupyterLite application shell (built from `packages/`)            |
| `packages/` | TypeScript source packages (core libraries, plugins, extensions)      |
| `py/`       | Python packages (CLI) (`jupyterlite-core`, `jupyterlite`)             |
| `examples/` | Demo content: notebooks, `jupyter_lite_config.json`, and requirements |
| `_site/`    | Build output directory (contains `build/` symlink to `app/build/`)    |
| `ui-tests/` | Playwright end-to-end and visual regression tests                     |
| `docs/`     | Sphinx documentation source                                           |

#### Adding Kernels and Extensions

Install kernels and extensions with pip:

```bash
pip install jupyterlite-pyodide-kernel
jlpm dev:build  # Rebuilds site with the new kernel
```

### Repository Integrity

The repository has integrity checks to ensure consistency across package files.

#### App Resolutions

Each app (`app/lab`, `app/notebooks`, etc.) has a `resolutions` field in its
`package.json` that pins dependency versions. Resolutions must stay in sync with
`dependencies` - if you update a dependency version, the corresponding resolution must
also be updated.

```bash
jlpm integrity
```

Run `jlpm integrity` after updating dependencies (e.g., bumping JupyterLab versions) to
sync the resolution entries.

#### Yarn Lock Deduplication

The `yarn.lock` file should be deduplicated to minimize dependency duplication:

```bash
jlpm deduplicate
```

#### Updating Package Dependencies

To update a dependency across the monorepo:

```bash
jlpm up "<package-pattern>"
```

For example, to update all `@jupyterlab/*` packages to the latest version:

```bash
jlpm up "@jupyterlab/*"
```

After updating dependencies, run `jlpm integrity` to sync app resolutions.

#### Upgrading JupyterLab and Notebook Versions

When a new JupyterLab or Notebook release is available, use the upgrade script to update
dependencies across the repository. At least one of `--jupyterlab-version` or
`--notebook-version` must be specified:

```bash
# Update JupyterLab to latest stable
python scripts/upgrade-dependencies.py --jupyterlab-version latest

# Update Notebook to latest stable
python scripts/upgrade-dependencies.py --notebook-version latest

# Update both to latest stable
python scripts/upgrade-dependencies.py --jupyterlab-version latest --notebook-version latest
```

This script:

- Fetches the specified releases from GitHub
- Updates version constraints in `pyproject.toml`
- Updates all `@jupyterlab/*`, `@lumino/*`, `@jupyter/*`, and `@jupyter-notebook/*`
  dependencies in `package.json` files to match upstream versions
- Only updates packages for which a version argument is provided

##### Common Usage Patterns

```bash
# Preview changes without modifying files
python scripts/upgrade-dependencies.py --jupyterlab-version latest --dry-run

# Update to the latest pre-release versions
python scripts/upgrade-dependencies.py --jupyterlab-version next --notebook-version next

# Update to specific versions
python scripts/upgrade-dependencies.py --jupyterlab-version 4.4.0 --notebook-version 7.4.0
```

##### After Running the Script

```bash
jlpm install      # Update yarn.lock
jlpm deduplicate  # Clean up duplicate dependencies
jlpm integrity    # Sync app resolutions
jlpm build        # Verify the build succeeds
```

##### GitHub Token for API Rate Limiting

Set the `GITHUB_TOKEN` environment variable to avoid GitHub API rate limiting
(unauthenticated requests are limited to 60/hour, authenticated to 5,000/hour). For
local development, create a [Personal Access Token](https://github.com/settings/tokens):

- **Classic PAT**: No scopes required (public repo read access is implicit)
- **Fine-grained PAT**: Select "Public Repositories (read-only)"

In GitHub Actions, the CI workflow uses `PERSONAL_GITHUB_TOKEN` (a PAT stored as a
repository secret) to create PRs. This is required because PRs created with the
automatic `GITHUB_TOKEN` won't trigger CI checks on the PR itself.

##### Automated Upgrade via GitHub Actions

You can trigger the upgrade workflow directly from GitHub Actions from a fork, which
automates the entire process (running the script, updating lock files, and creating a
PR).

###### Setting Up the Token in Your Fork

Before running the workflow from a fork, you need to create a `PERSONAL_GITHUB_TOKEN`
repository secret:

1. Create a [Personal Access Token](https://github.com/settings/tokens) with these
   permissions:
   - **Classic PAT**: `repo` scope (to push branches and create PRs)
   - **Fine-grained PAT**: Select the target repository with "Contents" (read/write) and
     "Pull requests" (read/write) permissions
2. Go to your fork's **Settings → Secrets and variables → Actions**
3. Click **New repository secret**
4. Name it `PERSONAL_GITHUB_TOKEN` and paste your token

###### Running the Workflow

1. Go to **Actions → Upgrade JupyterLab/Notebook dependencies** in the GitHub repository
2. Click "Run workflow"
3. Fill in the parameters:
   - **JupyterLab version**: Version number or `latest` (default: `latest`)
   - **Notebook version**: Version number or `latest` (default: `latest`)
   - **Branch**: Target branch for the PR (default: `main`)
   - **Target repository**: Where to create the PR (default: `jupyterlite/jupyterlite`)
4. Click "Run workflow"

The workflow will create a PR with all necessary changes if updates are available.

### Demo Site Dependencies

The demo site extensions are defined in the `demo` dependency group in `pyproject.toml`.

| File                                | Purpose                                    |
| ----------------------------------- | ------------------------------------------ |
| `pyproject.toml` (demo group)       | Source of truth for demo extensions        |
| `examples/requirements-demo.txt`    | Lock file with pinned versions (generated) |
| `examples/requirements-piplite.txt` | Additional packages for piplite bundling   |
| `examples/jupyter_lite_config.json` | Contains generated `piplite_urls`          |

#### Updating Demo Dependencies

When you change the `demo` dependency group in `pyproject.toml`, regenerate the lock
file and piplite URLs:

```bash
python scripts/compile-lock-files.py
```

This will update both `examples/requirements-demo.txt` and the `piplite_urls` in
`examples/jupyter_lite_config.json`. Commit these generated files.

**Note**: This script uses `uv` if available, otherwise falls back to `pip-compile`
(from pip-tools).

### Documentation

Install the docs dependency group first:

```bash
pip install --group docs
```

| Command           | Description                         |
| ----------------- | ----------------------------------- |
| `jlpm docs:build` | Build Sphinx documentation          |
| `jlpm docs:serve` | Serve docs on http://localhost:8000 |
| `jlpm docs:watch` | Watch mode with auto-rebuild        |

## Testing

### Python Tests

```bash
jlpm test:py
```

### UI Tests (Playwright)

JupyterLite uses [Galata](https://github.com/jupyterlab/jupyterlab/tree/master/galata)
for end-to-end and visual regression testing.

> **Note**: Complete the [Quick Start](#quick-start) setup first - UI tests require
> `jupyterlite-core` to be installed.

```bash
# Install the ui-tests dependencies
pip install --group ui-tests

cd ui-tests

# Install dependencies
jlpm

# Install Playwright browsers
jlpm playwright install

# Build the JupyterLite app used in the tests
jlpm build

# Run the tests
jlpm test
```

To run in headed mode:

```bash
jlpm test --headed
```

To update snapshots:

```bash
jlpm test:update
```

See [Playwright Command Line Reference](https://playwright.dev/docs/test-cli) for more
options.
