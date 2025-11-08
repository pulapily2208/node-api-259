const jwt = require("jsonwebtoken");
const config = require("config");
exports.generateAccessToken = async (payload) =>
  await jwt.sign(
    {
      id: payload._id || payload.id,
      email: payload.email,
      // include role when available so middleware can check admin privileges
      role: payload.role || (payload._doc && payload._doc.role) || undefined,
    },
    config.get("app.jwtAccessKey"),
    { expiresIn: "1d" }
  );
exports.generateRefreshToken = async (payload) =>
  await jwt.sign(
    {
      id: payload._id || payload.id,
      email: payload.email,
      role: payload.role || (payload._doc && payload._doc.role) || undefined,
    },
    config.get("app.jwtRefreshKey"),
    { expiresIn: "1d" }
  );

exports.sign = (payload, secret, options = {}) => jwt.sign(payload, secret, options);
exports.verify = (token, secret, callback) => {
    if (callback) {
        return jwt.verify(token, secret, callback);
    }
    return jwt.verify(token, secret);
};