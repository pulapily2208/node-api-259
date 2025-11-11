const { body } = require("express-validator");

const createBannerRules = [
    body("url").optional({ checkFalsy: true }).isURL().withMessage("URL liên kết không hợp lệ."),
    body("position").optional().isInt().withMessage("Vị trí phải là số nguyên."),
];

const updateBannerRules = [
    body("url").optional({ checkFalsy: true }).isURL().withMessage("URL liên kết không hợp lệ."),
];

module.exports = { createBannerRules, updateBannerRules };