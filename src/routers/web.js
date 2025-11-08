const express = require("express");
const router = express.Router();

// Import Controller
const CategoryController = require("../apps/controllers/apis/category");
const ProductController = require("../apps/controllers/apis/product");
const OrderController = require("../apps/controllers/apis/order");
const AdminOrderController = require("../apps/controllers/apis/adminOrder");
const CommentController = require("../apps/controllers/apis/comment");
const CustomerAuthController = require("../apps/controllers/apis/customerAuth");
const UserController = require("../apps/controllers/apis/user");
const UserAuthController = require("../apps/controllers/apis/userAuth");
const AdController = require("../apps/controllers/apis/ad");

// Import Middleware
const { registerValidator } = require("../apps/middlewares/customerValidator");
const { verifyCustomer } = require("../apps/middlewares/orderAuth");
const { authAdmin } = require("../apps/middlewares/orderAuth");
const {
  createUserRules, 
  updateUserRules, 
  validationCheck: userValidationCheck, 
} = require("../apps/middlewares/userValidator"); 

const { verifyUserAccessToken, verifyUserRefreshToken } = require("../apps/middlewares/userAuth"); 

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

const {
  createProductRules,
  updateProductRules,
  findOneOrRemoveProductRules,
  productValidationHandler,
} = require("../apps/middlewares/productValidator");

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
  uploadAd,
} = require("../apps/middlewares/upload");

const { param } = require("express-validator");
const findOneOrRemoveCategoryRules = [
  param("id").isMongoId().withMessage("Invalid Category ID format"),
];

// CUSTOMER AUTH ROUTES
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

router.post(
  "/auth/customers/logout",
  verifyAccessToken,
  CustomerAuthController.logout
);

router.post(
  "/auth/customers/refresh",
  verifyRefreshToken,
  CustomerAuthController.refreshToken
);

router.get(
  "/auth/customers/me",
  verifyAccessToken,
  CustomerAuthController.getMe
);

// USER AUTH ROUTES (Admin/Member)
router.post(
  "/auth/users/register", 
  userValidationCheck,
  UserAuthController.register
);
router.post(
  "/auth/users/login",
  loginRules,
  loginValidator,
  UserAuthController.login
);

router.post(
  "/auth/users/logout",
  verifyUserAccessToken,
  UserAuthController.logout
);

router.post(
  "/auth/users/refresh",
  verifyUserRefreshToken,
  UserAuthController.refreshToken
);

router.get(
  "/auth/users/me",
  verifyUserAccessToken,
  UserAuthController.getMe
);

// USER MANAGEMENT ROUTES (Admin/Member CRUD)
router.post(
  "/users", 
  verifyUserAccessToken, 
  createUserRules, 
  userValidationCheck, 
  UserController.create
);
router.get("/users", verifyUserAccessToken, UserController.findAll); 
router.get("/users/:id", verifyUserAccessToken, UserController.findOne); 
router.patch(
  "/users/:id", 
  verifyUserAccessToken, 
  updateUserRules, 
  userValidationCheck, 
  UserController.update
);
router.delete("/users/:id", verifyUserAccessToken, UserController.delete); 

// CATEGORY CRUD
router.get("/categories", CategoryController.findAll);

router.get(
  "/categories/:id",
  findOneOrRemoveCategoryRules,
  createCategoryValidator,
  CategoryController.findOne
);

router.post(
  "/categories",
  verifyAccessToken,
  createCategoryRules,
  createCategoryValidator,
  CategoryController.create
);

router.patch(
  "/categories/:id",
  verifyAccessToken,
  updateCategoryRules,
  createCategoryValidator,
  CategoryController.update
);

router.delete(
  "/categories/:id",
  verifyAccessToken,
  findOneOrRemoveCategoryRules,
  createCategoryValidator,
  CategoryController.remove
);

// PRODUCT CRUD
router.get("/products", ProductController.findAll);

router.post(
  "/products",
  verifyAccessToken,
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
  verifyAccessToken,
  uploadProduct.single("image"),
  updateProductRules,
  productValidationHandler,
  ProductController.update
);

router.delete(
  "/products/:id",
  verifyAccessToken,
  findOneOrRemoveProductRules,
  productValidationHandler,
  ProductController.remove
);

// COMMENT API
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
  verifyAccessToken,
  updateCommentStatusRules,
  commentValidationHandler,
  CommentController.updateStatus
);

router.delete(
  "/comments/:id",
  verifyAccessToken,
  removeCommentRules,
  commentValidationHandler,
  CommentController.remove
);

// ORDER API
router.post(
  "/customers/orders",
  verifyCustomer,
  createOrderRules,
  createOrderValidator,
  OrderController.order
);
router.get(
  "/customers/orders",
  verifyAccessToken,
  OrderController.findByCustomerId
);
router.get("/customers/orders/:id", verifyAccessToken, OrderController.findOne);
router.patch(
  "/customers/orders/:id/cancel",
  verifyAccessToken,
  OrderController.cancel
);

// Admin Order Routes
router.get(
  "/orders/admin",
  verifyUserAccessToken, 
  authAdmin, 
  AdminOrderController.findAll
);

router.patch(
  "/orders/admin/:id",
  verifyUserAccessToken,
  authAdmin, 
  AdminOrderController.update
);

router.delete(
  "/orders/admin/:id",
  verifyUserAccessToken,
  authAdmin, 
  AdminOrderController.remove
);

// AD
router.get("/banners", AdController.listBanners); 
router.get("/sliders", AdController.listSliders);
// --- BANNER ROUTES (Admin) ---
router.get("/admin/banners", verifyUserAccessToken, authAdmin, AdController.adminListBanners);
router.post(
    "/admin/banners",
    verifyUserAccessToken,
    authAdmin,
    uploadAd.single("image"), 
    AdController.createBanner
);
router.get("/admin/banners/:id", verifyUserAccessToken, authAdmin, AdController.getBannerDetail);
router.patch(
    "/admin/banners/:id",
    verifyUserAccessToken,
    authAdmin,
    uploadAd.single("image"), 
    AdController.updateBanner
);
router.delete("/admin/banners/:id", verifyUserAccessToken, authAdmin, AdController.deleteBanner);

// --- SLIDER ROUTES (Admin) ---
router.get("/admin/sliders", verifyUserAccessToken, authAdmin, AdController.adminListSliders);
router.post(
    "/admin/sliders",
    verifyUserAccessToken,
    authAdmin,
    uploadAd.single("image"), 
    AdController.createSlider
);
router.get("/admin/sliders/:id", verifyUserAccessToken, authAdmin, AdController.getSliderDetail);
router.patch(
    "/admin/sliders/:id",
    verifyUserAccessToken,
    authAdmin,
    uploadAd.single("image"), 
    AdController.updateSlider
);
router.delete("/admin/sliders/:id", verifyUserAccessToken, authAdmin, AdController.deleteSlider);
module.exports = router;