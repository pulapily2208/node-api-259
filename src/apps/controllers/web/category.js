const CategoryModel = require("../../models/category");
const paginate = require("../../../libs/paginate");

// [1] GET: Hiển thị danh sách danh mục
exports.index = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = 10;
    const skip = page * limit - limit;
    
    const categories = await CategoryModel.find()
      .skip(skip)
      .limit(limit)
      .sort({ _id: -1 });

    const pages = await paginate(page, limit, {}, CategoryModel);
    
    // Sử dụng res.render()
    return res.render("category", { 
      categories: categories,
      pages: pages.pages, 
      page: page, 
      next: pages.next, 
      prev: pages.prev, 
      totalPages: pages.total, 
      // Dữ liệu message (nếu có từ redirect flash)
      message: req.flash('message'),
      success: req.flash('success')
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send("Lỗi tải trang danh mục.");
  }
};

// [2] GET: Hiển thị form Thêm danh mục
exports.create = (req, res) => {
    return res.render("add_category", {
        success: req.flash('success'),
        message: req.flash('message'),
        oldData: req.flash('oldData')[0] || {},
    });
};

// [3] POST: Xử lý Thêm danh mục (logic CRUD tương tự file API)
exports.store = async (req, res) => {
  try {
    const { title: name } = req.body; // Lấy tên từ field 'title' trong EJS
    
    // Kiểm tra tên danh mục đã tồn tại
    const nameExists = await CategoryModel.findOne({ name });
    if (nameExists) {
        req.flash('success', false);
        req.flash('message', "Tên danh mục đã tồn tại!");
        req.flash('oldData', { title: name });
        return res.redirect("/admin/categories/create");
    }

    await CategoryModel.create({ name });
    
    req.flash('success', true);
    req.flash('message', "Thêm danh mục thành công!");
    return res.redirect("/admin/categories");
  } catch (error) {
    req.flash('success', false);
    req.flash('message', "Lỗi máy chủ: " + error.message);
    req.flash('oldData', req.body);
    return res.redirect("/admin/categories/create");
  }
};

// [4] GET: Hiển thị form Sửa danh mục
exports.edit = async (req, res) => {
    try {
        const category = await CategoryModel.findById(req.params.id);
        if (!category) {
            req.flash('success', false);
            req.flash('message', "Danh mục không tồn tại!");
            return res.redirect("/admin/categories");
        }
        return res.render("edit_category", {
            category: { _id: category._id, title: category.name }, // Chuẩn hóa data
            success: req.flash('success'),
            message: req.flash('message'),
            oldData: req.flash('oldData')[0] || {},
        });
    } catch (error) {
        req.flash('success', false);
        req.flash('message', "Lỗi máy chủ: " + error.message);
        return res.redirect("/admin/categories");
    }
};

// [5] POST: Xử lý Cập nhật danh mục
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { title: name } = req.body;
        
        // Kiểm tra tên mới có bị trùng với danh mục khác không
        const nameExists = await CategoryModel.findOne({ name, _id: { $ne: id } });
        if (nameExists) {
            req.flash('success', false);
            req.flash('message', "Tên danh mục đã tồn tại!");
            req.flash('oldData', { title: name });
            return res.redirect(`/admin/categories/edit/${id}`);
        }
        
        await CategoryModel.findByIdAndUpdate(id, { name });

        req.flash('success', true);
        req.flash('message', "Cập nhật danh mục thành công!");
        return res.redirect("/admin/categories");

    } catch (error) {
        req.flash('success', false);
        req.flash('message', "Lỗi máy chủ: " + error.message);
        req.flash('oldData', req.body);
        return res.redirect(`/admin/categories/edit/${req.params.id}`);
    }
};

// [6] GET: Xóa danh mục
exports.remove = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedCategory = await CategoryModel.findByIdAndDelete(id);

        if (!deletedCategory) {
            req.flash('success', false);
            req.flash('message', "Danh mục không tồn tại!");
        } else {
            req.flash('success', true);
            req.flash('message', "Xóa danh mục thành công!");
        }
        
        return res.redirect("/admin/categories");
    } catch (error) {
        req.flash('success', false);
        req.flash('message', "Lỗi máy chủ khi xóa: " + error.message);
        return res.redirect("/admin/categories");
    }
};