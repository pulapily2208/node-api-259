const mongoose = require("../../common/init.mongo")();
const orderSchema = new mongoose.Schema(
  {
    customer_id: {
      type: mongoose.Types.ObjectId,
      default: null,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      required: true,
    },
    phone: {
      type: String,
      trim: true,
      required: true,
    },
    address: {
      type: String,
      trim: true,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipping", "delivered", "canceled"],
      default: "pending",
    },
    items: [
      {
        prd_id: {
          type: mongoose.Types.ObjectId,
          required: true,
        },
        qty: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
  },
  { timestamps: true }
);
const OrderModel = mongoose.model("Orders", orderSchema, "orders");
module.exports = OrderModel;
