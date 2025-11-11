const { body, validationResult } = require("express-validator");

// Simple web auth middleware for EJS admin
module.exports.requireLogin = (req, res, next) => {
  if (req.session && req.session.user && req.session.accessToken) return next();
  return res.redirect('/login');
};

module.exports.attachAuthHeaders = (req, _res, next) => {
  const token = req.session && req.session.accessToken;
  req.authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
  next();
};

// Web-specific login validation that uses flash messages instead of JSON
module.exports.webLoginRules = [
  body("email").isEmail().withMessage("Email không hợp lệ"),
  body("password").notEmpty().withMessage("Mật khẩu không được để trống"),
];

module.exports.webLoginValidator = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('errors', errors.array());
    return res.redirect('/login');
  }
  next();
};
