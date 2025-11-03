const { body, validationResult } = require("express-validator");
const loginRules = [
  body("email").isEmail().withMessage("Invalid email"),
  body("password").notEmpty().withMessage("Password is required"),
];
const loginValidator = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({
      status: "error",
      errors: errors.array(),
    });
  next();
};
module.exports = { loginRules, loginValidator };
