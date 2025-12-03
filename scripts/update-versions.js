/**
 * Script to update JupyterLab and Notebook versions in app/jupyter-lite.json
 * Run this before building the app to ensure versions are in sync with installed packages.
 *
 * Usage: node scripts/update-versions.js
 */

const fs = require('fs');
const path = require('path');

const JUPYTER_LITE_JSON = path.resolve(__dirname, '../app/jupyter-lite.json');

// Read versions from installed packages
const jupyterlabVersion = require('@jupyterlab/application/package.json').version;
const notebookVersion = require('@jupyter-notebook/application/package.json').version;

// Read and update jupyter-lite.json
const config = JSON.parse(fs.readFileSync(JUPYTER_LITE_JSON, 'utf8'));

if (config['jupyter-config-data']) {
  config['jupyter-config-data'].jupyterlabVersion = jupyterlabVersion;
  config['jupyter-config-data'].notebookVersion = notebookVersion;

  fs.writeFileSync(JUPYTER_LITE_JSON, JSON.stringify(config, null, 2) + '\n');

  console.log(`Updated versions in ${JUPYTER_LITE_JSON}:`);
  console.log(`  jupyterlabVersion: ${jupyterlabVersion}`);
  console.log(`  notebookVersion: ${notebookVersion}`);
} else {
  console.error('Error: jupyter-config-data not found in config');
  process.exit(1);
}
