// Config for bundle analysis - only includes main config (not asset configs)
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const base = require('./rspack.config');

// Export only the first config (main bundle) for analysis
const config = { ...base[0] };

config.plugins = [
  ...config.plugins,
  // webpack-bundle-analyzer calls stats.toJson() without arguments, but rspack only
  // includes assets/modules/chunks when those options are explicitly requested.
  // Patch toJson to supply them by default so the analyzer has data to render.
  {
    apply(compiler) {
      compiler.hooks.done.tapAsync('PatchStatsForBundleAnalyzer', (stats, callback) => {
        const original = stats.toJson.bind(stats);
        stats.toJson = (options) =>
          original(options ?? { assets: true, modules: true, chunks: true });
        callback();
      });
    },
  },
  new BundleAnalyzerPlugin({ analyzerMode: 'static' }),
];

module.exports = config;
