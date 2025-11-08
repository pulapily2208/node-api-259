
const { body, validationResult } = require("express-validator");

const validationCheck = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: "error",
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

exports.createUserRules = [
  body("email").isEmail().withMessage("Invalid email format"),
  body("email").notEmpty().withMessage("Email is required"),
  body("password")
    .isLength({ min: 3 })
    .withMessage("Password must be at least 3 characters"),
  body("role").isIn(["admin", "member"]).withMessage("Role must be 'admin' or 'member'").optional(),
];

exports.updateUserRules = [
    body("email").optional().isEmail().withMessage("Invalid email format"),
    body("password")
      .optional()
      .isLength({ min: 3 })
      .withMessage("Password must be at least 3 characters"),
    body("role").optional().isIn(["admin", "member"]).withMessage("Role must be 'admin' or 'member'"),
];

exports.validationCheck = validationCheck;