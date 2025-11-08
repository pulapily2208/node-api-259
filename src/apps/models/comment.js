const mongoose = require("../../common/init.mongo")();
const commentSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Types.ObjectId,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved"],
      default: "pending",
    }
  },
  { timestamps: true }
);
const CommentModel = mongoose.model("Comments", commentSchema, "comments");
module.exports = CommentModel;
