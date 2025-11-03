const { body, validationResult } = require("express-validator");
const createOrderRules = [
  body("fullName").notEmpty().withMessage("Fullname is required"),
  body("email").isEmail().withMessage("Invalid email"),
  body("phone").notEmpty().withMessage("Phone is required"),
  body("address").notEmpty().withMessage("Address is required"),
];
const createOrderValidator = (req, res, next) => {
  if (req.customer) return next();
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: "error",
      errors: errors.array(),
    });
  }
  next();
};
module.exports = {
  createOrderRules,
  createOrderValidator,
};
