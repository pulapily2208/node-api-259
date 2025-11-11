const axios = require('axios');
const config = require('config');
const { body, validationResult } = require('express-validator'); 

const apiPrefix = config.get("app.prefixApiVersion"); 
const LIMIT = 10;

const { buildCompactPagination } = require('../../../libs/view.pagination');

// --- 1. INDEX (GET /admin/categories) ---
exports.index = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;

        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const apiUrl = `${baseUrl}${apiPrefix}/categories`; 
        
    const apiResponse = await axios.get(apiUrl, { headers: req.authHeaders });

        const allCategories = apiResponse.data.data || [];
        const totalItems = allCategories.length;
        const totalPages = Math.ceil(totalItems / LIMIT);

        const skip = (page - 1) * LIMIT;
        const categoriesForPage = allCategories.slice(skip, skip + LIMIT);

    const paginationArray = buildCompactPagination(totalPages, page);
        const prevPage = Math.max(1, page - 1);
        const nextPage = Math.min(totalPages, page + 1);

        // 4. Render View EJS (admin/categories/category.ejs)
        return res.render("admin/categories/category", {
            categories: categoriesForPage, 
            title: "Quản Lý Danh Mục",
            success: req.flash('success'), 
            errors: req.flash('errors'),
            page: page,
            prev: prevPage, 
            next: nextPage,
            totalPages: totalPages, 
            paginate: paginationArray,
        });
    } catch (error) {
        console.error("Lỗi khi tải trang quản lý Category:", error.message);
        const apiError = error.response?.data?.message || "Lỗi Server Nội bộ khi gọi API danh mục.";
        return res.status(error.response?.status || 500).send(apiError);
    }
};

// --- 2. CREATE (GET /admin/categories/create) ---
exports.create = (req, res) => {
    return res.render("admin/categories/add_category", {
        title: "Thêm Mới Danh Mục",
        errors: req.flash('errors'),
        oldData: req.flash('oldData')
    });
};


// --- 3. STORE (POST /admin/categories/store) ---
exports.store = async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
        req.flash('errors', validationErrors.array());
        req.flash('oldData', [req.body]); 
        return res.redirect("/admin/categories/create");
    }

    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const apiUrl = `${baseUrl}${apiPrefix}/categories`; 

    await axios.post(apiUrl, { name: req.body.name }, { headers: req.authHeaders });
        
        req.flash('success', 'Thêm danh mục thành công!'); 
        return res.redirect("/admin/categories");
    } catch (error) {
        const apiError = error.response?.data?.message || 'Lỗi server khi lưu danh mục.';
        
        req.flash('errors', [{ msg: apiError }]); 
        req.flash('oldData', [req.body]); 
        return res.redirect("/admin/categories/create");
    }
};

// --- 4. EDIT (GET /admin/categories/edit/:id) ---
exports.edit = async (req, res) => {
    try {
        const { id } = req.params;
        const baseUrl = `${req.protocol}://${req.get('host')}`;
    const apiResponse = await axios.get(`${baseUrl}${apiPrefix}/categories/${id}` , { headers: req.authHeaders }); 
        
        const category = apiResponse.data.data;
        
        if (!category) {
            req.flash('errors', [{ msg: 'Danh mục không tồn tại.' }]);
            return res.redirect("/admin/categories");
        }
        
        return res.render("admin/categories/edit_category", {
            title: "Chỉnh Sửa Danh Mục",
            category: category, 
            errors: req.flash('errors') 
        });
    } catch (error) {
        console.error(`Lỗi khi lấy Category ID ${req.params.id}:`, error.message);
        req.flash('errors', [{ msg: 'Lỗi server khi truy cập chỉnh sửa danh mục.' }]);
        return res.redirect("/admin/categories");
    }
};


// --- 5. UPDATE (POST /admin/categories/update/:id) ---
exports.update = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
        req.flash('errors', validationErrors.array());
        return res.redirect(`/admin/categories/edit/${id}`); 
    }

    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const apiUrl = `${baseUrl}${apiPrefix}/categories/${id}`; 
        
    await axios.patch(apiUrl, { name }, { headers: req.authHeaders }); 
        
        req.flash('success', `Cập nhật danh mục "${name}" thành công!`); 
        return res.redirect("/admin/categories");
    } catch (error) {
        const apiError = error.response?.data?.message || 'Lỗi server khi cập nhật danh mục.';
        
        req.flash('errors', [{ msg: apiError }]);
        return res.redirect(`/admin/categories/edit/${id}`);
    }
};

// --- 6. DESTROY (GET /admin/categories/delete/:id) ---
exports.destroy = async (req, res) => {
    try {
        const { id } = req.params;
        const baseUrl = `${req.protocol}://${req.get('host')}`;

    await axios.delete(`${baseUrl}${apiPrefix}/categories/${id}`, { headers: req.authHeaders }); 
        req.flash('success', "Xóa danh mục thành công!");
        res.redirect("/admin/categories");
    } catch (error) {
        console.error("Lỗi khi xóa Category:", error.message);
        const apiError = error.response?.data?.message || "Lỗi xóa danh mục.";
        req.flash('errors', [{ msg: apiError }]);
        res.redirect("/admin/categories");
    }
};