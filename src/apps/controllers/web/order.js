const OrderModel = require("../../models/order");
const ProductModel = require("../../models/product");
const { buildCompactPagination } = require("../../../libs/view.pagination");

const STATUS_OPTIONS = ["pending", "confirmed", "shipping", "delivered", "canceled"]; 

exports.list = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const filter = {};
    const { status, search } = req.query;

    if (status && STATUS_OPTIONS.includes(status)) {
      filter.status = status;
    }

    if (search && search.trim()) {
      const s = search.trim();
      const idFilter = s.match(/^[a-f\d]{24}$/i) ? [{ _id: s }] : [];
      filter.$or = [
        { email: new RegExp(s, 'i') },
        { phone: new RegExp(s, 'i') },
        ...idFilter
      ];
    }

    const [orders, total] = await Promise.all([
      OrderModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      OrderModel.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit) || 1;
    const paginate = buildCompactPagination(totalPages, page);

    res.render("admin/orders/orders", {
      title: "Quản lý đơn hàng",
      orders,
      page,
      totalPages,
      paginate,
      prev: page > 1 ? page - 1 : 1,
      next: page < totalPages ? page + 1 : totalPages,
      currentStatus: status || 'all',
      search: search || '',
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (error) {
    console.error("Error listing orders:", error);
    req.flash('error', 'Không thể tải danh sách đơn hàng');
    res.redirect('/admin');
  }
};

exports.detail = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await OrderModel.findById(id).lean();
    if (!order) {
      req.flash('error', 'Không tìm thấy đơn hàng');
      return res.redirect('/admin/orders');
    }

    const ids = order.items.map(i => i.prd_id);
    const products = await ProductModel.find({ _id: { $in: ids } })
      .select('name thumbnail price')
      .lean();
    const map = new Map(products.map(p => [String(p._id), p]));

    const items = order.items.map(it => {
      const p = map.get(String(it.prd_id));
      return {
        ...it,
        name: p ? p.name : 'Sản phẩm đã xóa',
        thumb: p ? p.thumbnail : null,
        unitPrice: it.price,
        subTotal: it.qty * it.price
      }
    });

    const canUpdateStatuses = STATUS_OPTIONS;

    res.render('admin/orders/order_detail', {
      title: 'Chi tiết đơn hàng',
      order,
      items,
      canUpdateStatuses,
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (error) {
    console.error('Error getting order detail:', error);
    req.flash('error', 'Có lỗi khi tải chi tiết đơn hàng');
    res.redirect('/admin/orders');
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!STATUS_OPTIONS.includes(status)) {
      req.flash('error', 'Trạng thái không hợp lệ');
      return res.redirect(`/admin/orders/detail/${id}`);
    }

    const order = await OrderModel.findById(id);
    if (!order) {
      req.flash('error', 'Không tìm thấy đơn hàng');
      return res.redirect('/admin/orders');
    }

    order.status = status;
    await order.save();

    req.flash('success', 'Cập nhật trạng thái thành công');
    res.redirect(`/admin/orders/detail/${id}`);
  } catch (error) {
    console.error('Error updating order status:', error);
    req.flash('error', 'Không thể cập nhật trạng thái');
    res.redirect(`/admin/orders/detail/${req.params.id}`);
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const del = await OrderModel.findByIdAndDelete(id);
    if (!del) {
      req.flash('error', 'Không tìm thấy đơn hàng');
      return res.redirect('/admin/orders');
    }
    req.flash('success', 'Xóa đơn hàng thành công');
    res.redirect('/admin/orders');
  } catch (error) {
    console.error('Error deleting order:', error);
    req.flash('error', 'Không thể xóa đơn hàng');
    res.redirect('/admin/orders');
  }
};
