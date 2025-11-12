const mongoose = require("../../common/init.mongo")();
const commentSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Types.ObjectId,
      ref: "Products",
      required: true,
    },
    customer_id: {
      type: mongoose.Types.ObjectId,
      ref: "Customers",
      required: false,
    },
    name: {
      type: String,
      required: false,
    },
    full_name: {
      type: String,
      get: function() {
        return this.name;
      }
    },
    email: {
      type: String,
      required: false,
    },
    content: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      get: function() {
        return this.content;
      }
    },
    status: {
      type: String,
      enum: ["pending", "approved", "active", "inactive"],
      default: "pending",
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true }
  }
);
const CommentModel = mongoose.model("Comments", commentSchema, "comments");
module.exports = CommentModel;
