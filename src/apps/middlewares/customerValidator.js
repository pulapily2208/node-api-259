const { body } = require("express-validator");
exports.registerValidator = [
  body("fullName").notEmpty().withMessage("Fullname is required"),
  body("email").isEmail().withMessage("Invalid email"),
  body("password")
    .isLength({ min: 3 })
    .withMessage("Password must be at least 3 characters"),
  body("phone").notEmpty().withMessage("Phone is required"),
  body("address").notEmpty().withMessage("Address is required"),
];
