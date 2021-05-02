/**
 * configuration utilities for jupyter-lite
 *
 * this file may not import anything else, and exposes no API
 *
 * an `index.html` should `await import('../config-utils.js')` after specifying
 * the key `script` tags...
 */
const JUPYTER_CONFIG_DATA = 'jupyter-config-data';
const LITE_ROOT = 'jupyter-lite-root';
/**
 * And this link tag.
 */
const LITE_MAIN = 'jupyter-lite-main';

const parser = new DOMParser();

/**
 * The computed composite configuration
 */
let _JUPYTER_CONFIG;

/**
 * Merge `jupyter-config-data` on the current page with `jupyter-lite-root`
 */
async function jupyterConfigData() {
  if (_JUPYTER_CONFIG != null) {
    return _JUPYTER_CONFIG;
  }
  // TBD: the other ones
  let promises = [pageConfigData()];
  let root = liteRoot();
  if (root != null) {
    promises.unshift(pageConfigData(root, root));
  }
  const configs = await Promise.all(promises);
  return (_JUPYTER_CONFIG = configs.reduce((memo, config) => {
    if (memo == null) {
      return config;
    }
    for (const [k, v] of Object.entries(config)) {
      switch (k) {
        case 'federated_extensions':
          memo[k] = [...(memo[k] || []), ...v];
          break;
        default:
          memo[k] = v;
      }
    }
    return memo;
  }, null));
}

/**
 * The current normalized location
 */
function here() {
  return window.location.href.replace(/(\/|\/index.html)?$/, '/');
}

/**
 * The fully-resolved root of this JupyterLite site
 */
function liteRoot() {
  const el = document.getElementById(LITE_ROOT);
  const root = JSON.parse(el.textContent);
  if (root == '.') {
    return null;
  }
  return new URL(root, here());
}

/**
 * Fetch an `index.html` in this folder, which must contain the trailing slash.
 */
export async function fetchIndex(url) {
  const text = await (await window.fetch(`${url}index.html`)).text();
  const html = parser.parseFromString(text, 'text/html');
  return html.getElementById(JUPYTER_CONFIG_DATA).textContent;
}

/**
 * Load jupyter config data from (this) page.
 */
async function pageConfigData(url, root) {
  let configText;
  let urlBase = new URL(url || here()).pathname;

  if (url != null) {
    configText = await fetchIndex(url);
  } else {
    configText = document.getElementById(JUPYTER_CONFIG_DATA).textContent;
  }
  configText = configText.replace(/(?<=Url"\s*:\s*")\.\//g, urlBase);
  const config = JSON.parse(configText);
  return config;
}

/**
 * Update with the as-configured favicon
 */
function addFavicon(config) {
  const favicon = document.createElement('link');
  favicon.rel = 'icon';
  favicon.type = 'image/x-icon';
  favicon.href = config.faviconUrl;
  document.head.appendChild(favicon);
}

/**
 * The main entry point.
 */
async function main() {
  const config = await jupyterConfigData();
  if (config.baseUrl === new URL(here()).pathname) {
    window.location.href = config.appUrl;
    return;
  }
  document.getElementById(JUPYTER_CONFIG_DATA).textContent = JSON.stringify(
    config,
    null,
    2
  );
  addFavicon(config);
  const preloader = document.getElementById(LITE_MAIN);
  const bundle = document.createElement('script');
  bundle.src = preloader.href;
  bundle.main = preloader.main;
  document.head.appendChild(bundle);
}

/**
 * TODO: consider better pattern for invocation.
 */
await main();
