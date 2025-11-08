const mongoose = require("../../common/init.mongo")();
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
        type: String,
        enum: ['admin', 'member'],
        default: 'member',
        required: true,
    },
  },
  { timestamps: true }
);
const UserModel = mongoose.model("Users", userSchema, "users");
module.exports = UserModel;