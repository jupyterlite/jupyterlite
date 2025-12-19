// Config for bundle analysis - only includes main config (not asset configs)
const base = require('./rspack.config');

// Export only the first config (main bundle) for analysis
module.exports = base[0];
