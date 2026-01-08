#!/usr/bin/env python
"""Post-process typedoc output to add Sphinx toctree directives.

This script adds a toctree to the TypeScript API README.md that includes all
generated markdown files.
"""

from pathlib import Path

ROOT = Path(__file__).parent.parent
DOCS_TS = ROOT / "docs" / "reference" / "api" / "ts"
README = DOCS_TS / "README.md"


def main():
    """Add toctree directive to TypeScript API README."""
    if not README.exists():
        print(f"[skip] {README} does not exist, skipping post-processing")
        return

    # Find all markdown files except the main README
    all_docs = sorted(DOCS_TS.rglob("*.md"))
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
