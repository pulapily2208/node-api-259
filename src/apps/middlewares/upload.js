const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Middleware lọc tệp tin (chỉ chấp nhận hình ảnh)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    req.fileValidationError = 'Only image files are allowed!';
    cb(null, false); 
  }
};

/**
 * Hàm tạo middleware multer cho một thư mục con cụ thể.
 * @param {string} subfolder Tên thư mục con (ví dụ: 'products', 'logo', 'ads')
 */
const createUploadMiddleware = (subfolder) => {
  const storage = multer.diskStorage({
    // Định nghĩa thư mục đích
    destination: (req, file, cb) => {
      // Đường dẫn vật lý: src/public/upload/<subfolder>
      const uploadPath = path.join(__dirname, '..', '..', 'public', 'upload', subfolder);
      
      // Tạo thư mục nếu chưa tồn tại
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    // Định nghĩa tên tệp
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname.replace(/\s/g, '-')}`);
    }
  });

  return multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 1024 * 1024 * 10
    }
  });
};

// Xuất ra các middleware chuyên dụng cho từng loại file
exports.uploadProduct = createUploadMiddleware('products');
exports.uploadLogo = createUploadMiddleware('logo');
exports.uploadAd = createUploadMiddleware('ads');
exports.uploadBanner = createUploadMiddleware('banners');
exports.uploadSlider = createUploadMiddleware('sliders');