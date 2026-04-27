/**
 * Script to resolve configured package versions in app/jupyter-lite.json.
 *
 * Reads the `versionInfo` map from jupyter-config-data, resolves versions
 * for entries keyed by installed npm package name, and writes them back so
 * the About dialog can display accurate version information at runtime.
 *
 * Usage: node scripts/update-versions.js
 */

const fs = require('fs');
const path = require('path');

const JUPYTER_LITE_JSON = path.resolve(__dirname, '../app/jupyter-lite.json');

const config = JSON.parse(fs.readFileSync(JUPYTER_LITE_JSON, 'utf8'));
const configData = config['jupyter-config-data'];

if (!configData) {
  console.error('Error: jupyter-config-data not found in config');
  process.exit(1);
}

const versionEntries = configData.versionInfo;

if (!versionEntries || typeof versionEntries !== 'object') {
  console.log('No versionInfo found, nothing to update.');
  process.exit(0);
}

for (const [pkg, entry] of Object.entries(versionEntries)) {
  const version = require(`${pkg}/package.json`).version;
  entry.version = version;
  console.log(`  ${entry.label}: ${version} (${pkg})`);
}

fs.writeFileSync(JUPYTER_LITE_JSON, JSON.stringify(config, null, 2) + '\n');
console.log(`Updated versionInfo in ${JUPYTER_LITE_JSON}`);
