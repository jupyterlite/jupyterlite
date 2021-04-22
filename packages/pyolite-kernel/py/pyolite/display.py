import base64
import json


class DisplayPublisher:
    def __init__(self):
        self.display_callback = None

    def publish(self, obj):
        formatted = format_result(obj)
        self.display_callback(formatted)

display_publisher = DisplayPublisher()


def display(obj):
    display_publisher.publish(obj)


def format_result(result):
    data = {"text/plain": repr(result)}
    metadata = {}
    if hasattr(result, "_repr_html_"):
        data["text/html"] = result._repr_html_()
    if hasattr(result, "_repr_markdown_"):
        data["text/markdown"] = result._repr_markdown_()
    if hasattr(result, "_repr_svg_"):
        data["image/svg+xml"] = result._repr_svg_()
    if hasattr(result, "_repr_png_"):
        data["image/png"] = result._repr_png_()
    if hasattr(result, "_repr_latex_"):
        data["text/latex"] = result._repr_latex_()
    if hasattr(result, "_repr_json_"):
        data["application/json"] = result._repr_json_()
    bundle = {
        'data': data,
        'metadata': metadata
    }
    return bundle


class DisplayObject:
    def __init__(self, data):
        self.data = data

    def _repr_(self):
        return self.data


class HTML(DisplayObject):
    def _repr_html_(self):
        return self.data


class Markdown(DisplayObject):
    def _repr_markdown_(self):
        return self.data


class Latex(DisplayObject):
    def _repr_latex_(self):
        return self.data


class JSON(DisplayObject):
    def _repr_json_(self):
        return self.data


class Image():
    def __init__(self, data):
        self.data = base64.b64encode(data).decode()

    def _repr_png_(self):
        return self.data