// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
const path = require('path');
const fs = require('fs-extra');
const glob = require('glob');
const webpack = require('webpack');
const merge = require('webpack-merge').default;
const { ModuleFederationPlugin } = webpack.container;
const Handlebars = require('handlebars');
const Build = require('@jupyterlab/builder').Build;
const baseConfig = require('@jupyterlab/builder/lib/webpack.config.base');

const data = fs.readJSONSync('./package.json');

/**
 * Create the webpack ``shared`` configuration
 */
function createShared(packageData) {
  // Set up module federation sharing config
  const shared = {};
  const extensionPackages = packageData.jupyterlab.extensions;

  // Make sure any resolutions are shared
  for (let [pkg, requiredVersion] of Object.entries(packageData.resolutions)) {
    shared[pkg] = { requiredVersion };
  }

  // Add any extension packages that are not in resolutions (i.e., installed from npm)
  for (let pkg of extensionPackages) {
    if (!shared[pkg]) {
      shared[pkg] = {
        requiredVersion: require(`${pkg}/package.json`).version
      };
    }
  }

  // Add dependencies and sharedPackage config from extension packages if they
  // are not already in the shared config. This means that if there is a
  // conflict, the resolutions package version is the one that is shared.
  const extraShared = [];
  for (let pkg of extensionPackages) {
    let pkgShared = {};
    let {
      dependencies = {},
      jupyterlab: { sharedPackages = {} } = {}
    } = require(`${pkg}/package.json`);
    for (let [dep, requiredVersion] of Object.entries(dependencies)) {
      if (!shared[dep]) {
        pkgShared[dep] = { requiredVersion };
      }
    }

    // Overwrite automatic dependency sharing with custom sharing config
    for (let [dep, config] of Object.entries(sharedPackages)) {
      if (config === false) {
        delete pkgShared[dep];
      } else {
        if ('bundled' in config) {
          config.import = config.bundled;
          delete config.bundled;
        }
        pkgShared[dep] = config;
      }
    }
    extraShared.push(pkgShared);
  }

  // Now merge the extra shared config
  const mergedShare = {};
  for (let sharedConfig of extraShared) {
    for (let [pkg, config] of Object.entries(sharedConfig)) {
      // Do not override the basic share config from resolutions
      if (shared[pkg]) {
        continue;
      }

      // Add if we haven't seen the config before
      if (!mergedShare[pkg]) {
        mergedShare[pkg] = config;
        continue;
      }

      // Choose between the existing config and this new config. We do not try
      // to merge configs, which may yield a config no one wants
      let oldConfig = mergedShare[pkg];

      // if the old one has import: false, use the new one
      if (oldConfig.import === false) {
        mergedShare[pkg] = config;
      }
    }
  }

  Object.assign(shared, mergedShare);

  // Transform any file:// requiredVersion to the version number from the
  // imported package. This assumes (for simplicity) that the version we get
  // importing was installed from the file.
  for (let [pkg, { requiredVersion }] of Object.entries(shared)) {
    if (requiredVersion && requiredVersion.startsWith('file:')) {
      shared[pkg].requiredVersion = require(`${pkg}/package.json`).version;
    }
  }

  // Add singleton package information
  for (let pkg of packageData.jupyterlab.singletonPackages) {
    if (shared[pkg]) {
      shared[pkg].singleton = true;
    }
  }

  return shared;
}

const buildDir = './build';
// Generate webpack config to copy extension assets to the build directory,
// such as setting schema files, theme assets, etc.
const extensionAssetConfig = Build.ensureAssets({
  packageNames: data.jupyterlab.extensions,
  output: buildDir
});

// Override for the custom theme plugin
const jupyterliteApputilsPlugin = path.resolve(
  buildDir,
  'schemas/@jupyterlite/apputils-extension/'
);
fs.mkdirpSync(jupyterliteApputilsPlugin);

fs.moveSync(
  path.resolve(buildDir, 'schemas/@jupyterlab/apputils-extension', 'themes.json'),
  path.resolve(jupyterliteApputilsPlugin, 'themes.json'),
  { overwrite: true }
);

fs.copySync(
  path.resolve(buildDir, 'schemas/@jupyterlab/apputils-extension', 'package.json.orig'),
  path.resolve(jupyterliteApputilsPlugin, 'package.json.orig')
);

// ensure all schemas are statically compiled
const schemaDir = path.resolve(buildDir, './schemas');
const files = glob.sync(`${schemaDir}/**/*.json`, {
  ignore: [`${schemaDir}/all.json`]
});
const all = files.map(file => {
  const schema = fs.readJSONSync(file);
  const pluginFile = file.replace(`${schemaDir}/`, '');
  const basename = path.basename(pluginFile, '.json');
  const dirname = path.dirname(pluginFile);
  const packageJsonFile = path.resolve(schemaDir, dirname, 'package.json.orig');
  const packageJson = fs.readJSONSync(packageJsonFile);
  const pluginId = `${dirname}:${basename}`;
  return {
    id: pluginId,
    raw: '{}',
    schema,
    settings: {},
    version: packageJson.version
  };
});

fs.writeFileSync(path.resolve(schemaDir, 'all.json'), JSON.stringify(all));

// Create a list of application extensions and mime extensions from
// jlab.extensions
const extensions = {};
const mimeExtensions = {};
for (const key of data.jupyterlab.extensions) {
  const {
    jupyterlab: { extension, mimeExtension }
  } = require(`${key}/package.json`);
  if (extension !== undefined) {
    extensions[key] = extension === true ? '' : extension;
  }
  if (mimeExtension !== undefined) {
    mimeExtensions[key] = mimeExtension === true ? '' : mimeExtension;
  }
}

// Create the entry point and other assets in build directory.
const template = Handlebars.compile(
  fs.readFileSync(path.resolve('./index.template.js')).toString()
);
fs.writeFileSync(
  path.join(buildDir, 'index.js'),
  template({ extensions, mimeExtensions })
);

// Create the bootstrap file that loads federated extensions and calls the
// initialization logic in index.js
const entryPoint = './build/bootstrap.js';
fs.copySync('../bootstrap.js', entryPoint);

module.exports = [
  merge(baseConfig, {
    mode: 'development',
    devtool: 'source-map',
    entry: ['./publicpath.js', entryPoint],
    resolve: {
      fallback: {
        util: false
      }
    },
    output: {
      path: path.resolve(buildDir),
      library: {
        type: 'var',
        name: ['_JUPYTERLAB', 'CORE_OUTPUT']
      },
      filename: 'bundle.js',
      // to generate valid wheel names
      assetModuleFilename: '[name][ext][query]'
    },
    module: {
      rules: [
        {
          test: /\.whl/,
          type: 'asset/resource'
        },
        {
          resourceQuery: /raw/,
          type: 'asset/source'
        }
      ]
    },
    plugins: [
      new webpack.DefinePlugin({
        // Needed for Blueprint. See https://github.com/palantir/blueprint/issues/4393
        'process.env': '{}',
        // Needed for various packages using cwd(), like the path polyfill
        process: { cwd: () => '/' }
      }),
      new ModuleFederationPlugin({
        library: {
          type: 'var',
          name: ['_JUPYTERLAB', 'CORE_LIBRARY_FEDERATION']
        },
        name: 'CORE_FEDERATION',
        shared: createShared(data)
      })
    ]
  })
].concat(extensionAssetConfig);
