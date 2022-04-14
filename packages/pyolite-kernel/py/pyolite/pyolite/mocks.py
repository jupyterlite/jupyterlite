"""Mocks installed directly into sys.modules"""
import sys
import types


def mock_fcntl():
    sys.modules["fcntl"] = types.ModuleType("fcntl")


def mock_pexpect():
    pexpect_mock = types.ModuleType("pexpect")
    sys.modules["pexpect"] = pexpect_mock


def mock_resource():
    sys.modules["resource"] = types.ModuleType("resource")


def mock_termios():
    termios_mock = types.ModuleType("termios")
    termios_mock.TCSAFLUSH = 2

    sys.modules["termios"] = termios_mock


def mock_tornado():
    """This is needed for some Matplotlib backends (webagg, ipympl) and plotly"""

    # Appease plotly -> tenacity -> tornado.gen usage
    gen = sys.modules["tornado.gen"] = types.ModuleType("gen")
    gen.coroutine = lambda *args, **kwargs: args[0]
    gen.sleep = lambda *args, **kwargs: None
    gen.is_coroutine_function = lambda *args: False

    tornado = sys.modules["tornado"] = types.ModuleType("tornado")
    tornado.gen = gen


ALL_MOCKS = [
    mock_termios,
    mock_fcntl,
    mock_resource,
    mock_tornado,
    mock_pexpect,
]


def apply_mocks():
    """apply all of the mocks, if possible"""
    import warnings

    for mock in ALL_MOCKS:
        try:
            mock()
        except Exception as err:
            warnings.warn("failed to apply mock", mock, err)
