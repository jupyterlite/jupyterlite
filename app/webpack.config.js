// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
const path = require('path');
const fs = require('fs-extra');
const glob = require('glob');
const webpack = require('webpack');
const Build = require('@jupyterlab/builder').Build;

const data = require('./package.json');

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

['themes.json', 'package.json.orig'].forEach(file => {
  fs.copySync(
    path.resolve(buildDir, 'schemas/@jupyterlab/apputils-extension', file),
    path.resolve(jupyterliteApputilsPlugin, file)
  );
});

// ensure all schemas are statically compiled
const schemaDir = path.resolve(buildDir, './schemas');
const files = glob.sync(`${schemaDir}/**/*.json`);
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

fs.writeFileSync(
  path.resolve(buildDir, 'all_schemas.json'),
  JSON.stringify(all)
);

module.exports = [
  {
    entry: ['whatwg-fetch', './index.js'],
    output: {
      path: path.resolve(__dirname, buildDir),
      filename: 'bundle.js'
    },
    bail: true,
    devtool: 'source-map',
    mode: 'development',
    module: {
      rules: [
        { test: /\.css$/, use: ['style-loader', 'css-loader'] },
        { test: /\.html$/, use: 'file-loader' },
        { test: /\.md$/, use: 'raw-loader' },
        { test: /\.(jpg|png|gif)$/, use: 'file-loader' },
        { test: /\.js.map$/, use: 'file-loader' },
        {
          test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
          use: 'url-loader?limit=10000&mimetype=application/font-woff'
        },
        {
          test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
          use: 'url-loader?limit=10000&mimetype=application/font-woff'
        },
        {
          test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
          use: 'url-loader?limit=10000&mimetype=application/octet-stream'
        },
        { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, use: 'file-loader' },
        {
          // In .css files, svg is loaded as a data URI.
          test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
          issuer: /\.css$/,
          use: {
            loader: 'svg-url-loader',
            options: { encoding: 'none', limit: 10000 }
          }
        },
        {
          // In .ts and .tsx files (both of which compile to .js), svg files
          // must be loaded as a raw string instead of data URIs.
          test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
          issuer: /\.js$/,
          use: {
            loader: 'raw-loader'
          }
        }
      ]
    },
    plugins: [
      new webpack.DefinePlugin({
        // Needed for Blueprint. See https://github.com/palantir/blueprint/issues/4393
        'process.env': '{}',
        // Needed for various packages using cwd(), like the path polyfill
        process: { cwd: () => '/' }
      })
    ]
  }
].concat(extensionAssetConfig);
