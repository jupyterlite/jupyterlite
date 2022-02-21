# Kernels

JupyterLite Kernels implement [Jupyter Kernel Messaging][jkm] in the browser with the
help of [`mock-socket`][mock-socket].

| Feature       | Message                                       | [pyolite](./pyolite.md) | [javascript](./js.md) | [p5](./p5.md) |
| ------------- | --------------------------------------------- | ----------------------- | --------------------- | ------------- |
|               | Language                                      | Python 3.8              | Browser JS            | JS + p5.js    |
| Start session | `kernel_info_request`<br/>`kernel_info_reply` | ✔️                      | ✔️                    | ✔️            | ✔️  |
| Run code      | `execute_request`<br/>`execute_reply`         | ✔️                      | ✔️                    | ✔️            | ✔️  |
| Completion    | `complete_request`<br/>`complete_reply`       | ✔️                      |                       |               |
| Custom Comms  | `comm_open`<br/>`comm_msg`<br/>`comm_close`   | ✔️                      |                       |               |
| History       | `history_request`<br/>`history_reply`         |                         |                       |               |

[jkm]: https://jupyter-client.readthedocs.io/en/stable/messaging.html
[mock-socket]: https://github.com/thoov/mock-socket

```{toctree}
:caption: JupyterLite Kernels
:maxdepth: 2
:hidden:

js
p5
pyolite
```
