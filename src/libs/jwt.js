const jwt = require("jsonwebtoken");
const config = require("config");
exports.generateAccessToken = async (payload) =>
  await jwt.sign(
    {
      id: payload._id || payload.id,
      email: payload.email,
    },
    config.get("app.jwtAccessKey"),
    { expiresIn: "1d" }
  );
exports.generateRefreshToken = async (payload) =>
  await jwt.sign(
    {
      id: payload._id,
      email: payload.email,
    },
    config.get("app.jwtRefreshKey"),
    { expiresIn: "1d" }
  );
