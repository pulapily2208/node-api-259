const express = require("express");
const router = express.Router();
    
// Import Controller cho Admin
const AdminController = require("../apps/controllers/web/admin");
    

router.get("/admin", AdminController.index); 
    
module.exports = router;