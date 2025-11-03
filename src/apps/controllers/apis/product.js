const ProductModel = require("../../models/product");
const paginate = require("../../../libs/paginate");
exports.findAll = async (req, res) => {
  try {
    const query = {};
    if (req.query.is_featured) query.is_featured = req.query.is_featured;
    if (req.query.category_id) query.category_id = req.query.category_id;
    if (req.query.keyword) query.$text = { $search: req.query.keyword };
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = page * limit - limit;
    const products = await ProductModel.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ _id: -1 });
    return res.status(200).json({
      status: "success",
      message: "Get products successfully",
      data: products,
      pages: await paginate(page, limit, query, ProductModel),
    });
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
    const { id } = req.params;
    const product = await ProductModel.findById(id);
    return res.status(200).json({
      status: "success",
      message: "Get product successfully",
      data: product,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
};
