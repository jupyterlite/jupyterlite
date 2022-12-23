import json
import sys
from unittest import mock

import pytest
from traitlets import Int

from jupyterlite.addons.base import BaseAddon
from jupyterlite.app import LiteStatusApp
from jupyterlite.manager import LiteManager

PY_LT_310 = sys.version_info < (3, 10)

MOCK_ALIASES = {"some-other-feature": "MockAddon.some_other_feature"}


def test_extend_addon_config(an_empty_lite_dir, a_configured_mock_addon, capsys):
    app = LiteStatusApp(log_level="DEBUG")
    # it might be nice to make this a function
    app.aliases.update(MOCK_ALIASES)
    app.initialize(argv=["--some-other-feature=1"])
    manager = app.lite_manager

    assert len(manager._addons) == 1
    addon = manager._addons["mock"]
    assert addon.parent == manager, "not the parent"

    assert addon.some_feature == 42, "didn't configure"
    assert addon.some_other_feature == 1, "didn't configure"

    with pytest.raises(SystemExit) as exit:
        app.start()

    assert exit.type == SystemExit
    assert exit.value.code == 0
    cap = capsys.readouterr()
    assert "hello world" in cap.out


@pytest.fixture
def a_configured_mock_addon(only_a_mock_addon, an_empty_lite_dir, monkeypatch):
    config = {
        "LiteBuildConfig": {"ignore_sys_prefix": ["federated_extensions"]},
        "MockAddon": {"some_feature": 42},
    }
    conf = an_empty_lite_dir / "jupyter_lite_config.json"
    conf.write_text(json.dumps(config), encoding="utf-8")
    monkeypatch.chdir(an_empty_lite_dir)
    yield config


@pytest.fixture
def only_a_mock_addon():
    class MockAddon(BaseAddon):
        __all__ = ["status"]

        aliases = MOCK_ALIASES

        some_feature = Int(0).tag(config=True, help="some feature!")
        some_other_feature = Int(0).tag(config=True, help="some other feature!")

        def status(self, manager):
            yield dict(name="hello:world", actions=[lambda: print("hello world")])

    group = {"mock": MockAddon}

    with mock.patch.object(LiteManager, "_addon_implementations", return_value=group):
        yield
