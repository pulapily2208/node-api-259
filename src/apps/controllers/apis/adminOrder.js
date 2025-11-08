const OrderModel = require("../../models/order");
const paginate = require("../../../libs/paginate");

/**
 * 1. API danh sách tất cả đơn hàng dành cho Admin
 */
const findAll = async (req, res) => {
  try {
    const query = {};
    const sort = { _id: -1 };

    if (req.query.status) {
      query.status = req.query.status;
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = page * limit - limit;

    // Check if user is admin before proceeding
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        status: "error",
        message: "Access denied. Admin privileges required.",
      });
    }

    const orders = await OrderModel.find(query)
      .skip(skip)
      .limit(limit)
      .sort(sort)
      .lean()
      .maxTimeMS(30000); // Add timeout

    return res.status(200).json({
      status: "success",
      message: "Get all orders successfully",
      data: orders,
      pages: await paginate(page, limit, query, OrderModel),
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * 2. API sửa trạng thái đơn hàng dành cho Admin
 * (confirmed, shipping, delivered, canceled)
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Các trạng thái hợp lệ
    const allowedStatus = ["confirmed", "shipping", "delivered", "canceled"];

    if (!status || !allowedStatus.includes(status)) {
      return res.status(400).json({
        status: "error",
        message: `Invalid status. Must be one of: ${allowedStatus.join(", ")}`,
      });
    }

    const order = await OrderModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        status: "error",
        message: `Order with id ${id} not found`,
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Order updated successfully",
      data: order,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * 3. API xoá đơn hàng dành cho Admin
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await OrderModel.findByIdAndDelete(id);

    if (!order) {
      return res.status(404).json({
        status: "error",
        message: `Order with id ${id} not found`,
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Order deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
    findAll,
    update,
    remove,
};