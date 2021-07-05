"""pytest configuration for jupyterlite"""

import shutil
import time
import warnings

import pytest

from jupyterlite.constants import ALL_APP_ARCHIVES, NPM_SOURCE_DATE_EPOCH


@pytest.fixture
def an_empty_lite_dir(tmp_path):
    lite_dir = tmp_path / "a_lite_dir"
    lite_dir.mkdir()
    yield lite_dir
    try:
        shutil.rmtree(lite_dir)
    except Exception as err:
        warnings.warn(f"failed to clean up {lite_dir}: {err}")


@pytest.fixture
def source_date_epoch():
    """get a SOURCE_DATE_EPOCH

    loosely derived from https://reproducible-builds.org/docs/source-date-epoch/#python
    """
    now = int(time.time())
    print("SOURCE_DATE_EPOCH is", now)
    return f"{now}"


@pytest.fixture(params=sorted(ALL_APP_ARCHIVES))
def a_lite_app_archive(request):
    return request.param


@pytest.fixture
def the_npm_source_date_epoch():
    return NPM_SOURCE_DATE_EPOCH


@pytest.fixture
def a_simple_lite_ipynb():
    from nbformat.v4 import new_notebook, writes

    nb = new_notebook(
        metadata={
            "jupyter-lite": {
                "jupyter-config-data": {
                    "federated_extensions": [
                        {
                            "extension": "./extension",
                            "load": "static/remoteEntry.abc123.js",
                            "name": "@org/pkg",
                        }
                    ],
                    "disabledExtensions": ["@org/pkg"],
                    "settingsOverrides": {},
                }
            }
        }
    )
    return writes(nb)
