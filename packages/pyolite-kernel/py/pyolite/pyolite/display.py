import base64


MIMETYPES = [
    ("text/html", "_repr_html_"),
    ("text/markdown", "_repr_markdown_"),
    ("text/latex", "_repr_latex_"),
    ("image/svg+xml", "_repr_svg_"),
    ("image/png", "_repr_png_"),
    ("application/json", "_repr_json_"),
]


class DisplayPublisher:
    def __init__(self):
        self.display_callback = None

    def publish(self, obj, raw=False):
        if self.display_callback:
            formatted = format_result(obj, raw)
            self.display_callback(formatted)


display_publisher = DisplayPublisher()


def display(obj, raw=False):
    display_publisher.publish(obj, raw)


def format_result(result, raw=False):
    if raw:
        return {"data": result, "metadata": {}}
    if hasattr(result, "_repr_mimebundle_"):
        return {"data": result._repr_mimebundle_(), "metadata": {}}
    data = {"text/plain": repr(result)}
    metadata = {}
    for mimetype, method in MIMETYPES:
        if hasattr(result, method):
            # TODO: repr methods should return data and metadata
            data[mimetype] = getattr(result, method)()
    bundle = {"data": data, "metadata": metadata}
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


class Image:
    def __init__(self, data):
        self.data = base64.b64encode(data).decode()

    def _repr_png_(self):
        return self.data
