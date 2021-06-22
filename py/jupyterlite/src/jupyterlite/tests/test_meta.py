"""basic smoke tests of jupyterlite infrastructure"""
import jupyterlite


def test_is_documented():
    """TODO: improve the definition of documented"""
    assert jupyterlite.__doc__


def test_is_versioned():
    """TODO: test the version agrees with the version mangling from npm"""
    assert jupyterlite.__version__
