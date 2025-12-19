const base = require('./rspack.config');

module.exports = [
  {
    ...base[0],
    bail: false,
    watch: true,
  },
  ...base.slice(1),
];
