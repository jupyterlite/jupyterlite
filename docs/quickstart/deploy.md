# Deploy your first JupyterLite website on GitHub Pages

```{hint}
If you first want to get familiar with the interface, check out the [User Guide](./using.md).
```

JupyterLite can easily be deployed on [GitHub Pages], using the `jupyterlite` CLI to add
content and extensions.

```{note}
Deploying to GitHub Pages requires a Github account.
```

## Generate a new repository from the template

The [jupyterlite demo] repository is a template to easily:

- build a JupyterLite website using prebuilt JupyterLite assets bundling a collection of
  pre-existing Jupyter Notebooks as part of the distribution
- deploy the website to GitHub Pages

The process is automated using Github Actions.

Click on "Use this template" to generate a repository of your own from this template:

![an animated gif to show how to use the provide repo template to generate a new website](https://user-images.githubusercontent.com/21197331/125816904-5768008a-77de-4cb3-8013-f3999b135c02.gif)

From the _Actions_ tab on your repository, ensure that workflows are enabled. When you
make a commit to the `main` branch, a Github Action will build your JupyterLite release
and deploy it to the repository's Github Pages. By default, the Github Pages site will
be found at `YOUR_GITHUB_USERNAME.github.io/YOUR_REPOSITORY-NAME`. _You can also check
the URL from the Repository `Settings` tab `Pages` menu item._

If the deployment failed, go to "Settings - Actions - General", in the "Workflow
permissions" section, check "Read and write permissions". Check that you have Github
Pages enabled for your repository: from your repository _Settings_ tab, select the
_Pages_ menu item and ensure that the source is set to `GitHub Actions`:

![a screenshot showing the GitHub Actions configuration option for deploying to GitHub Pages](https://user-images.githubusercontent.com/591645/183384744-d7e08150-8f5f-4a50-bd53-5c99b1fd99a1.png)

When you commit a file, an updated website will be built and published on Github Pages.

```{note}
Note that it may take a few minutes for the Github Pages site to be updated. Do a hard
refresh on your Github Pages site in your web browser to see the new version of the
website.
```

## Accessing the JupyterLite website

After the build has completed, the site will be available on GitHub Pages. Go to
`https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPOSITORY-NAME` to access it:

![an animated screencast of using a JupyterLite website on GitHub Pages](https://user-images.githubusercontent.com/591645/120649478-18258400-c47d-11eb-80e5-185e52ff2702.gif)

```{note}
By default the deployment provided by the `jupyterlite/demo` repo includes a `.nojekyll` file
to bypass Jekyll processing on GitHub Pages.

See this [blog post](https://github.blog/2009-12-29-bypassing-jekyll-on-github-pages/) for more information.
```

## Deploy a new version of JupyterLite

To change the version of the prebuilt JupyterLite assets, update the `jupyterlite`
package version in the `requirements.txt` file.

Commit and push the changes. The site will be deployed on the next push to the `main`
branch.

## Add additional requirements to the deployment

### Extensions

The `requirements.txt` file can be used to add extra prebuilt (also called _federated_)
JupyterLab extensions to the deployed JupyterLite website. Follow the
[extension guide](../howto/configure/simple_extensions.md) to learn more.

### Contents

You can add and update the default notebooks and files by clicking on the `contents`
directory and dragging notebooks from your desktop onto the contents listing. Wait for
the files to be uploaded and then save them (commit them) to the `main` branch of the
repository.

Check out the how-to guide on [managing content](../howto//content/files.md) to learn
more.

## Further Information

If you would like to customize your JupyterLite website, check out the different
[how-to guides](../howto/index.md).

[jupyterlite demo]: https://github.com/jupyterlite/demo
[github pages]: https://pages.github.com/
