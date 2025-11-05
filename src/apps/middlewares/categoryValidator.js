const { body, validationResult } = require("express-validator");

const createCategoryRules = [
  body("name").notEmpty().withMessage("Category name is required"),
];

const updateCategoryRules = [
    body("name").notEmpty().withMessage("Category name is required"),
];

const createCategoryValidator = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({
      status: "error",
      errors: errors.array(),
    });
  next();
};

module.exports = { createCategoryRules, updateCategoryRules, createCategoryValidator };