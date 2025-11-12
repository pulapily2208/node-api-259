const SettingModel = require("../../models/setting");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

// Cấu hình upload riêng cho logo
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Đường dẫn đúng tới thư mục public/upload/logo (không phải apps/public)
    const logoDir = path.join(__dirname, "../../../public/upload/logo");
    
    // Tạo thư mục logo nếu chưa có
    if (!fs.existsSync(logoDir)) {
      fs.mkdirSync(logoDir, { recursive: true });
    }
    
    cb(null, logoDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = "logo-" + Date.now() + ext;
    cb(null, filename);
  }
});

const uploadLogo = multer({
  storage: logoStorage,
  limits: {
    fileSize: 1024 * 1024 * 5 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png" || file.mimetype === "image/gif") {
      cb(null, true);
    } else {
      cb(new Error("Chỉ được phép tải lên file ảnh (jpg, png, gif)"));
    }
  }
});

// Export uploadLogo để dùng trong route
exports.uploadLogo = uploadLogo;

// Hiển thị trang cấu hình settings
exports.showSettings = async (req, res) => {
  try {
    // Lấy setting đầu tiên (hoặc tạo mới nếu chưa có)
    let setting = await SettingModel.findOne();
    
    if (!setting) {
      // Tạo setting mặc định nếu chưa có
      setting = new SettingModel({
        shop_name: "Vietpro Shop",
        thumbnail_logo: "logo/default-logo.png",
        description: "",
        copyright: "© 2025 MyWebsite. All rights reserved."
      });
      await setting.save();
    }

    res.render("admin/setting", {
      setting,
      oldData: {},
      success: req.flash("success"),
      message: req.flash("error")[0] || req.flash("success")[0] || "",
      error: req.flash("error")
    });
  } catch (error) {
    console.error("Error loading settings:", error);
    req.flash("error", "Không thể tải cấu hình");
    res.redirect("/admin");
  }
};

// Cập nhật settings
exports.update = async (req, res) => {
  try {
  const { shop_name, description, copyright } = req.body;
    
    console.log("Upload file:", req.file); // Debug log
    console.log("Body data:", req.body); // Debug log
    
    // Lấy setting hiện tại
    let setting = await SettingModel.findOne();
    
    if (!setting) {
      setting = new SettingModel();
    }

    // Cập nhật thông tin text
    if (typeof shop_name === 'string') {
      setting.shop_name = shop_name.trim();
    }
    setting.description = description || "";
    setting.copyright = copyright || "";

    // Xử lý upload logo nếu có
    if (req.file) {
      console.log("File uploaded to:", req.file.path); // Debug log
      
      const oldLogoPath = path.join(__dirname, "../../../public/upload", setting.thumbnail_logo);
      
      // Xóa logo cũ (nếu không phải logo mặc định)
      if (setting.thumbnail_logo !== "logo/default-logo.png" && fs.existsSync(oldLogoPath)) {
        try {
          fs.unlinkSync(oldLogoPath);
          console.log("Deleted old logo:", oldLogoPath); // Debug log
        } catch (err) {
          console.log("Could not delete old logo:", err);
        }
      }

      // Lưu đường dẫn logo mới (chỉ lưu tên file vì đã có trong thư mục logo)
      setting.thumbnail_logo = `logo/${req.file.filename}`;
      console.log("New logo path:", setting.thumbnail_logo); // Debug log
    }

    await setting.save();

    req.flash("success", "Cập nhật cấu hình thành công!");
    res.redirect("/admin/settings");
  } catch (error) {
    console.error("Error updating settings:", error);
    req.flash("error", "Không thể cập nhật cấu hình");
    res.redirect("/admin/settings");
  }
};
