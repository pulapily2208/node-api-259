const { body, validationResult } = require("express-validator");

// Simple web auth middleware for EJS admin
module.exports.requireLogin = (req, res, next) => {
  console.log('requireLogin - checking session...', {
    hasSession: !!req.session,
    hasUser: !!(req.session && req.session.user),
    hasToken: !!(req.session && req.session.accessToken)
  });
  
  if (req.session && req.session.user && req.session.accessToken) {
    console.log('requireLogin - OK, user:', req.session.user.email);
    // Set authHeaders để dùng cho API calls
    const token = req.session.accessToken;
    req.authHeaders = { Authorization: `Bearer ${token}` };
    console.log('requireLogin - authHeaders set with token');
    return next();
  }
  
  console.log('requireLogin - FAILED, redirecting to /login');
  return res.redirect('/login');
};

module.exports.attachAuthHeaders = (req, _res, next) => {
  const token = req.session && req.session.accessToken;
  req.authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
  console.log('attachAuthHeaders - token:', token ? 'exists' : 'missing');
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
