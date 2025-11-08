const CommentModel = require("../../models/comment");
const paginate = require("../../../libs/paginate");

const PROHIBITED_WORDS = [
  "đcm","đm","cmm","cc","shit","cút","mm"
];

const censorProfanity = (content) => {
  let censoredContent = content; 
  const CENSOR_STRING = "**";
  
  for (const word of PROHIBITED_WORDS) {
    const regex = new RegExp(`([\\s\\W]|^)(${word})([\\s\\W]|$)`, 'gi');
    
    censoredContent = censoredContent.replace(regex, (match, before, matchedWord, after) => {
      return before + CENSOR_STRING + after;
    });
  }
  return censoredContent; 
};

exports.findByProductId = async (req, res) => {
  try {
    const { id } = req.params;
    const query = {};
    query.product_id = id;
    
    query.status = req.query.status || "approved"; 
    
    const sort = {};
    if (req.query.sort && req.query.sort == true) {
      sort._id = 1;
    } else {
      sort._id = -1;
    }
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = page * limit - limit;
    const comments = await CommentModel.find(query)
      .skip(skip)
      .limit(limit)
      .sort(sort);
    return res.status(200).json({
      status: "success",
      message: "Get comments successfully",
      data: comments,
      pages: await paginate(page, limit, query, CommentModel),
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.create = async (req, res) => {
  try {
    const { id } = req.params;
    const { body } = req;
    
    if (body.name === "")
      return res.status(400).json({
        status: "error",
        message: "Name is required",
      });
    if (body.email === "")
      return res.status(400).json({
        status: "error",
        message: "Email is required",
      });
    if (body.content === "")
      return res.status(400).json({
        status: "error",
        message: "Content is required",
      });

    const censoredContent = censorProfanity(body.content); 
    
    const newComment = await CommentModel.create({
      product_id: id,
      name: body.name,
      email: body.email,
      content: censoredContent, 
    });
    
    return res.status(201).json({
      status: "success",
      message: "Comment created successfully (Profanity filtered)",
      data: newComment,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["pending", "approved"].includes(status)) {
        return res.status(400).json({
            status: "error",
            message: "Invalid status value. Must be 'pending' or 'approved'.",
        });
    }

    const comment = await CommentModel.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true } 
    );

    if (!comment) {
      return res.status(404).json({
        status: "error",
        message: "Comment not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: `Comment status updated to ${status} successfully`,
      data: comment,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await CommentModel.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({
        status: "error",
        message: "Comment not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Comment deleted successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
};