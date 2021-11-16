import asyncio
import importlib
import json
from typing import List, Union
from unittest.mock import patch

from micropip.micropip import PACKAGE_MANAGER as _MP_PACKAGE_MANAGER
from micropip.micropip import _get_pypi_json as _MP_GET_PYPI_JSON
from micropip.micropip import _get_url as _MP_GET_URL

#: a list of Warehouse-like API endpoints or derived multi-package all.json
_PIPLITE_URLS = []

# a cache of available packages
_PIPLITE_INDICES = {}

#: a well-known file name respected by the rest of the buld chain
ALL_JSON = "/all.json"


async def _get_pypi_json_from_index(pkgname, piplite_url):
    index = _PIPLITE_INDICES.get(piplite_url, {})
    if not index:
        try:
            fd = await _MP_GET_URL(piplite_url)
            index = json.load(fd)
            _PIPLITE_INDICES.update({piplite_url: index})
        except Exception:
            pass

    pkg = dict((index or {}).get(pkgname) or {})

    if not pkg:
        return None

    # rewrite local paths, add cache busting
    for release in pkg["releases"].values():
        for artifact in release:
            if artifact["url"].startswith("."):
                artifact["url"] = (
                    f"""{piplite_url.split(ALL_JSON)[0]}/{artifact["url"]}"""
                    f"""?sha256={artifact["digests"]["sha256"]}"""
                )

    return pkg


async def _get_pypi_json(pkgname):
    for piplite_url in _PIPLITE_URLS:
        if piplite_url.split("?")[0].split("#")[0].endswith(ALL_JSON):
            pypi_json_from_index = await _get_pypi_json_from_index(pkgname, piplite_url)
            if pypi_json_from_index:
                return pypi_json_from_index
            continue
        else:
            try:
                url = f"{piplite_url}{pkgname}/json"
                fd = await _MP_GET_URL(url)
                return json.load(fd)
            except Exception:
                pass

    return await _MP_GET_PYPI_JSON(pkgname)


class _PackageManager:
    async def install(self, requirements: Union[str, List[str]], ctx=None):
        with patch("micropip.micropip._get_pypi_json", _get_pypi_json):
            return await _MP_PACKAGE_MANAGER.install(requirements, ctx)


# Make PACKAGE_MANAGER singleton
PACKAGE_MANAGER = _PackageManager()
del _PackageManager


def install(requirements: Union[str, List[str]]):
    """Install the given package and all of its dependencies.
    See :ref:`loading packages <loading_packages>` for more information.
    This only works for packages that are either pure Python or for packages
    with C extensions that are built in Pyodide. If a pure Python package is not
    found in the Pyodide repository it will be loaded from one of
    `indexURL <globalThis.pipliteUrls>` or PyPI.

    Parameters
    ----------
    requirements : ``str | List[str]``
        A requirement or list of requirements to install. Each requirement is a
        string, which should be either a package name or URL to a wheel:
        - If the requirement ends in ``.whl`` it will be interpreted as a URL.
          The file must be a wheel named in compliance with the
          `PEP 427 naming convention <https://www.python.org/dev/peps/pep-0427/#file-format>`_.
        - If the requirement does not end in ``.whl``, it will interpreted as the
          name of a package. A package by this name must either be present in the
          Pyodide repository at `indexURL <globalThis.loadPyodide>` or on PyPi
    Returns
    -------
    ``Future``
        A ``Future`` that resolves to ``None`` when all packages have been
        downloaded and installed.
    """
    importlib.invalidate_caches()
    return asyncio.ensure_future(PACKAGE_MANAGER.install(requirements))


__all__ = ["install"]
