from jupyterlite_core.addons.base import BaseAddon

class MinimalWorkingExampleAddon(BaseAddon):
    """Minimal working example addon for JupyterLite"""

    # List the hooks implemented by the addon. Hooks are functions!
    __all__ = ["status"]

    def _hello(self, name):
        self.log.debug(f"Hello {name}!")

    def status(self, manager):
        """status hook"""

        # Internal functions returned to doit.
        def _namaste():
            print("Namaste!")

        yield {
            "name": "minimal-working-example",
            "actions": (
                (self._hello, ("Lite",)),
                (_namaste, ),
            )
        }