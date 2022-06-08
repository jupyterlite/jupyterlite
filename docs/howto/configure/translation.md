# Localization and language

Just like JupyterLab, JupyterLite provides the ability to set the
[display language](https://jupyterlab.readthedocs.io/en/stable/user/language.html) of
the user interface.

## Language Packs

To be able to provide a new display language, you will need to install a language pack.

Visit the [language packs repository](https://github.com/jupyterlab/language-packs) for
a list of available packs.

## Installing

JupyterLite follows the same installation procedure as in JupyterLab. Please refer to
the JupyterLab documentation to learn more on
[installing new language packs](https://jupyterlab.readthedocs.io/en/stable/user/language.html#installing).

If you already have a JupyterLite deployment, you can add the language packs as
dependencies.

For example to add support for French and Simplified Chinese in a `requirements.txt`:

```text
jupyterlab-language-pack-fr-FR
jupyterlab-language-pack-zh-CN
```

And then rebuild the website with `jupyter lite build`.

## Changing the display language

The steps to change the display language from the user interface are the same as for
JupyterLab:

[https://jupyterlab.readthedocs.io/en/stable/user/language.html#changing-the-display-language](https://jupyterlab.readthedocs.io/en/stable/user/language.html#changing-the-display-language)

All of the core JupyterLite [apps](../../quickstart/using.md#applications) support
localization:

![a screencast of selecting localization from the help menu](https://user-images.githubusercontent.com/591645/134638710-e99b9710-af61-43e0-856b-cb383b8e8181.gif 'JupyterLite and RetroLite localization')

## Ignoring language packs from the environment

It is also possible to ignore the language packs installed in an existing environment to
avoid side-effects when deploying the website.

In your `jupyter_lite_config.json` file, ignore the `translation` addon as follow:

```json
{
  "LiteBuildConfig": {
    "ignore_sys_prefix": ["translation"]
  }
}
```
