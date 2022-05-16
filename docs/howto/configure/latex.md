# LaTeX

Rendering $\LaTeX$ is generally handled in a special way when compared with most other
renderers in JupyterLab. For this reason, it is _not_ presently covered by a _pre-built
extension_, but rather by adding [MathJax 2](https://www.mathjax.org) directly to the
page. As it changes very slowly, and is _relatively_ benign if missing for most use
cases, this use of a CDN is the default for JupyterLite.

Configuring `fullMathjaxUrl` and `mathjaxConfig` in `jupyter-lite.json` allows you to
specify a relative or remote location, replacing (or avoiding) the CDN. If
[`jupyter-server-mathjax`](https://github.com/jupyter-server/jupyter_server_mathjax) is
installed, the default configuration `TeX-AMS-MML_HTMLorMML-full,Safe` will be copied
into the output folder.
