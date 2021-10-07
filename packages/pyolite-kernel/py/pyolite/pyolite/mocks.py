"""Mocks installed directly into sys.modules"""
import sys
import types


def mock_recursion_limit():
    """Set the recursion limit as early as possible, needed for altair
    for more details, see:
        https://github.com/jupyterlite/jupyterlite/pull/113#issuecomment-851072065
    """
    sys.setrecursionlimit(max(170, sys.getrecursionlimit()))


def mock_termios():
    termios_mock = types.ModuleType("termios")
    termios_mock.TCSAFLUSH = 2

    sys.modules["termios"] = termios_mock


def mock_fcntl():
    sys.modules["fcntl"] = types.ModuleType("fcntl")


def mock_resource():
    sys.modules["resource"] = types.ModuleType("resource")


def mock_tornado():
    """This is needed for some Matplotlib backends (webagg, ipympl) and plotly"""

    # Appease plotly -> tenacity -> tornado.gen usage
    gen = sys.modules["tornado.gen"] = types.ModuleType("gen")
    gen.coroutine = lambda *args, **kwargs: args[0]
    gen.sleep = lambda *args, **kwargs: None
    gen.is_coroutine_function = lambda *args: False

    tornado = sys.modules["tornado"] = types.ModuleType("tornado")
    tornado.gen = gen


# order is probably important
ALL_MOCKS = [
    mock_recursion_limit,
    mock_termios,
    mock_fcntl,
    mock_resource,
    mock_tornado,
]


def apply_mocks():
    """apply all of the mocks, if possible"""
    import warnings

    for mock in ALL_MOCKS:
        try:
            mock()
        except Exception as err:
            warnings.warn("failed to apply mock", mock, err)
