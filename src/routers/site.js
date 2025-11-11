const express = require("express");
const router = express.Router();
const upload = require("../libs/upload");
const AdminController = require("../apps/controllers/web/admin");
const AuthController = require("../apps/controllers/web/auth");
const { requireLogin, attachAuthHeaders, webLoginRules, webLoginValidator } = require("../apps/middlewares/webAuth");
const CategoryController = require("../apps/controllers/web/category");
const ProductController = require("../apps/controllers/web/product");
const BannerController = require("../apps/controllers/web/banner");

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
// Tuyến chính cho trang Admin Dashboard
router.use(attachAuthHeaders);
router.get("/login", AuthController.loginForm);
router.post("/login", AuthController.login);
router.get("/logout", AuthController.logout);

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

module.exports = router;
