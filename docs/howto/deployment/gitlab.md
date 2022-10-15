# Deploying on GitLab Pages

Just like with GitHub Pages, JupyterLite can easily be deployed on GitLab Pages, using
the `jupyterlite` CLI and setting the `output_path` to the `public` folder in your
`.gitlab-ci.yml` file.

Suppose that your notebooks are stored in the `content` folder; and you don't require
any additional python dependencies and configuration overrides, the `.gitlab-ci.yml`
could look like.

```
image: python
pages:
  stage: deploy
  before_script:
    - python -m pip install jupyterlite
  script:
    - jupyter lite build --contents content --output-dir public
  artifacts:
    paths:
      - public # mandatory, other folder won't work
  only:
    - main # the branch you want to publish
```

```{hint}
When you're looking for a JupyterLite GitLab template, there is a [minimal example](https://gitlab.gwdg.de/crc1456/livedocs/jupyterlite-minimal-example) and a [more involved example](https://gitlab.com/benabel/jupyterlite-template).

[gitlab pages template]: https://gitlab.com/benabel/jupyterlite-template
```
