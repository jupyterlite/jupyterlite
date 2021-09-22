"""a JupyterLite addon to expose translation data"""
import json

from ..constants import ALL_JSON, API_TRANSLATIONS
from .base import BaseAddon


class TranslationAddon(BaseAddon):
    """Add translation data to /api/translations"""

    __all__ = ["build"]

    def build(self, manager):
        api_path = self.api_dir / ALL_JSON
        yield dict(
            name="copy",
            doc="create the translation data",
            targets=[api_path],
            actions=[
                (self.one_translation_path, [api_path]),
                (self.maybe_timestamp, [api_path]),
            ],
        )

    def one_translation_path(self, api_path):
        """Reuse of the utilities from ``jupyterlab_server`` to populate the translation data"""
        try:
            from jupyterlab_server.translation_utils import (
                get_language_pack,
                get_language_packs,
            )
        except ImportError as err:  # pragma: no cover
            self.log.warning(
                f"[lite] [translation] `jupyterlab_server` was not importable, "
                f"cannot create translation data {err}"
            )
            return

        metadata, _ = get_language_packs()
        packs = {locale: get_language_pack(locale)[0] for locale in metadata.keys()}

        all_packs = dict(metadata=metadata, packs=packs)

        api_path.parent.mkdir(parents=True, exist_ok=True)
        api_path.write_text(
            json.dumps(all_packs, indent=2, sort_keys=True),
            encoding="utf-8",
        )

        self.maybe_timestamp(api_path)

    @property
    def api_dir(self):
        return self.manager.output_dir / API_TRANSLATIONS
