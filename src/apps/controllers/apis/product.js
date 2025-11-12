const ProductModel = require("../../models/product");
const paginate = require("../../../libs/paginate");
const path = require("path");
const fs = require("fs");

const PRODUCT_SUBFOLDER = 'products';
const PRODUCT_UPLOAD_DIR = path.join(__dirname, '..', '..', 'public', 'upload', PRODUCT_SUBFOLDER);


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
    const product = await ProductModel.findById(id).populate('category_id');

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

// API thêm mới sản phẩm có upload ảnh
exports.create = async (req, res) => {
  try {
    // Middleware upload.uploadProduct đã xử lý và set vào req.body.image
    // Nếu không có ảnh, middleware đã trả lỗi trước khi đến đây (isMandatory: true)
    
    if (!req.body.image && !req.uploadedFile) {
      return res.status(400).json({
        status: "error",
        message: "Product image is required",
      });
    }

    // Đường dẫn ảnh đã được middleware set vào req.body.image
    const imagePath = req.body.image;
    
    const productData = {
      ...req.body,
      image: imagePath,
      is_stock: req.body.is_stock === 'true' || req.body.is_stock === true, 
      is_featured: req.body.is_featured === 'true' || req.body.is_featured === true, 
    };

    const product = await ProductModel.create(productData);
    const newProduct = await ProductModel.findById(product._id).populate('category_id');

    return res.status(201).json({
      status: "success",
      message: "Product created successfully",
      data: newProduct,
    });
  } catch (error) {
    // Xóa file nếu có lỗi xảy ra sau khi upload nhưng trước khi lưu DB
    if (req.uploadedFile) {
      const filePath = path.join(PRODUCT_UPLOAD_DIR, req.uploadedFile.filename);
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
          if (err) console.error("Failed to delete file after DB error:", err);
        });
      }
    }
    return res.status(500).json({
      status: "error",
      message: "Internal server error or validation failed",
      error: error.message,
    });
  }
};

// API sửa thông tin sản phẩm có tính năng sửa ảnh mô tả
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    let updateData = { ...req.body };

    const product = await ProductModel.findById(id);
    if (!product) {
      // Nếu không tìm thấy sản phẩm, xóa file mới nếu đã upload
      if (req.uploadedFile) {
        const filePath = path.join(PRODUCT_UPLOAD_DIR, req.uploadedFile.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      return res.status(404).json({
        status: "error",
        message: "Product not found",
      });
    }
    
    // Xử lý upload ảnh mới (nếu có) - middleware đã set vào req.body.image
    if (req.uploadedFile || req.body.image !== product.image) {
      // 1. Xóa ảnh cũ nếu có ảnh mới được upload
      if (req.uploadedFile && product.image) {
        const oldImageFilename = path.basename(product.image); 
        const oldImagePath = path.join(PRODUCT_UPLOAD_DIR, oldImageFilename);
        
        if (fs.existsSync(oldImagePath)) {
          fs.unlink(oldImagePath, (err) => {
            if (err) console.error("Failed to delete old image:", err);
          });
        }
      }

      // 2. Đường dẫn ảnh mới đã được middleware set vào req.body.image
      if (req.body.image) {
        updateData.image = req.body.image;
      }
    }
    
    if (updateData.is_stock !== undefined) {
         updateData.is_stock = updateData.is_stock === 'true' || updateData.is_stock === true;
    }
    if (updateData.is_featured !== undefined) {
         updateData.is_featured = updateData.is_featured === 'true' || updateData.is_featured === true;
    }

    const updatedProduct = await ProductModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true } 
    ).populate('category_id'); 

    return res.status(200).json({
      status: "success",
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    // Xóa file mới nếu có lỗi xảy ra sau khi upload nhưng trước khi lưu DB
    if (req.uploadedFile) {
      const filePath = path.join(PRODUCT_UPLOAD_DIR, req.uploadedFile.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
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
    
    // Thêm logic xóa tệp ảnh vật lý
    if (deletedProduct.image) {
        const imageFilename = path.basename(deletedProduct.image);
        const imagePath = path.join(PRODUCT_UPLOAD_DIR, imageFilename);

        if (fs.existsSync(imagePath)) {
            fs.unlink(imagePath, (err) => {
                if (err) console.error("Failed to delete product image:", err);
            });
        }
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