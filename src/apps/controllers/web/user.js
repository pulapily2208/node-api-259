const UserModel = require("../../models/user");
const bcrypt = require("bcrypt");
const { buildCompactPagination } = require("../../../libs/view.pagination");
const { deleteUserToken } = require("../../../libs/token.service");

exports.list = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.search) {
      filter.email = new RegExp(req.query.search, 'i');
    }
    if (req.query.role) {
      filter.role = req.query.role;
    }

    const [users, total] = await Promise.all([
      UserModel.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      UserModel.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit);
    const paginate = buildCompactPagination(totalPages, page);

    res.render("admin/users/users", {
      title: "Danh sách thành viên",
      users,
      page,
      totalPages,
      paginate,
      prev: page > 1 ? page - 1 : 1,
      next: page < totalPages ? page + 1 : totalPages,
      search: req.query.search || '',
      roleFilter: req.query.role || 'all',
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (error) {
    console.error("Error listing users:", error);
    console.error("Error stack:", error.stack);
    res.status(500).send("Internal server error: " + error.message);
  }
};

exports.detail = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await UserModel.findById(id).select('-password');

    if (!user) {
      req.flash("error", "Không tìm thấy thành viên");
      return res.redirect("/admin/users");
    }

    res.render("admin/users/user_detail", {
      title: "Chi tiết thành viên",
      user,
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (error) {
    console.error("Error getting user detail:", error);
    req.flash("error", "Có lỗi xảy ra");
    res.redirect("/admin/users");
  }
};

exports.showCreate = async (req, res) => {
  try {
    res.render("admin/users/add_user", {
      title: "Thêm thành viên",
      error: null
    });
  } catch (error) {
    console.error("Error showing create form:", error);
    req.flash("error", "Có lỗi xảy ra");
    res.redirect("/admin/users");
  }
};

exports.create = async (req, res) => {
  try {
    const { email, password, confirmPassword, role } = req.body;

    // Validation
    if (!email || !password || !confirmPassword) {
      return res.render("admin/users/add_user", {
        title: "Thêm thành viên",
        error: "Vui lòng điền đầy đủ thông tin"
      });
    }

    if (password !== confirmPassword) {
      return res.render("admin/users/add_user", {
        title: "Thêm thành viên",
        error: "Mật khẩu xác nhận không khớp"
      });
    }

    if (password.length < 6) {
      return res.render("admin/users/add_user", {
        title: "Thêm thành viên",
        error: "Mật khẩu phải có ít nhất 6 ký tự"
      });
    }

    // Check email exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.render("admin/users/add_user", {
        title: "Thêm thành viên",
        error: "Email đã tồn tại"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    await UserModel.create({
      email,
      password: hashedPassword,
      role: role || 'member'
    });

    req.flash("success", "Thêm thành viên thành công!");
    res.redirect("/admin/users");
  } catch (error) {
    console.error("Error creating user:", error);
    res.render("admin/users/add_user", {
      title: "Thêm thành viên",
      error: "Có lỗi xảy ra khi thêm thành viên"
    });
  }
};

exports.showEdit = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await UserModel.findById(id).select('-password');

    if (!user) {
      req.flash("error", "Không tìm thấy thành viên");
      return res.redirect("/admin/users");
    }

    res.render("admin/users/edit_user", {
      title: "Chỉnh sửa thành viên",
      user,
      error: null
    });
  } catch (error) {
    console.error("Error showing edit form:", error);
    req.flash("error", "Có lỗi xảy ra");
    res.redirect("/admin/users");
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password, confirmPassword, role } = req.body;

    // Validation
    if (!email) {
      const user = await UserModel.findById(id).select('-password');
      return res.render("admin/users/edit_user", {
        title: "Chỉnh sửa thành viên",
        user,
        error: "Email không được để trống"
      });
    }

    // Check email unique (except current user)
    const existingEmail = await UserModel.findOne({ 
      email, 
      _id: { $ne: id } 
    });
    if (existingEmail) {
      const user = await UserModel.findById(id).select('-password');
      return res.render("admin/users/edit_user", {
        title: "Chỉnh sửa thành viên",
        user,
        error: "Email đã tồn tại"
      });
    }

    const updateData = {
      email,
      role: role || 'member'
    };

    // Update password if provided
    if (password) {
      if (password !== confirmPassword) {
        const user = await UserModel.findById(id).select('-password');
        return res.render("admin/users/edit_user", {
          title: "Chỉnh sửa thành viên",
          user,
          error: "Mật khẩu xác nhận không khớp"
        });
      }

      if (password.length < 6) {
        const user = await UserModel.findById(id).select('-password');
        return res.render("admin/users/edit_user", {
          title: "Chỉnh sửa thành viên",
          user,
          error: "Mật khẩu phải có ít nhất 6 ký tự"
        });
      }

      updateData.password = await bcrypt.hash(password, 10);
    }

    await UserModel.findByIdAndUpdate(id, updateData);

    req.flash("success", "Cập nhật thành viên thành công!");
    res.redirect(`/admin/users/detail/${id}`);
  } catch (error) {
    console.error("Error updating user:", error);
    const user = await UserModel.findById(req.params.id).select('-password');
    res.render("admin/users/edit_user", {
      title: "Chỉnh sửa thành viên",
      user,
      error: "Có lỗi xảy ra khi cập nhật"
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete user tokens
    try {
      await deleteUserToken(id);
    } catch (tokenError) {
      console.error("Error deleting user tokens:", tokenError);
    }

    const result = await UserModel.findByIdAndDelete(id);

    if (!result) {
      req.flash("error", "Không tìm thấy thành viên");
      return res.redirect("/admin/users");
    }

    req.flash("success", "Xóa thành viên thành công!");
    res.redirect("/admin/users");
  } catch (error) {
    console.error("Error deleting user:", error);
    req.flash("error", "Có lỗi xảy ra khi xóa thành viên");
    res.redirect("/admin/users");
  }
};
