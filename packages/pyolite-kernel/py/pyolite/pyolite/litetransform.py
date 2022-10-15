"""A custom pre-transformer for cells.

Derived from:

   https://github.com/ipython/ipython/blob/8.5.0/IPython/core/inputtransformer2.py
"""
import re
import shlex

from IPython.core.inputtransformer2 import (
    TRANSFORM_LOOP_LIMIT,
    TokenTransformBase,
    TransformerManager,
    make_tokens_by_line,
)


class LiteTransformerManager(TransformerManager):
    def __init__(self):
        super().__init__()
        self.cleanup_transforms = []
        self.line_transforms = [pip_magic]
        self.token_transformers = []

    async def transform_cell(self, cell: str) -> str:
        """Transforms a cell of input code"""
        if not cell.endswith("\n"):
            cell += "\n"  # Ensure the cell has a trailing newline
        lines = cell.splitlines(keepends=True)
        for transform in self.cleanup_transforms + self.line_transforms:
            lines = await transform(lines)

        lines = await self.do_token_transforms(lines)
        return "".join(lines)

    async def do_token_transforms(self, lines):
        for _ in range(TRANSFORM_LOOP_LIMIT):
            changed, lines = await self.do_one_token_transform(lines)
            if not changed:
                return lines

        raise RuntimeError(
            "Input transformation still changing after "
            "%d iterations. Aborting." % TRANSFORM_LOOP_LIMIT
        )

    async def do_one_token_transform(self, lines):
        """Find and run the transform earliest in the code.
        Returns (changed, lines).
        This method is called repeatedly until changed is False, indicating
        that all available transformations are complete.
        The tokens following IPython special syntax might not be valid, so
        the transformed code is retokenised every time to identify the next
        piece of special syntax. Hopefully long code cells are mostly valid
        Python, not using lots of IPython special syntax, so this shouldn't be
        a performance issue.
        """
        tokens_by_line = make_tokens_by_line(lines)
        candidates = []
        for transformer_cls in self.token_transformers:
            transformer = transformer_cls.find(tokens_by_line)
            if transformer:
                candidates.append(transformer)

        if not candidates:
            # Nothing to transform
            return False, lines
        ordered_transformers = sorted(candidates, key=TokenTransformBase.sortby)
        for transformer in ordered_transformers:
            try:
                return True, await transformer.transform(lines)
            except SyntaxError:
                pass
        return False, lines


async def pip_magic(lines: list[str]) -> list[str]:
    """Replace ``%pip`` with ``piplite`` actions."""
    new_lines = []

    for line in lines:
        pip_match = re.match(r"^(\s*)%pip\b(.*)$", line)
        if not pip_match:
            new_lines.append(line)
            continue
        import piplite.cli

        transformed_code = await piplite.cli.get_transformed_code(
            shlex.split(pip_match[2])
        )

        if transformed_code:
            new_lines.append(f"{pip_match[1]}{transformed_code}")

    return new_lines
