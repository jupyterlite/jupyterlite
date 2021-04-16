const base = require('./webpack.config');

module.exports = [{ ...base[0], bail: false }, ...base.slice(1)];
