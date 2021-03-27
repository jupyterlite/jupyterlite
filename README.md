# jupyterlite

![Github Actions Status](https://github.com/jtpio/jupyterlite/workflows/Build/badge.svg)

JupyterLite is a JupyterLab distribution that runs entirely in the browser without a Jupyter Server.

## Dev install

Make sure [Node.js](https://nodejs.org) is installed.

Then run the following commands:

```bash
# install the dependencies
yarn

# build the app
yarn run build

# start a local http server
npx http-server
```

Then go to http://localhost:5000 in a web browser to start JupyterLite.
