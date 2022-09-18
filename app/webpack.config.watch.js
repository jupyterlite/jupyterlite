const base = require('./webpack.config');
const ExtraWatchWebpackPlugin = require('extra-watch-webpack-plugin');

module.exports = [
  {
    ...base[0],
    bail: false,
    watch: true,
    watchOptions: {
      ignored: /node_modules/,
    },
    plugins: [
      ...base[0].plugins,
      new ExtraWatchWebpackPlugin({
        files: ['../packages/_metapackage/tsconfig.tsbuildinfo'],
      }),
    ],
  },
  ...base.slice(1),
];
