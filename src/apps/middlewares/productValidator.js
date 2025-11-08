const { body, param, validationResult } = require("express-validator");

// Middleware xử lý kết quả kiểm tra
const productValidationHandler = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: "error",
            errors: errors.array(),
        });
    }
    next();
};

// Rules cho GET /products/:id và DELETE /products/:id
const findOneOrRemoveProductRules = [
    param("id").isMongoId().withMessage("Invalid Product ID format"),
];

// Rules cho POST /products (Create Product)
const createProductRules = [
    body("category_id").isMongoId().withMessage("Invalid Category ID format"),
    body("name").notEmpty().withMessage("Product name is required"),
    body("price").notEmpty().withMessage("Product price is required"),
    body("status").notEmpty().withMessage("Product status is required"),
    body("accessories").notEmpty().withMessage("Accessories details are required"),
    body("promotion").notEmpty().withMessage("Promotion details are required"),
    body("details").notEmpty().withMessage("Details are required"),
    body("is_stock").optional().isBoolean().withMessage("is_stock must be a boolean"),
    body("is_featured").optional().isBoolean().withMessage("is_featured must be a boolean"),
];

// Rules cho PATCH /products/:id (Update Product)
const updateProductRules = [
    // Kiểm tra ID từ param
    ...findOneOrRemoveProductRules, 
    body("category_id").optional().isMongoId().withMessage("Invalid Category ID format"),
    body("name").optional().notEmpty().withMessage("Product name cannot be empty"),
    body("price").optional().notEmpty().withMessage("Product price cannot be empty"),
    body("status").optional().notEmpty().withMessage("Product status cannot be empty"),
    body("accessories").optional().notEmpty().withMessage("Accessories details cannot be empty"),
    body("promotion").optional().notEmpty().withMessage("Promotion details cannot be empty"),
    body("details").optional().notEmpty().withMessage("Details cannot be empty"),
    body("is_stock").optional().isBoolean().withMessage("is_stock must be a boolean"),
    body("is_featured").optional().isBoolean().withMessage("is_featured must be a boolean"),
];

module.exports = {
    createProductRules,
    updateProductRules,
    findOneOrRemoveProductRules,
    productValidationHandler,
};