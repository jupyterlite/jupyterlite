## JupyterLite development setup (with working Pyodide kernel)

This guide sets up a local development environment and ensures the Python (Pyodide) kernel appears in the Launcher. It covers both the full-site workflow (recommended) and the app-only workflow (no kernels).

### Prerequisites
- Node.js 20.x
- Python 3.12.x
- JupyterLab >= 4.5.0a1, < 4.6

Recommended: create and activate a clean environment (e.g., with mamba or conda).

```bash
mamba create -n jupyterlite-dev -y python=3.12 nodejs=20
mamba activate jupyterlite-dev
```

### 1) Get the code
```bash
git clone https://github.com/jupyterlite/jupyterlite
cd jupyterlite
```

### 2) Install dependencies
- JavaScript deps
```bash
jlpm install
```

- Python deps (editable installs for repo packages)
```bash
python -m pip install -r requirements-editable.txt
```

- Pyodide kernel (required to get a Python kernel in the site)
```bash
python -m pip install -U jupyterlite-pyodide-kernel
```

- Archive support (needed if you use the docs demo config that downloads `.conda` extensions)
```bash
python -m pip install -U libarchive-c
```

Verify versions (should match the repo):
```bash
python -m pip show jupyterlite jupyterlite-core jupyterlite-pyodide-kernel
# jupyterlite == 0.7.0a1
# jupyterlite-core == 0.7.0a1
# jupyterlite-pyodide-kernel >= 0.6.1
```

---

## Run options

### Option A: Full site with kernels via doit (recommended during development)
This builds a complete JupyterLite site (including kernels) and serves it on port 8000.

```bash
doit dev
doit serve:docs:app
# open http://127.0.0.1:8000/lab/
```

Notes:
- The docs app uses `examples/jupyter_lite_config.json` which by default downloads prebuilt extensions (including the Pyodide kernel) as conda packages. `libarchive-c` is required to unpack `.conda` files.
- To instead use extensions from your current environment, override the setting via `LITE_ARGS`:

```bash
export LITE_ARGS='["--LiteBuildConfig.ignore_sys_prefix=[]"]'
doit dev
doit serve:docs:app
```

### Option B: Build your own minimal site (uses your installed kernel)
This path does not rely on the docs config and will include whatever kernels are installed in your Python environment (e.g., `jupyterlite-pyodide-kernel`).

```bash
jupyter lite init
jupyter lite build --output-dir dist
jupyter lite serve --output-dir dist
# open http://127.0.0.1:8000/lab/
```

### Option C: App-only dev server (no kernels)
Useful to iterate on the frontend only. This does not include kernels.
```bash
jlpm build
jlpm serve
# open http://127.0.0.1:5000/lab/
```

---

## Troubleshooting

- No kernels in the Launcher
  - Ensure versions: `jupyterlite` and `jupyterlite-core` are both `0.7.0a1`.
  - Ensure the kernel is installed: `python -m pip install jupyterlite-pyodide-kernel`.
  - If using Option A (docs app): install `libarchive-c` so `.conda` extensions can be extracted.
  - Clear browser data to defeat the Service Worker cache: in the running app use Help > Clear Browser Data, then hard refresh.

- Validate the built site contains the kernel
  - After a successful build (Option A or B):
    - `dist/jupyter-lite.json` should contain a non-empty `jupyter-config-data.federated_extensions` list.
    - `dist/extensions/@jupyterlite/pyodide-kernel-extension/` should exist.

- Service Worker limitations
  - Works on `https://` or on `http://127.0.0.1:{port}` / `http://localhost:{port}`.

- Passing extra CLI options to the docs app build
  - Use `LITE_ARGS` to pass JSON list of CLI flags to `jupyter lite` during `doit serve:docs:app`, e.g.:
    ```bash
    export LITE_ARGS='["--output-dir","build/docs-app"]'
    ```

---

## Quick reference

```bash
# One-time
jlpm install
python -m pip install -r requirements-editable.txt
python -m pip install -U jupyterlite-pyodide-kernel libarchive-c

# Dev (full site)
doit dev && doit serve:docs:app

# Standalone site build
jupyter lite init
jupyter lite build --output-dir dist
jupyter lite serve --output-dir dist
```


