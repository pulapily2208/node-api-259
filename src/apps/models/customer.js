const mongoose = require("../../common/init.mongo")();
const customerSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    role: {
        type: String,
        enum: ['customer', 'admin'], 
        default: 'customer'
    }
  },
  { timestamps: true }
);
const CustomerModel = mongoose.model("Customers", customerSchema, "customers");
module.exports = CustomerModel;
