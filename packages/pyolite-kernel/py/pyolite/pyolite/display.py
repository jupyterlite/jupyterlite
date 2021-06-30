import base64
import sys

from IPython.core.displayhook import DisplayHook
from IPython.core.displaypub import DisplayPublisher


class Image:
    def __init__(self, data):
        self.data = base64.b64encode(data).decode()

    def _repr_png_(self):
        return self.data


class XDisplayPublisher(DisplayPublisher):
    def __init__(self, shell=None, *args, **kwargs):
        super(XDisplayPublisher, self).__init__(shell, *args, **kwargs)
        self.clear_output_callback = None
        self.update_display_data_callback = None
        self.display_data_callback = None

    def publish(
        self,
        data,
        metadata=None,
        source=None,
        *,
        transient=None,
        update=False,
        **kwargs
    ) -> None:
        if update and self.update_display_data_callback:
            self.update_display_data_callback(data, metadata, transient)
        elif self.display_data_callback:
            self.display_data_callback(data, metadata, transient)

    def clear_output(self, wait=False):
        if self.clear_output_callback:
            self.clear_output_callback(wait)


class XDisplayHook(DisplayHook):
    def __init__(self, *args, **kwargs):
        super(XDisplayHook, self).__init__(*args, **kwargs)
        self.publish_execution_result = None

    def start_displayhook(self):
        self.data = {}
        self.metadata = {}

    def write_output_prompt(self):
        pass

    def write_format_data(self, format_dict, md_dict=None):
        self.data = format_dict
        self.metadata = md_dict

    def finish_displayhook(self):
        sys.stdout.flush()
        sys.stderr.flush()

        if self.publish_execution_result:
            self.publish_execution_result(self.prompt_count, self.data, self.metadata)

        self.data = {}
        self.metadata = {}
