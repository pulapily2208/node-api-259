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
      .sort({ _id: -1 })
      .populate('category_id');
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
    const product = await ProductModel.findById(id).populate('category_id'); // Đã thêm populate category_id

    if (!product) {
        return res.status(404).json({
          status: "error",
          message: "Product not found",
        });
      }

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


exports.create = async (req, res) => {
    try {
        const product = await ProductModel.create(req.body);
        const newProduct = await ProductModel.findById(product._id).populate('category_id');

        return res.status(201).json({
            status: "success",
            message: "Product created successfully",
            data: newProduct,
        });
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "Internal server error or validation failed",
            error: error.message,
        });
    }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const updatedProduct = await ProductModel.findByIdAndUpdate(
      id,
      data,
      { new: true, runValidators: true } 
    ).populate('category_id'); 

    if (!updatedProduct) {
      return res.status(404).json({
        status: "error",
        message: "Product not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error or validation failed",
      error: error.message,
    });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await ProductModel.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({
        status: "error",
        message: "Product not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Product deleted successfully",
      data: deletedProduct,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
};