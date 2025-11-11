const app = require("../apps/app");
const config = require("config");

// Log stack traces for specific deprecations (e.g., util.isArray -> DEP0044) to locate sources quickly
process.on('warning', (warning) => {
  try {
    if (warning && warning.name === 'DeprecationWarning' && warning.code === 'DEP0044') {
      console.warn('[Deprecation][DEP0044] util.isArray usage detected. Full stack below:');
      console.warn(warning.stack);
    }
  } catch (_) {
    // no-op
  }
});

const server = app.listen((port = config.get("app.serverPort")), () => {
  console.log(`Server running on port ${port}`);
});
