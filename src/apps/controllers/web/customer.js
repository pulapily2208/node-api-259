const CustomerModel = require("../../models/customer");
const bcrypt = require("bcrypt");
const { buildCompactPagination } = require("../../../libs/view.pagination");

exports.list = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.search) {
      filter.$or = [
        { fullName: new RegExp(req.query.search, 'i') },
        { email: new RegExp(req.query.search, 'i') },
        { phone: new RegExp(req.query.search, 'i') }
      ];
    }

    const [customers, total] = await Promise.all([
      CustomerModel.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      CustomerModel.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit);
    const paginate = buildCompactPagination(totalPages, page);

    res.render("admin/customers/customers", {
      title: "Danh sách khách hàng",
      customers,
      page,
      totalPages,
      paginate,
      prev: page > 1 ? page - 1 : 1,
      next: page < totalPages ? page + 1 : totalPages,
      search: req.query.search || '',
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (error) {
    console.error("Error listing customers:", error);
    console.error("Error stack:", error.stack);
    res.status(500).send("Internal server error: " + error.message);
  }
};

exports.detail = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await CustomerModel.findById(id).select('-password');

    if (!customer) {
      req.flash("error", "Không tìm thấy khách hàng");
      return res.redirect("/admin/customers");
    }

    res.render("admin/customers/customer_detail", {
      title: "Chi tiết khách hàng",
      customer,
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (error) {
    console.error("Error getting customer detail:", error);
    req.flash("error", "Có lỗi xảy ra");
    res.redirect("/admin/customers");
  }
};

exports.showEdit = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await CustomerModel.findById(id).select('-password');

    if (!customer) {
      req.flash("error", "Không tìm thấy khách hàng");
      return res.redirect("/admin/customers");
    }

    res.render("admin/customers/edit_customer", {
      title: "Chỉnh sửa khách hàng",
      customer,
      error: null
    });
  } catch (error) {
    console.error("Error showing edit form:", error);
    req.flash("error", "Có lỗi xảy ra");
    res.redirect("/admin/customers");
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, phone, address, role } = req.body;

    // Validation
    if (!fullName || !email || !phone || !address) {
      const customer = await CustomerModel.findById(id).select('-password');
      return res.render("admin/customers/edit_customer", {
        title: "Chỉnh sửa khách hàng",
        customer,
        error: "Vui lòng điền đầy đủ thông tin"
      });
    }

    // Check email unique (except current customer)
    const existingEmail = await CustomerModel.findOne({ 
      email, 
      _id: { $ne: id } 
    });
    if (existingEmail) {
      const customer = await CustomerModel.findById(id).select('-password');
      return res.render("admin/customers/edit_customer", {
        title: "Chỉnh sửa khách hàng",
        customer,
        error: "Email đã tồn tại"
      });
    }

    // Check phone unique (except current customer)
    const existingPhone = await CustomerModel.findOne({ 
      phone, 
      _id: { $ne: id } 
    });
    if (existingPhone) {
      const customer = await CustomerModel.findById(id).select('-password');
      return res.render("admin/customers/edit_customer", {
        title: "Chỉnh sửa khách hàng",
        customer,
        error: "Số điện thoại đã tồn tại"
      });
    }

    const updateData = {
      fullName,
      email,
      phone,
      address,
      role: role || 'customer'
    };

    await CustomerModel.findByIdAndUpdate(id, updateData);

    req.flash("success", "Cập nhật khách hàng thành công!");
    res.redirect(`/admin/customers/detail/${id}`);
  } catch (error) {
    console.error("Error updating customer:", error);
    const customer = await CustomerModel.findById(req.params.id).select('-password');
    res.render("admin/customers/edit_customer", {
      title: "Chỉnh sửa khách hàng",
      customer,
      error: "Có lỗi xảy ra khi cập nhật"
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await CustomerModel.findByIdAndDelete(id);

    if (!result) {
      req.flash("error", "Không tìm thấy khách hàng");
      return res.redirect("/admin/customers");
    }

    req.flash("success", "Xóa khách hàng thành công!");
    res.redirect("/admin/customers");
  } catch (error) {
    console.error("Error deleting customer:", error);
    req.flash("error", "Có lỗi xảy ra khi xóa khách hàng");
    res.redirect("/admin/customers");
  }
};
