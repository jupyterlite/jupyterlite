# Making changes to a JupyterLite website hosted on GitHub Pages

```{note}
This guide assumes you already have a JupyterLite website hosted on GitHub Pages.

If that's not the case, check out the [quickstart guide](../../quickstart/deploy.md) to learn how to deploy JupyterLite on GitHub Pages.
```

## Making changes to the website

If the dependencies are listed in a `requirements.txt` file, edit the file to make your
changes.

For example let's say you want to add the `jupyterlab-night` theme to your deployment.
Open `requirements.txt` and add the following line:

```text
# other dependencies for building the JupyterLite website
jupyterlite-core
# ...

# add the jupyterlab-night theme
jupyterlab-night
```

## Opening a pull request

Once you are done making changes, commit your changes and push them to GitHub.

Then open a new pull request. Opening the pull request will trigger a new build of the
JupyterLite website and produce the static assets that will be hosted on GitHub Pages
after merging the pull request into the `main` branch.

You can inspect the content of the new build by clicking on the "Details" link of the
check:

![a screenshot showing the list of GitHub checks running on CI](https://user-images.githubusercontent.com/591645/226565410-8d83cc0f-9929-4620-ae57-815482ada5e5.png)

Then click on `Summary` to see the list of artifacts produced by the build:

![a screenshot showing how to click on the GitHub Actions summary page](https://user-images.githubusercontent.com/591645/226567521-c46d1dfe-dbd7-4f70-acd8-5df3030ed636.png)

## Inspecting the new version of the website

Download the artifacts and extract it locally. Open a new terminal and run the following
command to start a local web server:

```bash
python -m http.server
```

Then open the following URL in your browser:

```text
http://localhost:8000
```

You should see the new version of your JupyterLite website:

![a screenshot showing the new JupyterLab theme now available via the Settings menu](https://user-images.githubusercontent.com/591645/226567988-dbfafffb-c4f9-4319-9687-46befcd0dbf6.png)

If the changes look good, you can merge the pull request. The GitHub Pages website will
be updated automatically a few minutes after.
