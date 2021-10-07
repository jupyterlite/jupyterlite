"""a JupyterLite addon to expose translation data"""
import json
import pprint

from ..constants import ALL_JSON, API_TRANSLATIONS
from .base import BaseAddon


class TranslationAddon(BaseAddon):
    """Add translation data to /api/translations"""

    __all__ = ["build", "status", "check"]

    def status(self, manager):
        """yield some status information about the state of the translation"""
        yield dict(
            name="translation",
            actions=[
                lambda: self.log.debug(
                    "[lite] [translation] All Translations %s",
                    pprint.pformat([str(p) for p in self.translation_files]),
                ),
                lambda: print(
                    f"""    translation files: {len(list(self.translation_files))} files"""
                ),
            ],
        )

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

    def check(self, manager):
        """Check the translation data is valid"""
        for all_json in self.api_dir.rglob(ALL_JSON):
            stem = all_json.relative_to(self.api_dir)
            yield dict(
                name=f"validate:translation:{stem}",
                doc=f"Validate {stem} with the JupyterLab Translation API",
                file_dep=[all_json],
                actions=[(self.validate_one_json_file, [None, all_json])],
            )

    def one_translation_path(self, api_path):
        """Reuse of the utilities from ``jupyterlab_server`` to populate the translation data"""
        try:
            from jupyterlab_server.translation_utils import (
                get_language_pack,
                get_language_packs,
            )

            all_packs, _ = get_language_packs()
            packs = {
                locale: {"data": get_language_pack(locale)[0], "message": ""}
                for locale in all_packs.keys()
            }
            metadata = {"data": all_packs, "message": ""}
        except ImportError as err:  # pragma: no cover
            self.log.warning(
                f"[lite] [translation] `jupyterlab_server` was not importable, "
                f"cannot create translation data {err}"
            )

            metadata = {
                "data": {
                    "en": {"displayName": "English", "nativeName": "English"},
                },
                "message": "",
            }
            packs = {"en": {"data": {}, "message": "Language pack 'en' not installed!"}}

        # save the metadata about available packs
        api_path.parent.mkdir(parents=True, exist_ok=True)
        api_path.write_text(
            json.dumps(metadata, indent=2, sort_keys=True),
            encoding="utf-8",
        )

        for locale, data in packs.items():
            language_pack_file = self.api_dir / f"{locale}.json"
            language_pack_file.write_text(
                json.dumps(data, indent=2, sort_keys=True),
                encoding="utf-8",
            )
            self.maybe_timestamp(language_pack_file)

    @property
    def api_dir(self):
        return self.manager.output_dir / API_TRANSLATIONS

    @property
    def translation_files(self):
        return self.api_dir.glob("*")
