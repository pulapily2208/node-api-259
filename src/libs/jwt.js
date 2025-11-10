const jwt = require("jsonwebtoken");
const config = require("config");

exports.generateAccessToken = async (payload) =>
  await jwt.sign(
    {
      id: payload._id || payload.id,
      email: payload.email, // include role when available so middleware can check admin privileges
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

// HÀM MỚI: TẠO TOKEN ĐẶT LẠI MẬT KHẨU
exports.generateResetToken = async (payload) =>
  await jwt.sign(
    {
      id: payload._id || payload.id,
      isReset: true,
    },
    config.get("app.jwtResetKey"), 
    { expiresIn: "1h" }
  );

exports.sign = (payload, secret, options = {}) =>
  jwt.sign(payload, secret, options);

// Cập nhật hàm verify sang dạng Promise
exports.verify = (token, secret) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded);
    });
  });
};
