// Source-backed local context is separate from the original project scenarios.
// Each city has its own air-quality note and asbestos/mold preparation + FAQ.
module.exports = {
  ...require('./editorial-sc'),
  ...require('./editorial-nc'),
  ...require('./editorial-ga'),
  ...require('./editorial-tn')
};
