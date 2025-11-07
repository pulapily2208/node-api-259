const ProductModel = require("../../models/product");
const CategoryModel = require("../../models/category"); 
const paginate = require("../../../libs/paginate"); 
const mongoose = require("mongoose");
const { body, validationResult } = require("express-validator");


// 1. INDEX: Hiển thị danh sách Sản phẩm (Giữ nguyên hoặc đã được cập nhật trước đó)
exports.index = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = 10;
        const skip = page * limit - limit;
        const query = {};

        const products = await ProductModel.find(query)
            .skip(skip)
            .limit(limit)
            .sort({ _id: -1 });
        
        const pages = await paginate(page, limit, query, ProductModel);
        const paginationArray = Array.from({ length: pages.total }, (_, i) => i + 1);

        return res.render("admin/products/product", {
            products: products,
            title: "Quản Lý Sản Phẩm",
            page: pages.page,
            prev: pages.hasPrev ? pages.prev : 1,
            next: pages.hasNext ? pages.next : pages.total,
            totalPages: pages.total,
            paginate: paginationArray,
            success: req.flash('success'), 
            errors: req.flash('errors'),
        });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách sản phẩm:", error);
        req.flash('errors', [{ msg: `Lỗi hệ thống: ${error.message}` }]);
        return res.redirect("/admin");
    }
};

// 2. CREATE (GET): Hiển thị form Thêm sản phẩm
exports.create = async (req, res) => {
    try {
        const categories = await CategoryModel.find().select("name"); 

        const oldDataFlash = req.flash('oldData');
        const oldData = Array.isArray(oldDataFlash) ? oldDataFlash : [];
        
        return res.render("admin/products/add_product", {
            title: "Thêm Mới Sản Phẩm",
            categories: categories,
            errors: req.flash('errors'),
            oldData: oldData 
        });
    } catch (error) {
        console.error("Lỗi khi tải trang thêm sản phẩm:", error);
        req.flash('errors', [{ msg: `Lỗi hệ thống: ${error.message}` }]);
        return res.redirect("/admin/products");
    }
};

// 3. STORE (POST): Xử lý lưu sản phẩm
exports.storeRules = [
    body("name").notEmpty().withMessage("Tên sản phẩm là bắt buộc"),
    body("price").isNumeric().withMessage("Giá phải là số dương"), 
    body("category_id").custom(id => mongoose.Types.ObjectId.isValid(id)).withMessage("Danh mục không hợp lệ"),
];

exports.store = async (req, res) => {
    const errors = validationResult(req);
    const { name, price, category_id, status, accessories, promotion, details, is_stock, is_featured } = req.body;
    
    if (!errors.isEmpty()) {
        req.flash('errors', errors.array());
        req.flash('oldData', [req.body]);
        return res.redirect("/admin/products/create");
    }

    try {
        const image = "default_product.png"; 

        await ProductModel.create({
            category_id, name, image, price, status, accessories, promotion, details,
            is_stock: is_stock === 'on' || is_stock === true,
            is_featured: is_featured === 'on' || is_featured === true,
        });

        req.flash('success', `Thêm sản phẩm "${name}" thành công!`);
        return res.redirect("/admin/products");

    } catch (error) {
        console.error("Lỗi khi thêm sản phẩm:", error);
        req.flash('errors', [{ msg: 'Lỗi server khi lưu sản phẩm.' }]);
        req.flash('oldData', [req.body]);
        return res.redirect("/admin/products/create");
    }
};

// 4. EDIT (GET): Hiển thị form Chỉnh sửa sản phẩm
exports.edit = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await ProductModel.findById(id);
        const categories = await CategoryModel.find().select("name");

        if (!product) {
            req.flash('errors', [{ msg: 'Sản phẩm không tồn tại.' }]);
            return res.redirect("/admin/products");
        }
        
        return res.render("admin/products/edit_product", {
            title: `Chỉnh Sửa Sản Phẩm: ${product.name}`,
            product: product, 
            categories: categories,
            errors: req.flash('errors')
        });
    } catch (error) {
        console.error(`Lỗi khi lấy Product ID ${req.params.id}:`, error);
        req.flash('errors', [{ msg: 'Lỗi server khi truy cập chỉnh sửa sản phẩm.' }]);
        return res.redirect("/admin/products");
    }
};

// 5. UPDATE (POST): Xử lý cập nhật sản phẩm
exports.update = async (req, res) => {
    const errors = validationResult(req);
    const { id } = req.params;
    const { name, price, category_id, status, accessories, promotion, details, is_stock, is_featured } = req.body;
    
    if (!errors.isEmpty()) {
        req.flash('errors', errors.array());
        return res.redirect(`/admin/products/edit/${id}`);
    }

    try {
        const updateData = {
            category_id, name, price, status, accessories, promotion, details,
            is_stock: is_stock === 'on' || is_stock === true,
            is_featured: is_featured === 'on' || is_featured === true,
        };

        const updatedProduct = await ProductModel.findByIdAndUpdate(id, updateData, { new: true });

        if (!updatedProduct) {
            req.flash('errors', [{ msg: 'Cập nhật thất bại: Sản phẩm không tồn tại.' }]);
            return res.redirect("/admin/products");
        }
        
        req.flash('success', `Cập nhật sản phẩm "${name}" thành công!`);
        return res.redirect("/admin/products");
    } catch (error) {
        console.error(`Lỗi khi cập nhật Product ID ${id}:`, error);
        req.flash('errors', [{ msg: 'Lỗi server khi cập nhật sản phẩm.' }]);
        return res.redirect(`/admin/products/edit/${id}`);
    }
};

// 6. DESTROY (GET): Xử lý xóa sản phẩm
exports.destroy = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedProduct = await ProductModel.findByIdAndDelete(id);

        if (!deletedProduct) {
            req.flash('errors', [{ msg: 'Sản phẩm không tồn tại để xóa.' }]);
            return res.redirect("/admin/products");
        }
        
        req.flash('success', `Xóa sản phẩm "${deletedProduct.name}" thành công!`); 
        return res.redirect("/admin/products");

    } catch (error) {
        console.error(`Lỗi khi xóa Product ID ${req.params.id}:`, error);
        req.flash('errors', [{ msg: 'Lỗi server khi xóa sản phẩm.' }]);
        return res.redirect("/admin/products");
    }
};