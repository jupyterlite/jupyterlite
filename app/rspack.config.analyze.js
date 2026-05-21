// Config for bundle analysis - only includes main config (not asset configs)
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const base = require('./rspack.config');

// Export only the first config (main bundle) for analysis
const config = { ...base[0] };

config.plugins = [
  ...config.plugins,
  // rspack 2.0: stats.toJson() without args no longer includes assets/modules/chunks.
  // webpack-bundle-analyzer calls it without args, so patch the stats object before it runs.
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
