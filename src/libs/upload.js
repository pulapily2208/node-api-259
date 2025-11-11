const multer = require('multer');
const path = require('path');

// Định nghĩa nơi lưu trữ file
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'public', 'upload', 'products'));
    },
    // Đặt tên file với timestamp để tránh trùng
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const filename = Date.now() + ext;
        cb(null, filename);
    }
});

// Cấu hình Multer
const upload = multer({ 
    storage: storage,
    limits: { 
        fileSize: 1024 * 1024 * 10
    },
    fileFilter: (req, file, cb) => {
        // Chỉ chấp nhận các loại ảnh
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/gif') {
            cb(null, true);
        } else {
            cb(null, false);
            // Bạn có thể thêm flash message để báo lỗi loại file
            req.flash('error', 'Chỉ được phép tải lên file ảnh (jpg, png, gif)');
        }
    }
});

// Xuất ra để sử dụng trong route
module.exports = upload;