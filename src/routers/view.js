const express = require("express");
const router = express.Router();
    
const AdminController = require("../apps/controllers/web/adminController");
const CategoryController = require("../apps/controllers/web/categoryController");
const ProductController = require("../apps/controllers/web/productController")
// Tuyến chính cho trang Admin Dashboard
router.get("/admin", AdminController.index); 

// Tuyến quản lý Category
router.get("/admin/categories", CategoryController.index);                 
router.get("/admin/categories/create", CategoryController.create);          
router.post(
    "/admin/categories/store", 
    CategoryController.storeRules, 
    CategoryController.store
); 
router.get("/admin/categories/edit/:id", CategoryController.edit);          
router.post(
    "/admin/categories/update/:id", 
    CategoryController.updateRules, 
    CategoryController.update
);
router.get("/admin/categories/delete/:id", CategoryController.destroy);
  
// Tuyến quản lý Product
router.get("/admin/products", ProductController.index);                  
router.get("/admin/products/create", ProductController.create);          
router.post("/admin/products/store", ProductController.storeRules, ProductController.store); 

router.get("/admin/products/edit/:id", ProductController.edit);          
router.post("/admin/products/update/:id", ProductController.storeRules, ProductController.update); 

router.get("/admin/products/delete/:id", ProductController.destroy);      
module.exports = router;