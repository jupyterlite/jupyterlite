/**
 * Script to resolve configured package versions in app/jupyter-lite.json.
 *
 * Reads the `versionInfo` map from jupyter-config-data, resolves versions
 * for entries keyed by installed npm package name, and writes them back so
 * the About dialog can display accurate version information at runtime.
 *
 * Usage:
 *   node scripts/update-versions.js          # Update versions
 *   node scripts/update-versions.js --check  # Check only (for CI)
 */

const fs = require('fs');
const path = require('path');

const checkOnly = process.argv.includes('--check');

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

const changes = [];

for (const [pkg, entry] of Object.entries(versionEntries)) {
  let version;
  try {
    version = require(`${pkg}/package.json`).version;
  } catch (err) {
    console.error(`Error: failed to resolve the version of "${pkg}":`, err.message);
    process.exit(1);
  }
  if (entry.version !== version) {
    changes.push(`  ${pkg}: ${entry.version ?? '(unset)'} -> ${version}`);
  }
  entry.version = version;
  if (!checkOnly) {
    console.log(`  ${entry.label}: ${version} (${pkg})`);
  }
}

if (checkOnly) {
  if (changes.length > 0) {
    console.error('versionInfo mismatches found in app/jupyter-lite.json:');
    for (const change of changes) {
      console.error(change);
    }
    console.error("\nRun 'jlpm update-versions' to fix.");
    process.exit(1);
  }
  console.log('All versionInfo entries are up to date.');
} else {
  fs.writeFileSync(JUPYTER_LITE_JSON, JSON.stringify(config, null, 2) + '\n');
  console.log(`Updated versionInfo in ${JUPYTER_LITE_JSON}`);
}
