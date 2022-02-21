/**
 * An HTTP server derived from:
 *
 * https://developer.mozilla.org/en-US/docs/Learn/Server-side/Node_server_without_framework
 */

const DO_NOT_USE_THIS = `
********************************************************************************
* JupyterLite Development Server                      DO NOT USE IN PRODUCTION *
********************************************************************************
`;
const http = require('http');
const fs = require('fs/promises');
const path = require('path');
const { resolve } = require('path');

const ROOT = path.resolve(__dirname, '..', 'app');
const HOST = process.env['HOST'] || '127.0.0.1';
const PORT = parseInt(process.env['PORT'] || '5000');
const PREFIX = process.env['PREFIX'] || '/';
const ERRORS = { ENOENT: 404 };
const CUSTOM_ROUTES = {
  '/favicon.ico': '/lab/favicon.ico',
};

const MIME_TYPES = {
  // from https://github.com/python/cpython/blob/3.9/Lib/mimetypes.py
  '.a': 'application/octet-stream',
  '.ai': 'application/postscript',
  '.aif': 'audio/x-aiff',
  '.aifc': 'audio/x-aiff',
  '.aiff': 'audio/x-aiff',
  '.au': 'audio/basic',
  '.avi': 'video/x-msvideo',
  '.bat': 'text/plain',
  '.bcpio': 'application/x-bcpio',
  '.bin': 'application/octet-stream',
  '.bmp': 'image/bmp',
  '.bmp': 'image/x-ms-bmp',
  '.c': 'text/plain',
  '.cdf': 'application/x-netcdf',
  '.cpio': 'application/x-cpio',
  '.csh': 'application/x-csh',
  '.css': 'text/css',
  '.csv': 'text/csv',
  '.dll': 'application/octet-stream',
  '.doc': 'application/msword',
  '.dot': 'application/msword',
  '.dvi': 'application/x-dvi',
  '.eml': 'message/rfc822',
  '.eps': 'application/postscript',
  '.etx': 'text/x-setext',
  '.exe': 'application/octet-stream',
  '.gif': 'image/gif',
  '.gtar': 'application/x-gtar',
  '.h': 'text/plain',
  '.hdf': 'application/x-hdf',
  '.htm': 'text/html',
  '.html': 'text/html',
  '.ico': 'image/vnd.microsoft.icon',
  '.ief': 'image/ief',
  '.jpe': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.jpg': 'image/jpg',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.ksh': 'text/plain',
  '.latex': 'application/x-latex',
  '.m1v': 'video/mpeg',
  '.m3u': 'application/vnd.apple.mpegurl',
  '.m3u8': 'application/vnd.apple.mpegurl',
  '.man': 'application/x-troff-man',
  '.me': 'application/x-troff-me',
  '.mht': 'message/rfc822',
  '.mhtml': 'message/rfc822',
  '.mid': 'audio/midi',
  '.midi': 'audio/midi',
  '.mif': 'application/x-mif',
  '.mjs': 'application/javascript',
  '.mov': 'video/quicktime',
  '.movie': 'video/x-sgi-movie',
  '.mp2': 'audio/mpeg',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.mpa': 'video/mpeg',
  '.mpe': 'video/mpeg',
  '.mpeg': 'video/mpeg',
  '.mpg': 'video/mpeg',
  '.ms': 'application/x-troff-ms',
  '.nc': 'application/x-netcdf',
  '.nws': 'message/rfc822',
  '.o': 'application/octet-stream',
  '.obj': 'application/octet-stream',
  '.oda': 'application/oda',
  '.p12': 'application/x-pkcs12',
  '.p7c': 'application/pkcs7-mime',
  '.pbm': 'image/x-portable-bitmap',
  '.pct': 'image/pict',
  '.pdf': 'application/pdf',
  '.pfx': 'application/x-pkcs12',
  '.pgm': 'image/x-portable-graymap',
  '.pic': 'image/pict',
  '.pict': 'image/pict',
  '.pl': 'text/plain',
  '.png': 'image/png',
  '.pnm': 'image/x-portable-anymap',
  '.pot': 'application/vnd.ms-powerpoint',
  '.ppa': 'application/vnd.ms-powerpoint',
  '.ppm': 'image/x-portable-pixmap',
  '.pps': 'application/vnd.ms-powerpoint',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.ps': 'application/postscript',
  '.pwz': 'application/vnd.ms-powerpoint',
  '.py': 'text/x-python',
  '.pyc': 'application/x-python-code',
  '.pyo': 'application/x-python-code',
  '.qt': 'video/quicktime',
  '.ra': 'audio/x-pn-realaudio',
  '.ram': 'application/x-pn-realaudio',
  '.ras': 'image/x-cmu-raster',
  '.rdf': 'application/xml',
  '.rgb': 'image/x-rgb',
  '.roff': 'application/x-troff',
  '.rtf': 'application/rtf',
  '.rtx': 'text/richtext',
  '.sgm': 'text/x-sgml',
  '.sgml': 'text/x-sgml',
  '.sh': 'application/x-sh',
  '.shar': 'application/x-shar',
  '.snd': 'audio/basic',
  '.so': 'application/octet-stream',
  '.src': 'application/x-wais-source',
  '.sv4cpio': 'application/x-sv4cpio',
  '.sv4crc': 'application/x-sv4crc',
  '.svg': 'image/svg+xml',
  '.swf': 'application/x-shockwave-flash',
  '.t': 'application/x-troff',
  '.tar': 'application/x-tar',
  '.tcl': 'application/x-tcl',
  '.tex': 'application/x-tex',
  '.texi': 'application/x-texinfo',
  '.texinfo': 'application/x-texinfo',
  '.tif': 'image/tiff',
  '.tiff': 'image/tiff',
  '.tr': 'application/x-troff',
  '.tsv': 'text/tab-separated-values',
  '.txt': 'text/plain',
  '.ustar': 'application/x-ustar',
  '.vcf': 'text/x-vcard',
  '.wasm': 'application/wasm',
  '.wav': 'audio/x-wav',
  '.webm': 'video/webm',
  '.webmanifest': 'application/manifest+json',
  '.wiz': 'application/msword',
  '.wsdl': 'application/xml',
  '.xbm': 'image/x-xbitmap',
  '.xlb': 'application/vnd.ms-excel',
  '.xls': 'application/vnd.ms-excel',
  '.xml': 'text/xml',
  '.xpdl': 'application/xml',
  '.xpm': 'image/x-xpixmap',
  '.xsl': 'application/xml',
  '.xul': 'text/xul',
  '.xwd': 'image/x-xwindowdump',
  '.zip': 'application/zip',

  // also jupyter stuff
  '.ipynb': 'application/json',
  '.jupyterlab-workspace': 'application/json',

  // pyolite
  '.data': 'application/wasm',
};

function stripSlash(url) {
  return url.replace(/\/$/, '');
}

async function serve(request, response) {
  let { url, method } = request;
  let code = 500;
  let mime = 'application/octet-stream';
  let content = '<h1><pre>500 Really Unexpected Error</pre></h1>';

  url = url.split(/[\?#]/)[0];
  url = stripSlash(`${url.slice(PREFIX.length - 1)}`);
  url = CUSTOM_ROUTES[url] || url;

  let resolved = path.join(ROOT, url);
  let exists = false;
  let isDirectory = false;
  try {
    let stat = await fs.stat(resolved);
    exists = true;
    isDirectory = stat.isDirectory();
  } catch (error) {
    // will attempt to find index.html
  }

  if (exists && isDirectory) {
    url = [url, 'index.html'].join('/');
    resolved = path.join(ROOT, url);
  }

  let extname = path.extname(url);

  try {
    content = await fs.readFile(resolved);
    mime = MIME_TYPES[extname] || mime;
    code = 200;
  } catch (error) {
    code = ERRORS[error.code] || code;
    content = `<h1><pre>${code} ${error.code}</pre></h1>`;
    mime = 'text/html';
  } finally {
    (code == 200 ? console.info : console.error)(
      new Date().toISOString(),
      code,
      method,
      url
    );
    response.writeHead(code, { 'Content-Type': mime });
    response.end(content, 'utf-8');
  }
}

http.createServer(serve).listen(PORT, HOST, () => {
  console.warn(DO_NOT_USE_THIS);
  console.warn(`Serving JupyterLite from: ${ROOT}`);
  console.warn(`    Serving on host/port: http://${HOST}:${PORT}${PREFIX}\n`);
  console.warn('Press Ctrl+C to exit');
});
