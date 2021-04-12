# JupyterLite

![Github Actions Status](https://github.com/jtpio/jupyterlite/workflows/Build/badge.svg)

JupyterLite is a JupyterLab distribution that runs entirely in the browser without a Jupyter Server, built from the ground-up with JupyterLab components and plugins.

The default JupyterLite distribution currently features:

- a JavaScript kernel running in an IFrame
- a basic Python kernel backed by [Pyodide](https://pyodide.org) running in a Web Worker
- offline notebook storage in the browser
- basic session and kernel management to have multiple kernels running at once
- support for code consoles

## Try it in your browser

**✨ [Try it in your browser!](https://jupyterlite.vercel.app/) ✨**

![image](https://user-images.githubusercontent.com/591645/114009512-7fe79600-9863-11eb-9aac-3a9ef6345011.png)

## Status

⚠️ Currently in active development ⚠️

## Dev install

Make sure [Node.js](https://nodejs.org) is installed.

Then run the following commands:

```bash
# install the dependencies
yarn

# build the app
yarn run build

# go to the app folder
cd app/

# start a local http server
npx http-server
```

Then go to http://localhost:5000 in a web browser to start JupyterLite.

## Related

JupyterLite is a reboot of several attemps at making a full static Jupyter distribution that runs in the browser, without having to start the Python Jupyter Server on the host machine.

The goal is to provide a lightweight computing environment accessible in a matter of seconds with a single click, in a web browser and without having to install anything.

This project is a collection of packages that can be remixed together in variety of ways to create new application and distributions. Most of the packages in this repo focus on providing server-like components that run in the browser (to manager kernels, files and settings), so existing JupyterLab extensions and plugins can be reused out of the box.

See also:

- [p5-notebook](https://github.com/jtpio/p5-notebook): A minimal Jupyter Notebook UI for p5.js kernels running in the browser
- [jyve](https://github.com/deathbeds/jyve): Jupyter Kernels, right inside JupyterLab
- [Starboard Notebook](https://github.com/gzuidhof/starboard-notebook): In-browser literal notebooks
