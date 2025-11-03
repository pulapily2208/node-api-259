const app = require("../apps/app");
const config = require("config");
const server = app.listen((port = config.get("app.serverPort")), () => {
  console.log(`Server running on port ${port}`);
});
