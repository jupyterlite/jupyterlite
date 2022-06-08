# Create a custom kernel

```{hint}
We recommend checking out how to create a server extension first: [](./server.md)
```

## Bootstrap the server extension

Creating a new kernel is very similar to creating a [server extension](./server.md).

Once you have your server extension set up, add the following plugin to register the
kernel:

```ts
/**
 * A plugin to register the custom kernel.
 */
const kernel: JupyterLiteServerPlugin<void> = {
  id: 'my-custom-kernel:plugin',
  autoStart: true,
  requires: [IKernelSpecs],
  activate: (app: JupyterLiteServer, kernelspecs: IKernelSpecs) => {
    kernelspecs.register({
      spec: {
        name: 'custom',
        display_name: 'Custom Kernel',
        language: 'text',
        argv: [],
        resources: {
          'logo-32x32': '',
          'logo-64x64': '',
        },
      },
      create: async (options: IKernel.IOptions): Promise<IKernel> => {
        return new CustomKernel(options);
      },
    });
  },
};
```

## The Echo Kernel example

As an alternative, a quick way to bootstrap a new kernel is to start from an existing
one.

The [jupyterlite-echo-kernel] is an example kernel that returns what the user submits as
input:

![echo-kernel-demo]

It is simple and is meant for demo purposes.

If you want to start from that kernel:

1. For the [repo][jupyterlite-echo-kernel]
2. Follow the dev instructions to build the kernel locally
3. Once the local setup is ready, you can iterate on the actual logic of the kernel and
   start implementing the protocol

[jupyterlite-echo-kernel]: https://github.com/jupyterlite/echo-kernel
[echo-kernel-demo]:
  https://user-images.githubusercontent.com/591645/135660177-13f909fb-b63b-4bc9-9bf3-e2b6c37ee015.gif

## Examples

For inspiration you can also check the other JupyterLite kernels:

- [Xeus Python](https://github.com/jupyterlite/xeus-python-kernel)
- [Xeus Lua](https://github.com/jupyterlite/xeus-lua-kernel)
- [Xeus SQLite](https://github.com/jupyterlite/xeus-sqlite-kernel)
- [p5.js](https://github.com/jupyterlite/p5-kernel)
