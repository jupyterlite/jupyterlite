import json


class DisplayPublisher:
    def __init__(self):
        self.display_callback = None

    def publish(self, obj):
        formatted = format_result(obj)
        self.display_callback(formatted)

display_publisher = DisplayPublisher()


def format_result(result):
    data = {"text/plain": repr(result)}
    metadata = {}
    if hasattr(result, "_repr_html_"):
        data["text/html"] = result._repr_html_()
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


def display(obj):
    display_publisher.publish(obj)


def _display_mimetype(mimetype, objs, raw=False, metadata=None):
    if metadata:
        metadata = {mimetype: metadata}
    if raw:
        objs = [ {mimetype: obj} for obj in objs ]
    display(*objs, raw=raw, metadata=metadata, include=[mimetype])


def display_pretty(*objs, **kwargs):
    _display_mimetype('text/plain', objs, **kwargs)


def display_html(*objs, **kwargs):
    _display_mimetype('text/html', objs, **kwargs)


def display_markdown(*objs, **kwargs):
    _display_mimetype('text/markdown', objs, **kwargs)


def display_svg(*objs, **kwargs):
    _display_mimetype('image/svg+xml', objs, **kwargs)


def display_png(*objs, **kwargs):
    _display_mimetype('image/png', objs, **kwargs)


def display_jpeg(*objs, **kwargs):
    _display_mimetype('image/jpeg', objs, **kwargs)


def display_latex(*objs, **kwargs):
    _display_mimetype('text/latex', objs, **kwargs)


def display_json(*objs, **kwargs):
    _display_mimetype('application/json', objs, **kwargs)


class DisplayObject:
    def __init__(self, data):
        self.data = data

    def _repr_html_(self):
        return self.data


class HTML(DisplayObject):
    pass


class Latex(DisplayObject):
    pass


class JSON(DisplayObject):
    def _repr_json_(self):
        return json.dumps(self.data)
