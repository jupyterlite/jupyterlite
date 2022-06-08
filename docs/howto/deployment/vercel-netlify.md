# Deploying on Vercel and Netlify

[Vercel][vercel] and [Netfliy][netlify] are popular hosted platforms for deploying
static website.

They make it easy and convenient to host static websites from existing git repositories,
and make them widely available via their CDN.

## Netlify

To deploy your own JupyterLite on Netlify, you can start from the [JupyterLite Demo] by
generating a new repository from the template.

Then add a `runtime.txt` file with `3.7` as the content to specify Python 3.7 as
dependency.

Finally specify `jupyter lite build --output-dir dist` as the "Build Command", and
`dist` as "Published Directory":

![netlify-build](https://user-images.githubusercontent.com/591645/124728917-4846c380-df10-11eb-8256-65e60dd3f258.png)

You might also want to specify the `--debug` flag to get extra log messages:

![deploy-logs](https://user-images.githubusercontent.com/591645/124779931-79d88280-df42-11eb-8f94-93d5715c18bc.png)

## Vercel

Just like Netlify, [Vercel](https://vercel.com) can connect to an existing git
repository and seamlessly deploy static files on push and PR events (previews).

Here the configuration is very similar to Netlify. You can specify the same
`jupyter lite build --output-dir dist` build command and configure `dist` as the
published directory.

## Using `micromamba` to create the build environment

The build environments of hosted platforms like Netlify and Vercel generally allow for
limited control on the Python version installed on the build machine.

This was the case for a while when their build image only included Python 3.6 while
JupyterLite requires Python 3.7+. This can be limiting in some cases, especially when
you want to have more control on the build.

Fortunately it is possible to run arbitrary bash scripts, which provides a convenient
escape hatch.

Specify the Python packages in a `requirements-deploy.txt` file with additional
dependencies if needed:

```text
jupyterlab~=3.4
jupyterlite
```

Then create a new `deploy.sh` file with the following content:

```bash
#!/bin/bash

yum install wget

wget -qO- https://micromamba.snakepit.net/api/micromamba/linux-64/latest | tar -xvj bin/micromamba

./bin/micromamba shell init -s bash -p ~/micromamba
source ~/.bashrc

# activate the environment and install a new version of Python
micromamba activate
micromamba install python=3.10 -c conda-forge -y

# install the dependencies
python -m pip install -r requirements-deploy.txt

# build the JupyterLite site
jupyter lite --version
jupyter lite build --output-dir dist
```

[Micromamba](https://github.com/mamba-org/mamba#micromamba) creates a new self-contained
environment, which makes it very convenient to install any required package without
being limited by the build image.

Then configure the build command and output directory, for example on Vercel:

![image](https://user-images.githubusercontent.com/591645/135726080-93ca6930-19de-4371-ad13-78f5716b7299.png)

You might also want to specify the `--debug` flag to get extra log messages:

```bash
jupyter lite build --debug
```

[vercel]: https://vercel.com
[netlify]: https://netlify.com
[jupyterlite demo]: https://github.com/jupyterlite/demo
