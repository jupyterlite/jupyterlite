#!/usr/bin/env python
# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

"""Post-process typedoc output for Sphinx.

This script adds a toctree to the TypeScript API README.md that includes all
generated markdown files, and normalizes the heading levels of the generated
markdown so MyST does not warn about non-consecutive heading levels.
"""

import re
from pathlib import Path

ROOT = Path(__file__).parent.parent
DOCS_TS = ROOT / "docs" / "reference" / "api" / "ts"
README = DOCS_TS / "README.md"

HEADING = re.compile(r"^(#{1,6})([ \t].*)$")


def normalize_headings(text: str) -> str:
    """Clamp heading level increases to one level at a time.

    Headings written in upstream docstrings (e.g. ``### Note``) end up nested
    under deeper typedoc headings, and MyST warns on jumps such as H3 to H5.
    """
    lines = []
    previous = 0
    in_code = False
    for line in text.splitlines(keepends=True):
        body = line.rstrip("\r\n")
        if body.startswith("```"):
            in_code = not in_code
        match = None if in_code else HEADING.match(body)
        if not match:
            lines.append(line)
            continue
        level = len(match.group(1))
        if previous:
            level = min(level, previous + 1)
        lines.append("#" * level + match.group(2) + line[len(body) :])
        previous = level
    return "".join(lines)


def main():
    """Normalize headings and add the toctree directive to the TypeScript API README."""
    if not README.exists():
        print(f"[skip] {README} does not exist, skipping post-processing")
        return

    # Find all markdown files except the main README
    all_docs = sorted(DOCS_TS.rglob("*.md"))
    for doc in all_docs:
        text = doc.read_text(encoding="utf-8")
        normalized = normalize_headings(text)
        if normalized != text:
            doc.write_text(normalized, encoding="utf-8")
            print(f"[ok] Normalized heading levels in {doc.relative_to(ROOT)}")
    relative_docs = [
        str(doc.relative_to(DOCS_TS).with_suffix("")) for doc in all_docs if doc != README
    ]

    if not relative_docs:
        print("[skip] No markdown files found")
        return

    # Read current README content
    readme_text = README.read_text(encoding="utf-8")

    # Check if toctree already exists
    if "```{toctree}" in readme_text:
        print("[skip] Toctree already exists in README")
        return

    # Add toctree at the end
    toctree_entries = "\n".join(relative_docs)
    toctree = f"""

```{{toctree}}
:hidden:
:maxdepth: 1

{toctree_entries}
```
"""

    README.write_text(readme_text + toctree, encoding="utf-8")
    print(f"[ok] Added toctree with {len(relative_docs)} entries to {README}")


if __name__ == "__main__":
    main()
