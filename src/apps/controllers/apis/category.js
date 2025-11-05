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

exports.create = async (req, res) => {
  try {
    const { name } = req.body;
    // Kiểm tra tên danh mục đã tồn tại
    const nameExists = await CategoryModel.findOne({ name });
    if (nameExists)
      return res.status(400).json({
        status: "error",
        message: "Category name already exists",
      });

    const newCategory = await CategoryModel.create({
      name,
    });
    return res.status(201).json({
      status: "success",
      message: "Category created successfully",
      data: newCategory,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
      detail: error.message
    });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Kiểm tra danh mục có tồn tại không
    const category = await CategoryModel.findById(id);
    if (!category) {
      return res.status(404).json({
        status: "error",
        message: "Category not found",
      });
    }

    // Kiểm tra tên mới có bị trùng với danh mục khác không
    // $ne: Not Equal (Không bao gồm ID hiện tại)
    const nameExists = await CategoryModel.findOne({ name, _id: { $ne: id } });
    if (nameExists)
      return res.status(400).json({
        status: "error",
        message: "Category name already exists",
      });

    // Cập nhật danh mục
    const updatedCategory = await CategoryModel.findByIdAndUpdate(
      id,
      { name },
      { new: true } 
    );
    
    return res.status(200).json({
      status: "success",
      message: "Category updated successfully",
      data: updatedCategory,
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
    const deletedCategory = await CategoryModel.findByIdAndDelete(id);

    // Kiểm tra nếu không tìm thấy danh mục
    if (!deletedCategory) {
      return res.status(404).json({
        status: "error",
        message: "Category not found",
      });
    }
    return res.status(200).json({
      status: "success",
      message: "Category deleted successfully",
      data: deletedCategory,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
};