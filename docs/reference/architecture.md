# Architecture

## Overview

Below is a diagram showing a high level architecture overview of JupyterLite.

It focuses on the "server" part of JupyterLite and the fact that it is built using the
Lumino plugin system, just like JupyterLab itself. But It doesn't show the internals of
JupyterLab, Jupyter Notebook, and the several kernels.

![architecture-diagram](../images/jupyterlite-diagram.svg)

```{hint}
The diagram is a DrawIO diagram, and can be edited on [diagrams.net](https://app.diagrams.net)
```

## Contents

One of the most complex pieces of architecture is the logic to make the Jupyter contents
available within the kernels. You can have more details on that part in the
[Contents](./contents.md) section.
