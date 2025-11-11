const CommentModel = require("../../models/comment");
const ProductModel = require("../../models/product");
const viewPagination = require("../../../libs/view.pagination");

// Hàm lọc từ thô tục để hiển thị
const PROHIBITED_WORDS = [
  "đcm","đm","cmm","cc","shit","cút","mm","fuck","đéo","lồn","địt","chó","bitch","damn"
];

const displayCensoredContent = (content) => {
  if (!content) return '';
  let censoredContent = content; 
  
  for (const word of PROHIBITED_WORDS) {
    const regex = new RegExp(`([\\s\\W]|^)(${word})([\\s\\W]|$)`, 'gi');
    
    censoredContent = censoredContent.replace(regex, (match, before, matchedWord, after) => {
      const censorString = '*'.repeat(matchedWord.length);
      return before + censorString + after;
    });
  }
  return censoredContent; 
};

exports.list = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const [comments, total] = await Promise.all([
      CommentModel.find(filter)
        .populate("product_id", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      CommentModel.countDocuments(filter)
    ]);

    // Lọc nội dung cho hiển thị
    const commentsWithCensored = comments.map(comment => {
      const commentObj = comment.toObject();
      commentObj.displayContent = displayCensoredContent(commentObj.content || commentObj.description);
      return commentObj;
    });

    const totalPages = Math.ceil(total / limit);
    const paginate = viewPagination(page, totalPages);

    res.render("admin/comments/comments", {
      title: "Danh sách bình luận",
      comments: commentsWithCensored,
      page,
      totalPages,
      paginate,
      prev: page > 1 ? page - 1 : 1,
      next: page < totalPages ? page + 1 : totalPages,
      currentStatus: req.query.status || "all"
    });
  } catch (error) {
    console.error("Error listing comments:", error);
    res.status(500).send("Internal server error");
  }
};

exports.detail = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await CommentModel.findById(id).populate("product_id", "name image price");

    if (!comment) {
      return res.status(404).send("Comment not found");
    }

    const commentObj = comment.toObject();
    commentObj.displayContent = displayCensoredContent(commentObj.content || commentObj.description);

    res.render("admin/comments/comment_detail", {
      title: "Chi tiết bình luận",
      comment: commentObj
    });
  } catch (error) {
    console.error("Error getting comment detail:", error);
    res.status(500).send("Internal server error");
  }
};

exports.showCreate = async (req, res) => {
  try {
    const products = await ProductModel.find({}).select("name");
    res.render("admin/comments/add_comment", {
      title: "Thêm bình luận",
      products,
      error: null
    });
  } catch (error) {
    console.error("Error showing create form:", error);
    res.status(500).send("Internal server error");
  }
};

exports.create = async (req, res) => {
  try {
    const { product_id, name, email, content, status } = req.body;

    const newComment = await CommentModel.create({
      product_id,
      name,
      email,
      content,
      status: status || "pending"
    });

    req.flash("success", "Thêm bình luận thành công!");
    res.redirect("/api/admin/comments");
  } catch (error) {
    console.error("Error creating comment:", error);
    const products = await ProductModel.find({}).select("name");
    res.render("admin/comments/add_comment", {
      title: "Thêm bình luận",
      products,
      error: "Có lỗi xảy ra khi thêm bình luận"
    });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const comment = await CommentModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found"
      });
    }

    res.json({
      success: true,
      message: "Cập nhật trạng thái thành công",
      data: comment
    });
  } catch (error) {
    console.error("Error updating comment status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await CommentModel.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).send("Comment not found");
    }

    req.flash("success", "Xóa bình luận thành công!");
    res.redirect("/api/admin/comments");
  } catch (error) {
    console.error("Error deleting comment:", error);
    req.flash("error", "Có lỗi xảy ra khi xóa bình luận");
    res.redirect("/api/admin/comments");
  }
};
