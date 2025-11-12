const express = require("express");
const router = express.Router();
const upload = require("../libs/upload");
const passport = require("../common/passport");
const AdminController = require("../apps/controllers/web/admin");
const AuthController = require("../apps/controllers/web/auth");
const { requireLogin, attachAuthHeaders, webLoginRules, webLoginValidator } = require("../apps/middlewares/webAuth");
const CategoryController = require("../apps/controllers/web/category");
const ProductController = require("../apps/controllers/web/product");
const BannerController = require("../apps/controllers/web/banner");
const CommentController = require("../apps/controllers/web/comment");
const CustomerController = require("../apps/controllers/web/customer");
const UserController = require("../apps/controllers/web/user");
const SettingController = require("../apps/controllers/web/setting");
const CustomerAuthController = require("../apps/controllers/apis/customerAuth");

// Import Middleware
const {
  createCategoryRules,
  updateCategoryRules,
} = require("../apps/middlewares/categoryValidator");
const {
  createProductRules,
  updateProductRules,
} = require("../apps/middlewares/productValidator");

const {
    createBannerRules, 
    updateBannerRules 
} = require("../apps/middlewares/adValidator");

// Debug route
router.get("/debug-session", (req, res) => {
    res.json({
        hasSession: !!req.session,
        hasUser: !!(req.session && req.session.user),
        hasToken: !!(req.session && req.session.accessToken),
        user: req.session?.user?.email || 'none',
        sessionID: req.sessionID || 'none',
        cookies: req.cookies
    });
});

router.get("/login", AuthController.loginForm);
router.post("/login", AuthController.login);
router.get("/logout", AuthController.logout);
router.get("/admin/account", requireLogin, AuthController.account);

// --- GOOGLE OAuth Routes ---
router.get("/auth/google", 
    passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get("/auth/google/callback",
    passport.authenticate("google", { 
        failureRedirect: "/login?error=google_auth_failed",
        session: true 
    }),
    CustomerAuthController.socialLoginCallback
);

// --- FACEBOOK OAuth Routes ---
router.get("/auth/facebook", 
    passport.authenticate("facebook", { scope: ["email"] })
);

router.get("/auth/facebook/callback",
    passport.authenticate("facebook", { 
        failureRedirect: "/login?error=facebook_auth_failed",
        session: true 
    }),
    CustomerAuthController.socialLoginCallback
);

router.get("/admin", requireLogin, AdminController.index);

// Tuyến quản lý Category
router.get("/admin/categories", requireLogin, CategoryController.index);
router.get("/admin/categories/create", requireLogin, CategoryController.create);
router.post(
  "/admin/categories/store",
  requireLogin,
  createCategoryRules,
  CategoryController.store
);
router.get("/admin/categories/edit/:id", requireLogin, CategoryController.edit);
router.post(
  "/admin/categories/update/:id",
  requireLogin,
  updateCategoryRules,
  CategoryController.update
);
router.get("/admin/categories/delete/:id", requireLogin, CategoryController.destroy);

// Tuyến quản lý Product
router.get("/admin/products", requireLogin, ProductController.index);                  
router.get("/admin/products/create", requireLogin, ProductController.create);          
router.post(
  "/admin/products/store", 
  requireLogin,
  upload.single('image'), 
  createProductRules,
  ProductController.store
);
router.get("/admin/products/edit/:id", requireLogin, ProductController.edit);          
router.post(
  "/admin/products/update/:id", 
  requireLogin,
  upload.single('image'), 
  updateProductRules, 
  ProductController.update
);
router.get("/admin/products/delete/:id", requireLogin, ProductController.destroy);

// Tuyến quản lý Banner / Slider
router.get("/admin/banners", requireLogin, BannerController.index);
router.get("/admin/banners/create", requireLogin, BannerController.create);
router.post(
  "/admin/banners/store",
  requireLogin,
  upload.single("image"),
  createBannerRules,
  BannerController.store
);
router.get("/admin/banners/edit/:id", requireLogin, BannerController.edit);
router.post(
  "/admin/banners/update/:id",
  requireLogin,
  upload.single("image"),
  updateBannerRules,
  BannerController.update
);
router.get("/admin/banners/delete/:id", requireLogin, BannerController.destroy);
router.get("/admin/banners/moveup/:id", requireLogin, BannerController.moveUp);
router.get("/admin/banners/movedown/:id", requireLogin, BannerController.moveDown);

// Tuyến quản lý Slider (tương tự Banner)
router.get("/admin/sliders", requireLogin, BannerController.index);
router.get("/admin/sliders/create", requireLogin, BannerController.create);
router.post(
  "/admin/sliders/store",
  requireLogin,
  upload.single("image"),
  createBannerRules,
  BannerController.store
);
router.get("/admin/sliders/edit/:id", requireLogin, BannerController.edit);
router.post(
  "/admin/sliders/update/:id",
  requireLogin,
  upload.single("image"),
  updateBannerRules,
  BannerController.update
);
router.get("/admin/sliders/delete/:id", requireLogin, BannerController.destroy);
router.get("/admin/sliders/moveup/:id", requireLogin, BannerController.moveUp);
router.get("/admin/sliders/movedown/:id", requireLogin, BannerController.moveDown);

// Tuyến quản lý Comment
router.get("/admin/comments", requireLogin, CommentController.list);
router.get("/admin/comments/detail/:id", requireLogin, CommentController.detail);
router.post("/admin/comments/update/:id", requireLogin, CommentController.updateStatus);
router.get("/admin/comments/delete/:id", requireLogin, CommentController.delete);

// Tuyến quản lý Customer
router.get("/admin/customers", requireLogin, CustomerController.list);
router.get("/admin/customers/detail/:id", requireLogin, CustomerController.detail);
router.get("/admin/customers/edit/:id", requireLogin, CustomerController.showEdit);
router.post("/admin/customers/update/:id", requireLogin, CustomerController.update);
router.get("/admin/customers/delete/:id", requireLogin, CustomerController.delete);

// Tuyến quản lý User/Member
router.get("/admin/users", requireLogin, UserController.list);
router.get("/admin/users/create", requireLogin, UserController.showCreate);
router.post("/admin/users/store", requireLogin, UserController.create);
router.get("/admin/users/detail/:id", requireLogin, UserController.detail);
router.get("/admin/users/edit/:id", requireLogin, UserController.showEdit);
router.post("/admin/users/update/:id", requireLogin, UserController.update);
router.get("/admin/users/delete/:id", requireLogin, UserController.delete);

// Tuyến quản lý Settings
router.get("/admin/settings", requireLogin, SettingController.showSettings);
router.post("/admin/settings/update", requireLogin, SettingController.uploadLogo.single("thumbnail_logo"), SettingController.update);

// Tuyến quản lý Orders
const OrderController = require("../apps/controllers/web/order");
router.get("/admin/orders", requireLogin, OrderController.list);
router.get("/admin/orders/detail/:id", requireLogin, OrderController.detail);
router.post("/admin/orders/update/:id", requireLogin, OrderController.updateStatus);
router.get("/admin/orders/delete/:id", requireLogin, OrderController.delete);

module.exports = router;
