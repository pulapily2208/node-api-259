const CommentModel = require("../../models/comment");
const paginate = require("../../../libs/paginate");

const PROHIBITED_WORDS = [
  "đcm","đm","cmm","cc","shit","cút","mm","fuck","đéo","chó","bitch","damn"
];

const censorProfanity = (content) => {
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

exports.findAll = async (req, res) => {
  try {
    const query = {};
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    if (req.query.product_id) {
      query.product_id = req.query.product_id;
    }

    if (req.query.customer_id) {
      query.customer_id = req.query.customer_id;
    }
    
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
      .populate('customer_id', 'fullName email')
      .populate('product_id', 'name price image')
      .skip(skip)
      .limit(limit)
      .sort(sort);
      
    return res.status(200).json({
      status: "success",
      message: "Get all comments successfully",
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

exports.findByProductId = async (req, res) => {
  try {
    const { id } = req.params;
    const query = {};
    query.product_id = id;
    
    // Nếu có query status thì filter theo status, không thì lấy tất cả
    if (req.query.status) {
      query.status = req.query.status;
    }
    
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
      .populate('customer_id', 'fullName email')
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
    
    // Kiểm tra nội dung bắt buộc
    if (!body.content || body.content === "") {
      return res.status(400).json({
        status: "error",
        message: "Content is required",
      });
    }

    let commentData = {
      product_id: id,
      content: censorProfanity(body.content),
    };

    // Kiểm tra: Có customer từ middleware không? (đã đăng nhập)
    if (req.customer && req.customer._id) {
      // Trường hợp 1: Customer đã đăng nhập
      commentData.customer_id = req.customer._id;
      commentData.name = req.customer.fullName;
      commentData.email = req.customer.email;
    } 
    // Trường hợp 2: Khách vãng lai (phải có name và email)
    else {
      if (!body.name || body.name === "") {
        return res.status(400).json({
          status: "error",
          message: "Name is required",
        });
      }
      if (!body.email || body.email === "") {
        return res.status(400).json({
          status: "error",
          message: "Email is required",
        });
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        return res.status(400).json({
          status: "error",
          message: "Invalid email format",
        });
      }
      
      commentData.name = body.name;
      commentData.email = body.email;
    }
    
    const newComment = await CommentModel.create(commentData);
    
    return res.status(201).json({
      status: "success",
      message: req.customer 
        ? "Comment created successfully as customer (Profanity filtered)" 
        : "Comment created successfully as guest (Profanity filtered)",
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