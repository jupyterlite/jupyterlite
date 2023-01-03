"""A CLI for the subset of ``pip`` commands supported by ``micropip.install``.

As of the upstream:

    https://github.com/pyodide/micropip/blob/v0.2.0/micropip/_micropip.py#L468

.. code:

    async def install(
        requirements: str | list[str],
        keep_going: bool = False,                   # --verbose
        deps: bool = True,                          # --no-deps
        credentials: str | None = None,
        pre: bool = False,                          # --pre
    ) -> None:
```

As this is _not_ really a CLI, it doesn't bother with accurate return codes, and should
failures should not block execution.
"""
import re
import sys
import typing
from argparse import ArgumentParser
from pathlib import Path

REQ_FILE_PREFIX = r"^(-r|--requirements)\s*=?\s*(.*)\s*"

__all__ = ["get_transformed_code"]


def warn(msg):
    print(msg, file=sys.stderr, flush=True)


def _get_parser() -> ArgumentParser:
    """Build a pip-like CLI parser."""
    parser = ArgumentParser(
        "piplite",
        exit_on_error=False,
        allow_abbrev=False,
        description="a pip-like wrapper for `piplite` and `micropip`",
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="count",
        help="whether to print more output",
    )
    parser.add_argument(
        "--quiet", "-q", action="store_true", help="only show the minimum output"
    )

    parser.add_argument(
        "action", help="action to perform", default="help", choices=["help", "install"]
    )

    parser.add_argument(
        "--requirements",
        "-r",
        nargs="*",
        help="paths to requirements files",
    )
    parser.add_argument(
        "--no-deps",
        action="store_true",
        help="whether dependencies should be installed",
    )
    parser.add_argument(
        "--pre",
        action="store_true",
        help="whether pre-release packages should be considered",
    )
    parser.add_argument(
        "packages",
        nargs="*",
        type=str,
        default=[],
        help="package names (or wheel URLs) to install",
    )

    return parser


async def get_transformed_code(argv: list[str]) -> typing.Optional[str]:
    """Return a string of code for use in in-kernel execution."""
    action, kwargs = await get_action_kwargs(argv)

    if action == "help":
        pass
    if action == "install":
        if kwargs["requirements"]:
            return f"""await __import__("piplite").install(**{kwargs})\n"""
        else:
            warn("piplite needs at least one package to install")


async def get_action_kwargs(argv: list[str]) -> tuple[typing.Optional[str], dict]:
    """Get the arguments to `piplite` subcommands from CLI-like tokens."""

    parser = _get_parser()

    try:
        args = parser.parse_intermixed_args(argv)
    except (Exception, SystemExit):
        return None, {}

    kwargs = {}

    action = args.action

    if action == "install":

        kwargs["requirements"] = args.packages

        if args.pre:
            kwargs["pre"] = True

        if args.no_deps:
            kwargs["deps"] = False

        if args.verbose:
            kwargs["keep_going"] = True

        for req_file in args.requirements or []:
            kwargs["requirements"] += await _packages_from_requirements_file(
                Path(req_file)
            )

    return action, kwargs


async def _packages_from_requirements_file(req_path: Path) -> list[str]:
    """Extract (potentially nested) package requirements from a requirements file."""
    if not req_path.exists():
        warn(f"piplite could not find requirements file {req_path}")
        return []

    requirements = []

    for line_no, line in enumerate(req_path.read_text(encoding="utf").splitlines()):
        requirements += await _packages_from_requirements_line(
            req_path, line_no + 1, line
        )

    return requirements


async def _packages_from_requirements_line(
    req_path: Path, line_no: int, line: str
) -> list[str]:
    """Extract (potentially nested) package requirements from line of a requirements file.

    `micropip` has a sufficient pep508 implementation to handle most cases
    """
    req = line.strip().split("#")[0].strip()
    # is it another requirement file?
    req_file_match = re.match(REQ_FILE_PREFIX, req)
    if req_file_match:
        if req_file_match[2].startswith("/"):
            sub_req = Path(req)
        else:
            sub_req = req_path.parent / req_file_match[2]
        return await _packages_from_requirements_file(sub_req)

    if req.startswith("-"):
        warn(f"{req_path}:{line_no}: unrecognized requirement: {req}")
        req = None
    if not req:
        return []
    return [req]
