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
      const product = await ProductModel.findById(item.prd_id);
      if (!product) {
        return res.status(400).json({
          status: "error",
          message: `Product ${item.prd_id} not found`,
        });
      }
      const itemPrice = product.price;
      totalPrice += item.qty * itemPrice;
      orderItems.push({
        prd_id: product._id,
        qty: item.qty,
        price: itemPrice,
      });
      orderMail.push({
        name: product.name,
        qty: item.qty,
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
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
};
