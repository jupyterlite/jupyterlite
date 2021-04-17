def display(*objs, **kwargs):
    print(objs, kwargs)


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
