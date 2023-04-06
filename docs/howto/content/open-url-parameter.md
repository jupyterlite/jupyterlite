# Open a file from an external URL

```{warning}
The third-party extension mentioned in this guide is not included in JupyterLite by default.
There might other JupyterLab extensions that can achieve the same behavior that
you might want to consider.
```

By default in JupyterLite it is not possible to open a file from an external URL.

However you can install the
[jupyterlite-open-url-parameter](https://github.com/jupyterlab-contrib/jupyterlab-open-url-parameter)
extension to enable this feature.

In your build environment, install the extension:

```shell
pip install jupyterlite-open-url-parameter
```

Then build your JupyterLite site as usual:

```shell
jupyter lite build
```

The extension should be automatically enabled in your site.

The extension will open a file passed via a URL parameter. The URL parameter is
`fromURL`. It is possible to pass multiple files via the `fromURL` parameter. The files
will be opened in the order they are passed.

For example if you would like to open a notebook and a csv file:

- https://raw.githubusercontent.com/jupyterlab/jupyterlab-demo/master/notebooks/Lorenz.ipynb
- https://raw.githubusercontent.com/jupyterlab/jupyterlab-demo/master/data/iris.csv

You can append the following to the URL of your JupyterLab instance:
`?fromURL=https://raw.githubusercontent.com/jupyterlab/jupyterlab-demo/master/notebooks/Lorenz.ipynb&fromURL=https://raw.githubusercontent.com/jupyterlab/jupyterlab-demo/master/data/iris.csv`

Which will result in the following URL:

```
http://your-jupyterlite.example.com/lab?fromURL=https://raw.githubusercontent.com/jupyterlab/jupyterlab-demo/master/data/iris.csv&fromURL=https://raw.githubusercontent.com/jupyterlab/jupyterlab-demo/master/notebooks/Lorenz.ipynb
```

![a screenshot showing how to use the jupyterlab-open-url-parameter extension](https://user-images.githubusercontent.com/591645/230444694-5297f8b7-4558-4a9c-bb05-918e1cdde3bc.gif)

## References

Check out the [guide for adding extensions](../configure/simple_extensions.md) to learn
more about how to add extensions to your JupyterLite site.
