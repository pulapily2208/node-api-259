const CommentModel = require("../../models/comment");
const ProductModel = require("../../models/product");
const { buildCompactPagination } = require("../../../libs/view.pagination");

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
    const paginate = buildCompactPagination(totalPages, page);

    res.render("admin/comments/comments", {
      title: "Danh sách bình luận",
      comments: commentsWithCensored,
      page,
      totalPages,
      paginate,
      prev: page > 1 ? page - 1 : 1,
      next: page < totalPages ? page + 1 : totalPages,
      currentStatus: req.query.status || "all",
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (error) {
    console.error("Error listing comments:", error);
    console.error("Error stack:", error.stack);
    res.status(500).send("Internal server error: " + error.message);
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
      comment: commentObj,
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (error) {
    console.error("Error getting comment detail:", error);
    res.status(500).send("Internal server error");
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'approved'].includes(status)) {
      req.flash("error", "Trạng thái không hợp lệ");
      return res.redirect(`/admin/comments/detail/${id}`);
    }

    const comment = await CommentModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!comment) {
      req.flash("error", "Không tìm thấy bình luận");
      return res.redirect("/admin/comments");
    }

    req.flash("success", `Đã cập nhật trạng thái thành ${status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt'}`);
    res.redirect(`/admin/comments/detail/${id}`);
  } catch (error) {
    console.error("Error updating comment status:", error);
    req.flash("error", "Có lỗi xảy ra khi cập nhật trạng thái");
    res.redirect("/admin/comments");
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
    res.redirect("/admin/comments");
  } catch (error) {
    console.error("Error deleting comment:", error);
    req.flash("error", "Có lỗi xảy ra khi xóa bình luận");
    res.redirect("/admin/comments");
  }
};
