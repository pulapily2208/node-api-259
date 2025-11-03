const CategoryModel = require("../../models/category");
exports.findAll = async (req, res) => {
  try {
    const categories = await CategoryModel.find();
    return res.status(200).json({
      status: "success",
      message: "Get categories successfully",
      data: categories,
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
    const category = await CategoryModel.findById(id);
    return res.status(200).json({
      status: "success",
      message: "Get category successflly",
      data: category,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
};
