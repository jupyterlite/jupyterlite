"""A CLI for the subset of ``pip`` commands supported by ``micropip.install``.

As of the upstream:

    https://github.com/pyodide/pyodide/blob/0.21.3/packages/micropip/src/micropip/_micropip.py#L440

.. code:

    async def install(
        requirements: str | list[str],
        keep_going: bool = False,                   # --verbose
        deps: bool = True,                          # --no-deps
        credentials: str | None = None,
        pre: bool = False,                          # --pre
    ) -> None:
```
"""
import re
from argparse import ArgumentParser
from pathlib import Path
from warnings import warn

import piplite

REQ_FILE_PREFIX = r"^(-r|--requirements)\s*=?\s*(.*)\s*"


def _get_parser():
    parser = ArgumentParser("piplite", exit_on_error=False)
    parser.add_argument("--version", action="version", version=piplite.__version__)
    actions = parser.add_subparsers(title="actions")

    install = actions.add_parser("install")
    install.add_argument(
        "packages", nargs="*", help="package names (or wheel URLs) to install"
    )
    install.add_argument(
        "--requirements",
        "-r",
        nargs="*",
        help="paths to requirements files",
    )
    install.add_argument(
        "--no-deps",
        action="store_true",
        help="whether dependencies should be installed",
    )
    install.add_argument(
        "--pre",
        action="store_true",
        help="whether pre-release packages should be considered",
    )
    install.add_argument(
        "--verbose", action="store_true", help="whether to print more output"
    )
    install.add_argument(
        "--quiet", "-q", action="store_true", help="only show the minimum output"
    )
    return parser


async def main(argv: list[str]):
    """Emulate the CLI behavior of `pip`"""
    install_kwargs = await get_install_kwargs(argv)
    return await piplite.install(**install_kwargs)


async def get_install_kwargs(argv: list[str]):
    """Get the arguments to `piplite.install` from CLI-like tokens."""

    args = _get_parser().parse_args(argv)

    install_kwargs = {}

    requirements = args.packages

    if args.pre:
        install_kwargs["pre"] = True

    if args.no_deps:
        install_kwargs["deps"] = False

    if args.verbose:
        install_kwargs["keep_going"] = True

    for req_file in args.requirements or []:
        requirements += await _packages_from_requirements_file(Path(req_file))

    return {"requirements": requirements, **install_kwargs}


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
    """Extract (potentially nested) package requirements from line of a requirements file."""
    req = line.strip().split("#")[0].strip()
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
