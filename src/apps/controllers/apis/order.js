const ProductModel = require("../../models/product");
const OrderModel = require("../../models/order");
const sendMail = require("../../../emails/mail");
const config = require("config");
exports.order = async (req, res) => {
  try {
    let customerInfo = {};
    if (req.customer) {
      // Customer
      customerInfo = {
        customer_id: req.customer._id,
        fullName: req.customer.fullName,
        email: req.customer.email,
        phone: req.customer.phone,
        address: req.customer.address,
      };
    } else {
      // Guest
      const { fullName, email, phone, address } = req.body;
      customerInfo = { fullName, email, phone, address };
    }
    // Create new items
    let totalPrice = 0;
    let orderItems = [];
    let orderMail = [];
    const { items } = req.body;
    for (let item of items) {
      // Hỗ trợ cả product_id và prd_id
      const productId = item.product_id || item.prd_id;
      
      if (!productId) {
        return res.status(400).json({
          status: "error",
          message: "Product ID is required in each item",
        });
      }
      
      const product = await ProductModel.findById(productId);
      if (!product) {
        return res.status(400).json({
          status: "error",
          message: `Product ${productId} not found`,
        });
      }
      const itemPrice = product.price;
      const quantity = item.quantity || item.qty || 1;
      
      totalPrice += quantity * itemPrice;
      orderItems.push({
        prd_id: product._id,
        qty: quantity,
        price: itemPrice,
      });
      orderMail.push({
        name: product.name,
        qty: quantity,
        price: itemPrice,
      });
    }
    // Create order
    const order = await OrderModel.create({
      ...customerInfo,
      totalPrice,
      items: orderItems,
    });
    // Send mail
    await sendMail(`${config.get("mail.mailTemplate")}/mail-order.ejs`, {
      ...customerInfo,
      totalPrice,
      items: orderMail,
      subject: "Xác nhận đơn hàng từ Vietpro Shop ✔",
    });
    // Response
    return res.status(201).json({
      status: "success",
      message: "Create order successfully",
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
exports.findByCustomerId = async (req, res) => {
  try {
    if (!req.customer) {
      return res.status(401).json({
        status: "error",
        message: "Customer authentication required",
      });
    }

    const orders = await OrderModel.find({ customer_id: req.customer._id })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      status: "success",
      message: "Get orders successfully",
      data: orders,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
};
exports.findOne = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await OrderModel.findById(id).lean();

    if (!order) {
      return res.status(404).json({
        status: "error",
        message: "Order not found",
      });
    }

    // Nếu là customer, kiểm tra quyền truy cập
    if (req.customer && String(order.customer_id) !== String(req.customer._id)) {
      return res.status(403).json({
        status: "error",
        message: "Access denied",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Get order successfully",
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
exports.cancel = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await OrderModel.findById(id);

    if (!order) {
      return res.status(404).json({
        status: "error",
        message: "Order not found",
      });
    }

    // Nếu là customer, kiểm tra quyền sở hữu
    if (req.customer && String(order.customer_id) !== String(req.customer._id)) {
      return res.status(403).json({
        status: "error",
        message: "Access denied",
      });
    }

    // Chỉ cho phép hủy đơn hàng ở trạng thái pending hoặc confirmed
    if (!["pending", "confirmed"].includes(order.status)) {
      return res.status(400).json({
        status: "error",
        message: `Cannot cancel order with status: ${order.status}`,
      });
    }

    order.status = "canceled";
    await order.save();

    return res.status(200).json({
      status: "success",
      message: "Order canceled successfully",
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
