const CategoryModel = require("../../models/category");
const { body, validationResult } = require("express-validator"); 
const paginate = require("../../../libs/paginate");
// 1. Hiển thị danh sách Category 
exports.index = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = 10; 
        const skip = page * limit - limit;
        const query = {};

        const categories = await CategoryModel.find(query)
            .skip(skip)
            .limit(limit)
            .sort({ _id: -1 });

        const pages = await paginate(page, limit, query, CategoryModel); 

        // Mảng đơn giản hóa để khớp với vòng lặp trong EJS
        const paginationArray = Array.from({ length: pages.total }, (_, i) => i + 1);
        // Render file 'admin/categories/category.ejs'
        return res.render("admin/categories/category", {
            categories: categories,
            title: "Quản Lý Danh Mục",
            success: req.flash('success'), 
            errors: req.flash('errors'),
            page: pages.page,
            prev: pages.hasPrev ? pages.prev : 1,
            next: pages.hasNext ? pages.next : pages.total,
            totalPages: pages.total,
            paginate: paginationArray, 
        });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách Category:", error);
        return res.status(500).send("Lỗi Server Nội bộ: " + error.message);
    }
};

// 2. Hiển thị trang thêm mới Category 
exports.create = (req, res) => {
    return res.render("admin/categories/add_category", {
        title: "Thêm Mới Danh Mục",
        errors: req.flash('errors'),
        oldData: req.flash('oldData')
    });
};

exports.storeRules = [
    body("name")
        .notEmpty().withMessage("Tên danh mục là bắt buộc")
        .custom(async (name) => {
            const category = await CategoryModel.findOne({ name });
            if (category) {
                return Promise.reject("Tên danh mục đã tồn tại");
            }
        }),
];

// 3. Xử lý Form POST để lưu Category (Store)
exports.store = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('errors', errors.array());
        req.flash('oldData', [req.body]); 
        return res.redirect("/admin/categories/create");
    }

    try {
        const { title } = req.body; 
        const name = req.body.name; 

        await CategoryModel.create({ name });
        
        req.flash('success', 'Thêm danh mục thành công!'); 
        return res.redirect("/admin/categories");
    } catch (error) {
        console.error("Lỗi khi thêm Category:", error);
        req.flash('errors', [{ msg: 'Lỗi server khi lưu danh mục.' }]);
        return res.redirect("/admin/categories/create");
    }
};
// 4. Hiển thị trang chỉnh sửa Category
exports.edit = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await CategoryModel.findById(id);

        if (!category) {
            req.flash('errors', [{ msg: 'Danh mục không tồn tại.' }]);
            return res.redirect("/admin/categories");
        }
        return res.render("admin/categories/edit_category", {
            title: "Chỉnh Sửa Danh Mục",
            category: category, // Truyền dữ liệu danh mục hiện tại
            errors: req.flash('errors') 
        });
    } catch (error) {
        console.error(`Lỗi khi lấy Category ID ${req.params.id}:`, error);
        req.flash('errors', [{ msg: 'Lỗi server khi truy cập chỉnh sửa danh mục.' }]);
        return res.redirect("/admin/categories");
    }
};

// BỔ SUNG: Middleware Validation Rules cho Update Category
exports.updateRules = [
    body("name")
        .notEmpty().withMessage("Tên danh mục là bắt buộc")
        .custom(async (name, { req }) => {
            const category = await CategoryModel.findOne({ name });
            if (category && category._id.toString() !== req.params.id) {
                return Promise.reject("Tên danh mục đã tồn tại");
            }
        }),
];

// 5. Xử lý Form POST để cập nhật Category (Update)
exports.update = async (req, res) => {
    const errors = validationResult(req);
    const { id } = req.params;
    const { name } = req.body;

    if (!errors.isEmpty()) {
        req.flash('errors', errors.array());
        return res.redirect(`/admin/categories/edit/${id}`); 
    }

    try {
        // 1. Tìm và cập nhật vào Database
        const updatedCategory = await CategoryModel.findByIdAndUpdate(
            id,
            { name },
            { new: true }
        );
        if (!updatedCategory) {
            req.flash('errors', [{ msg: 'Cập nhật thất bại: Danh mục không tồn tại.' }]);
            return res.redirect("/admin/categories");
        }
        // 2. Thông báo thành công và chuyển hướng về trang danh sách
        req.flash('success', `Cập nhật danh mục "${name}" thành công!`); 
        return res.redirect("/admin/categories");
    } catch (error) {
        console.error(`Lỗi khi cập nhật Category ID ${id}:`, error);
        req.flash('errors', [{ msg: 'Lỗi server khi cập nhật danh mục.' }]);
        return res.redirect(`/admin/categories/edit/${id}`);
    }
};

// 6. Xử lý Xóa Category (Destroy)
exports.destroy = async (req, res) => {
    try {
        const { id } = req.params;
        // 1. Kiểm tra xem danh mục có tồn tại không
        const category = await CategoryModel.findById(id);
        if (!category) {
            req.flash('errors', [{ msg: 'Danh mục không tồn tại để xóa.' }]);
            return res.redirect("/admin/categories");
        }
        // 2. Kiểm tra các sản phẩm đang sử dụng danh mục này
        // Đây là bước quan trọng để tránh lỗi tham chiếu.
        const productCount = await ProductModel.countDocuments({ category_id: id });
        
        if (productCount > 0) {
            // Nếu có sản phẩm, không cho phép xóa
            req.flash('errors', [{ msg: `Không thể xóa danh mục "${category.name}" vì có ${productCount} sản phẩm đang sử dụng.` }]);
            return res.redirect("/admin/categories");
        }

        // 3. Tiến hành xóa khỏi Database
        await CategoryModel.deleteOne({ _id: id });
        
        // 4. Thông báo thành công và chuyển hướng về trang danh sách
        req.flash('success', `Xóa danh mục "${category.name}" thành công!`); 
        return res.redirect("/admin/categories");

    } catch (error) {
        console.error(`Lỗi khi xóa Category ID ${req.params.id}:`, error);
        req.flash('errors', [{ msg: 'Lỗi server khi xóa danh mục.' }]);
        return res.redirect("/admin/categories");
    }
};