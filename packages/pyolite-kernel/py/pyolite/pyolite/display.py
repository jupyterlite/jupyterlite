import sys

from ipykernel.jsonutil import encode_images, json_clean
from IPython.core.displayhook import DisplayHook
from IPython.core.displaypub import DisplayPublisher
from IPython.display import Image  # to replace previous base64-encoding shim

__all__ = ["LiteStream", "Image", "LiteDisplayHook", "LiteDisplayPublisher"]


class LiteStream:
    encoding = "utf-8"

    def __init__(self, name):
        self.name = name
        self.publish_stream_callback = None

    def write(self, text):
        if self.publish_stream_callback:
            self.publish_stream_callback(self.name, text)

    def flush(self):
        pass

    def isatty(self):
        return False


class LiteDisplayPublisher(DisplayPublisher):
    def __init__(self, shell=None, *args, **kwargs):
        super(LiteDisplayPublisher, self).__init__(shell, *args, **kwargs)
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


class LiteDisplayHook(DisplayHook):
    def __init__(self, *args, **kwargs):
        super(LiteDisplayHook, self).__init__(*args, **kwargs)
        self.publish_execution_result = None

    def start_displayhook(self):
        self.data = {}
        self.metadata = {}

    def write_output_prompt(self):
        pass

    def write_format_data(self, format_dict, md_dict=None):
        self.data = json_clean(encode_images(format_dict))
        self.metadata = md_dict

    def finish_displayhook(self):
        sys.stdout.flush()
        sys.stderr.flush()

        if self.publish_execution_result:
            self.publish_execution_result(self.prompt_count, self.data, self.metadata)

        self.data = {}
        self.metadata = {}
