const axios = require('axios');
const config = require('config');
const { validationResult } = require('express-validator');
const path = require('path');
const { buildCompactPagination } = require('../../../libs/view.pagination');

const apiPrefix = config.get("app.prefixApiVersion"); 
const DEFAULT_LIMIT = 10; 
const PRODUCT_SUBFOLDER = 'products'; // Phải khớp với Product API Controller

// Chuẩn hoá đường dẫn ảnh về dạng bắt đầu bằng "/upload/{subfolder}/..."
const normalizeImagePath = (value, subfolder = PRODUCT_SUBFOLDER) => {
    if (!value || typeof value !== 'string') return '';
    let v = value.trim();
    // thay /public/upload -> /upload
    v = v.replace(/^\/public\/upload/i, '/upload');
    // nếu đã đúng prefix
    if (v.startsWith('/upload/')) return v;
    // nếu chỉ là tên file hoặc đường dẫn tương đối, thêm prefix
    v = v.replace(/^\/+/, '');
    return `/upload/${subfolder}/${v}`;
};

// buildCompactPagination is now imported from libs


// --- 1. INDEX (GET /admin/products) ---
exports.index = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || DEFAULT_LIMIT;
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        // Gọi API Product: GET /api/v1/products (Hỗ trợ phân trang)
        const apiUrl = `${baseUrl}${apiPrefix}/products`; 

        const apiResponse = await axios.get(apiUrl, {
            params: { page, limit, ...req.query }
        });

        // API trả về: { status, message, data: products[], pages: { page, limit, total, next, prev, hasNext, hasPrev } }
        const productsRaw = apiResponse.data?.data || [];
        const pages = apiResponse.data?.pages || {};
        // Chuẩn hoá ảnh cho view (EJS chỉ hiển thị)
        const products = productsRaw.map(p => ({
            ...p,
            image: normalizeImagePath(p.image, PRODUCT_SUBFOLDER)
        }));

        const totalPages = Number(pages.total) || 0;
    const paginationArray = buildCompactPagination(totalPages, pages.page || page);

        return res.render("admin/products/product", {
            products,
            title: "Quản Lý Sản Phẩm",
            success: req.flash('success'), 
            errors: req.flash('errors'),
            page: pages.page || page,
            prev: pages.hasPrev ? pages.prev : 1,
            next: pages.hasNext ? pages.next : totalPages,
            totalPages: totalPages,
            paginate: paginationArray,
        });

    } catch (error) {
        console.error("Lỗi khi tải trang quản lý Sản phẩm:", error.message);
        const errorMessage = error.response?.data?.message || "Lỗi Server Nội bộ khi gọi API sản phẩm.";
        return res.status(error.response?.status || 500).send(errorMessage);
    }
};

// --- 2. CREATE (GET /admin/products/create) ---
exports.create = async (req, res) => { 
    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        // Lấy danh sách Category để điền vào dropdown
        const categoriesApiUrl = `${baseUrl}${apiPrefix}/categories`; 
        const categoriesResponse = await axios.get(categoriesApiUrl);
        const categories = categoriesResponse.data.data || [];

        return res.render("admin/products/add_product", { 
            title: "Thêm Sản Phẩm Mới",
            categories: categories,
            errors: req.flash('errors'),
            oldData: req.flash('oldData')
        }); 
    } catch (error) {
        console.error("Lỗi khi tải trang thêm mới SP:", error.message);
        return res.status(500).send("Không thể tải Categories cho trang thêm mới.");
    }
};

// --- 3. STORE (POST /admin/products/store) ---
exports.store = async (req, res) => { 
    // Middleware upload.single('image') đã chạy trước hàm này.
    
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
        req.flash('errors', validationErrors.array());
        req.flash('oldData', [req.body]); 
        return res.redirect("/admin/products/create");
    }

    // 2. Kiểm tra file upload
    if (!req.file) {
        req.flash('errors', [{ msg: "Product image is required" }]);
        req.flash('oldData', [req.body]); 
        return res.redirect("/admin/products/create");
    }

    try {
        // Xử lý trực tiếp thay vì gọi API để tránh xung đột multipart
        const ProductModel = require('../../models/product');
        
        const imagePath = normalizeImagePath(req.file.filename, PRODUCT_SUBFOLDER);

        const productData = {
            ...req.body,
            image: imagePath,
            // is_stock: select với value="1" hoặc "0"
            is_stock: req.body.is_stock === '1' || req.body.is_stock === 1 || req.body.is_stock === true,
            // is_featured: checkbox với value="1", unchecked không gửi field
            is_featured: req.body.is_featured === '1' || req.body.is_featured === 1 || req.body.is_featured === true,
        };

        // Tạo product trực tiếp
        await ProductModel.create(productData);
        
        req.flash('success', 'Thêm sản phẩm thành công!'); 
        return res.redirect("/admin/products");

    } catch (error) {
        console.error("Lỗi khi thêm Sản phẩm:", error.message);
        
        // Xóa file đã upload nếu DB báo lỗi
        if (req.file) {
            const fs = require('fs');
            const path = require('path');
            const filePath = path.join(__dirname, '../../../public/upload/products', req.file.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        req.flash('errors', [{ msg: error.message || 'Lỗi server khi lưu sản phẩm.' }]); 
        req.flash('oldData', [req.body]); 
        return res.redirect("/admin/products/create");
    }
};

// --- 4. EDIT (GET /admin/products/edit/:id) ---
exports.edit = async (req, res) => { 
    try {
        const { id } = req.params;
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        
        // 1. Gọi API để lấy dữ liệu sản phẩm chi tiết
        const productApiUrl = `${baseUrl}${apiPrefix}/products/${id}`; 
    const productResponse = await axios.get(productApiUrl, { headers: req.authHeaders });
    const productRaw = productResponse.data.data;

        // 2. Lấy danh sách Category để điền vào dropdown
        const categoriesApiUrl = `${baseUrl}${apiPrefix}/categories`; 
        const categoriesResponse = await axios.get(categoriesApiUrl);
        const categories = categoriesResponse.data.data || [];

        if (!productRaw) {
            req.flash('errors', [{ msg: 'Sản phẩm không tồn tại.' }]);
            return res.redirect("/admin/products");
        }
        const product = {
            ...productRaw,
            image: normalizeImagePath(productRaw.image, PRODUCT_SUBFOLDER)
        };

        return res.render("admin/products/edit_product", { 
            title: "Chỉnh Sửa Sản Phẩm",
            product: product, 
            categories: categories,
            errors: req.flash('errors') 
        }); 
    } catch (error) {
        console.error(`Lỗi khi tải trang chỉnh sửa SP ID ${req.params.id}:`, error.message);
        req.flash('errors', [{ msg: 'Lỗi server khi truy cập chỉnh sửa sản phẩm.' }]);
        return res.redirect("/admin/products");
    }
};

// --- 5. UPDATE (POST /admin/products/update/:id) ---
exports.update = async (req, res) => { 
    const { id } = req.params;

    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
        req.flash('errors', validationErrors.array());
        return res.redirect(`/admin/products/edit/${id}`); 
    }

    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const apiUrl = `${baseUrl}${apiPrefix}/products/${id}`; 

        let updateData = { ...req.body };
        
        if (req.file) {
            // File đã được lưu bởi multer trong site.js
            updateData.image = normalizeImagePath(req.file.filename, PRODUCT_SUBFOLDER);
        }
        
        // Chuyển đổi boolean cho is_stock
        if (updateData.is_stock !== undefined) {
             updateData.is_stock = updateData.is_stock === '1' || updateData.is_stock === 1 || updateData.is_stock === true;
        }

        updateData.is_featured = updateData.is_featured === '1' || updateData.is_featured === 1 || updateData.is_featured === true;

        const ProductModel = require('../../models/product');
        const fs = require('fs');
        const path = require('path');
        
        const product = await ProductModel.findById(id);
        if (!product) {
            req.flash('errors', [{ msg: 'Sản phẩm không tồn tại.' }]);
            return res.redirect("/admin/products");
        }
        
        // Xóa ảnh cũ nếu có ảnh mới
        if (req.file && product.image) {
            const oldImageFilename = path.basename(product.image);
            const oldImagePath = path.join(__dirname, '../../../public/upload/products', oldImageFilename);
            if (fs.existsSync(oldImagePath)) {
                fs.unlink(oldImagePath, (err) => {
                    if (err) console.error("Failed to delete old image:", err);
                });
            }
        }
        
        // Cập nhật product
        const updatedProduct = await ProductModel.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );
        
        req.flash('success', `Cập nhật sản phẩm ${product.name} thành công!`); 
        return res.redirect("/admin/products");

    } catch (error) {
        console.error(`Lỗi khi cập nhật SP ID ${id}:`, error.message);
        const apiError = error.message || 'Lỗi server khi cập nhật sản phẩm.';

        req.flash('errors', [{ msg: apiError }]);
        return res.redirect(`/admin/products/edit/${id}`);
    }
};

// --- 6. DESTROY (GET /admin/products/delete/:id) ---
exports.destroy = async (req, res) => { 
    try {
        const { id } = req.params;
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const apiUrl = `${baseUrl}${apiPrefix}/products/${id}`; 
        
        // 1. Gọi API DELETE để xóa sản phẩm (API Controller sẽ xử lý xóa DB và file ảnh cũ)
    await axios.delete(apiUrl, { headers: req.authHeaders }); 
        
        req.flash('success', "Xóa sản phẩm thành công!");
        res.redirect("/admin/products");
    } catch (error) {
        console.error(`Lỗi khi xóa SP ID ${req.params.id}:`, error.message);
        const apiError = error.response?.data?.message || "Lỗi xóa sản phẩm.";
        
        req.flash('errors', [{ msg: apiError }]);
        res.redirect("/admin/products");
    }
};