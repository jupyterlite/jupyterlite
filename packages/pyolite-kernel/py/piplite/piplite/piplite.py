"""A ``micropip`` wrapper aware of jupyterlite conventions.

    import piplite
    await piplite.install("a-package")

    `pyolite` also includes a browser shim for the IPython `%pip` magic

"""
import asyncio
import json
from unittest.mock import patch

from micropip import _micropip
from micropip._micropip import _get_pypi_json as _MP_GET_PYPI_JSON
from micropip._micropip import fetch_string as _MP_FETCH_STRING

#: a list of Warehouse-like API endpoints or derived multi-package all.json
_PIPLITE_URLS = []

#: a cache of available packages
_PIPLITE_INDICES = {}

#: don't fall back to pypi.org if a package is not found in _PIPLITE_URLS
_PIPLITE_DISABLE_PYPI = False

#: a well-known file name respected by the rest of the build chain
ALL_JSON = "/all.json"


class PiplitePyPIDisabled(ValueError):
    """An error for when PyPI is disabled at the site level, but a download was attempted."""

    pass


async def _get_pypi_json_from_index(pkgname, piplite_url, fetch_kwargs):
    """Attempt to load a specific ``pkgname``'s releases from a specific piplite
    URL's index.
    """
    index = _PIPLITE_INDICES.get(piplite_url, {})

    if not index:
        try:
            index = json.loads(await _MP_FETCH_STRING(piplite_url, fetch_kwargs))
            _PIPLITE_INDICES.update({piplite_url: index})
        except Exception:
            pass

    pkg = dict((index or {}).get(pkgname) or {})

    if not pkg:
        return None

    # rewrite local paths
    for release in pkg["releases"].values():
        for artifact in release:
            if artifact["url"].startswith("."):
                artifact["url"] = (
                    f"""{piplite_url.split(ALL_JSON)[0]}/{artifact["url"]}"""
                    # can't add cache busting because micropip 0.21 checks `endswith`
                    # f"""?sha256={artifact["digests"]["sha256"]}"""
                )

    return pkg


async def _get_pypi_json(pkgname, fetch_kwargs):
    """Fetch the warehoust API metadata for a specific ``pkgname``."""

    for piplite_url in _PIPLITE_URLS:
        if piplite_url.split("?")[0].split("#")[0].endswith(ALL_JSON):
            pypi_json_from_index = await _get_pypi_json_from_index(
                pkgname, piplite_url, fetch_kwargs
            )
            if pypi_json_from_index:
                return pypi_json_from_index
            continue
        else:
            try:
                url = f"{piplite_url}{pkgname}/json"
                return json.loads(await _MP_FETCH_STRING(url, fetch_kwargs))
            except Exception:
                pass

    if _PIPLITE_DISABLE_PYPI:
        raise PiplitePyPIDisabled(
            f"{pkgname} could not be installed: PyPI fallback is disabled"
        )

    return await _MP_GET_PYPI_JSON(pkgname, fetch_kwargs)


async def _install(
    requirements: str | list[str],
    keep_going: bool = False,
    deps: bool = True,
    credentials: str | None = None,
    pre: bool = False,
):
    """Invoke micripip.install with a patch to get data from local indexes"""
    with patch("micropip._micropip._get_pypi_json", _get_pypi_json):
        return await _micropip.install(
            requirements=requirements,
            keep_going=keep_going,
            deps=deps,
            credentials=credentials,
            pre=pre,
        )


def install(
    requirements: str | list[str],
    keep_going: bool = False,
    deps: bool = True,
    credentials: str | None = None,
    pre: bool = False,
):
    """Install the given package and all of its dependencies.
    See :ref:`loading packages <loading_packages>` for more information.
    If a package is not found in the Pyodide repository it will be loaded from
    a piplite URL. If a package is not found in the piplite URL, it will be
    loaded from PyPI. Piplite can only load pure Python packages or for packages
    with C extensions that are built for Pyodide.
    When used in web browsers, downloads from PyPI will be cached.
    Parameters
    ----------
    requirements : ``str | List[str]``
        A requirement or list of requirements to install. Each requirement is a
        string, which should be either a package name or a wheel URI:
        - If the requirement does not end in ``.whl``, it will be interpreted as
          a package name. A package with this name must either be present
          in the Pyodide lock file or on PyPI.
        - If the requirement ends in ``.whl``, it is a wheel URI. The part of
          the requirement after the last ``/``  must be a valid wheel name in
          compliance with the `PEP 427 naming convention
          <https://www.python.org/dev/peps/pep-0427/#file-format>`_.
        - If a wheel URI starts with ``emfs:``, it will be interpreted as a path
          in the Emscripten file system (Pyodide's file system). E.g.,
          `emfs:../relative/path/wheel.whl` or `emfs:/absolute/path/wheel.whl`.
          In this case, only .whl files are supported.
        - If a wheel URI requirement starts with ``http:`` or ``https:`` it will
          be interpreted as a URL.
    keep_going : ``bool``, default: False
        This parameter decides the behavior of the piplite when it encounters a
        Python package without a pure Python wheel while doing dependency
        resolution:
        - If ``False``, an error will be raised on first package with a missing
          wheel.
        - If ``True``, the piplite will keep going after the first error, and
          report a list of errors at the end.
    deps : ``bool``, default: True
        If ``True``, install dependencies specified in METADATA file for each
        package. Otherwise do not install dependencies.
    credentials : ``Optional[str]``
        This parameter specifies the value of ``credentials`` when calling the
        `fetch() <https://developer.mozilla.org/en-US/docs/Web/API/fetch>`__
        function which is used to download the package.
        When not specified, ``fetch()`` is called without ``credentials``.
    pre : ``bool``, default: False
        If ``True``, include pre-release and development versions. By default,
        piplite only finds stable versions.
    Returns
    -------
    ``Future``
        A ``Future`` that resolves to ``None`` when all packages have been
        downloaded and installed.
    """
    return asyncio.ensure_future(
        _install(
            requirements=requirements,
            keep_going=keep_going,
            deps=deps,
            credentials=credentials,
            pre=pre,
        )
    )


__all__ = ["install"]
