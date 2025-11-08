const { body, param, validationResult } = require("express-validator");

// Middleware xử lý kết quả kiểm tra
const commentValidationHandler = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: "error",
            errors: errors.array(),
        });
    }
    next();
};

// Rules cho GET /products/:id/comments (Kiểm tra Product ID)
const findByProductIdRules = [
    param("id").isMongoId().withMessage("Invalid Product ID format for comments"),
];

// Rules cho POST /products/:id/comments (Create Comment)
const createCommentRules = [
    ...findByProductIdRules, // Kiểm tra Product ID
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Invalid email format"),
    body("content").notEmpty().withMessage("Content is required"),
];

// Rules cho DELETE /comments/:id (Kiểm tra Comment ID)
const removeCommentRules = [
    param("id").isMongoId().withMessage("Invalid Comment ID format"),
];

// Rules cho PATCH /comments/:id/status (Update Comment Status)
const updateCommentStatusRules = [
    ...removeCommentRules, // Kiểm tra Comment ID
    body("status")
        .isIn(["pending", "approved"])
        .withMessage("Status must be 'pending' or 'approved'"),
];

module.exports = {
    findByProductIdRules,
    createCommentRules,
    removeCommentRules,
    updateCommentStatusRules,
    commentValidationHandler,
};