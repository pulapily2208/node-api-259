const express = require("express");
const router = express.Router();

// Import Controller
const CategoryController = require("../apps/controllers/apis/category");
const ProductController = require("../apps/controllers/apis/product");
const OrderController = require("../apps/controllers/apis/order");
const CommentController = require("../apps/controllers/apis/comment");
const CustomerAuthController = require("../apps/controllers/apis/customerAuth");

// Import Middleware
const { registerValidator } = require("../apps/middlewares/customerValidator");
const { verifyCustomer } = require("../apps/middlewares/orderAuth");
const {
  createOrderRules,
  createOrderValidator,
} = require("../apps/middlewares/orderValidator");
const {
  loginRules,
  loginValidator,
} = require("../apps/middlewares/authValidator");
const {
    createCategoryRules,
    updateCategoryRules,
    createCategoryValidator,
} = require("../apps/middlewares/categoryValidator");

// --- Import Validator cho Product ---
const {
    createProductRules,
    updateProductRules,
    findOneOrRemoveProductRules,
    productValidationHandler,
} = require("../apps/middlewares/productValidator");

// --- Import Validator cho Comment ---
const {
    findByProductIdRules,
    createCommentRules,
    removeCommentRules,
    updateCommentStatusRules,
    commentValidationHandler,
} = require("../apps/middlewares/commentValidator");

const {
  verifyAccessToken,
  verifyRefreshToken,
} = require("../apps/middlewares/customerAuth");
const { 
    uploadProduct, 
    uploadLogo, 
    uploadAd 
} = require("../apps/middlewares/upload");

const { param } = require("express-validator");
const findOneOrRemoveCategoryRules = [
    param("id").isMongoId().withMessage("Invalid Category ID format"),
];


// =============================================================
// CUSTOMER AUTH
// =============================================================
router.post(
  "/auth/customers/register",
  registerValidator,
  CustomerAuthController.register
);
router.post(
  "/auth/customers/login",
  loginRules,
  loginValidator,
  CustomerAuthController.login
);
router.post("/auth/customers/logout", verifyAccessToken, CustomerAuthController.logout);
router.post(
  "/auth/customers/refresh",
  verifyRefreshToken,
  CustomerAuthController.resfreshToken
);
router.get(
  "/auth/customers/me",
  verifyAccessToken,
  CustomerAuthController.getMe
);

// =============================================================
// CATEGORY CRUD
// =============================================================
router.get("/categories", CategoryController.findAll);

router.get(
  "/categories/:id", 
  findOneOrRemoveCategoryRules, 
  createCategoryValidator, 
  CategoryController.findOne
);

router.post(
  "/categories",
  createCategoryRules,
  createCategoryValidator,
  CategoryController.create
);

router.patch(
  "/categories/:id",
  updateCategoryRules,
  createCategoryValidator,
  CategoryController.update
);

router.delete(
  "/categories/:id", 
  findOneOrRemoveCategoryRules,
  createCategoryValidator, 
  CategoryController.remove
);

// =============================================================
// PRODUCT CRUD
// =============================================================
router.get("/products", ProductController.findAll);

router.post(
  "/products", 
  uploadProduct.single("image"), 
  createProductRules, 
  productValidationHandler,
  ProductController.create
); 

router.get(
  "/products/:id", 
  findOneOrRemoveProductRules,
  productValidationHandler,
  ProductController.findOne
);

router.patch(
  "/products/:id", 
  uploadProduct.single("image"), 
  updateProductRules, 
  productValidationHandler,
  ProductController.update
); 

// DELETE Remove, Validate ID
router.delete(
  "/products/:id", 
  findOneOrRemoveProductRules,
  productValidationHandler,
  ProductController.remove
);

// =============================================================
// COMMENT API
// =============================================================
router.get(
  "/products/:id/comments", 
  findByProductIdRules,
  commentValidationHandler, 
  CommentController.findByProductId
);

router.post(
  "/products/:id/comments", 
  createCommentRules, 
  commentValidationHandler,
  CommentController.create
);

router.patch(
  "/comments/:id/status", 
  updateCommentStatusRules,
  commentValidationHandler,
  CommentController.updateStatus
);

router.delete(
  "/comments/:id", 
  removeCommentRules, 
  commentValidationHandler,
  CommentController.remove
);

// =============================================================
// ORDER API
// =============================================================
router.post(
  "/customers/orders",
  verifyCustomer,
  createOrderRules,
  createOrderValidator,
  OrderController.order
);
router.get("/customers/orders", OrderController.findByCustomerId);
router.get("/customers/orders/:id", OrderController.findOne);
router.patch("/customers/orders/:id/cancel", OrderController.cancel);

module.exports = router;