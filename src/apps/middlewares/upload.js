const formidable = require("formidable");
const path = require("path");
const fs = require("fs");

// Tạo thư mục nếu chưa tồn tại
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// Handler upload dùng formidable
// Thêm tham số options để cấu hình file là bắt buộc (isMandatory)
const handleUpload = (subfolder, options = {}) => {
  const isMandatory = options.isMandatory || false; // Mặc định là không bắt buộc

  return (req, res, next) => {
    const uploadDir = path.join(
      __dirname,
      "..",
      "..",
      "public",
      "upload",
      subfolder
    );
    ensureDir(uploadDir);

    const form = new formidable.IncomingForm({
      multiples: false,
      maxFileSize: 5 * 1024 * 1024, // 5MB
      uploadDir: uploadDir,
      keepExtensions: true,
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error("Formidable parse error:", err);
        return res
          .status(400)
          .json({
            status: "error",
            message: "Error parsing form data",
            error: err.message,
          });
      } // files.image may be undefined, and in formidable v3+ it is an array.

      let file = files.image || files.file || null; // FIX: Extract the actual file object from the array if it is an array (formidable v3+ fix).

      if (Array.isArray(file) && file.length > 0) {
        file = file[0];
      }
      if (!file) {
        // Thêm kiểm tra file bắt buộc tại đây
        if (isMandatory) {
          return res.status(400).json({ message: "Image is required" });
        } // attach fields to req.body for consistency

        req.body = Object.assign({}, req.body, fields);
        return next();
      } // formidable already saved file into uploadDir with a temp name; rename to timestamp+ext

      const ext = path.extname(
        file.originalFilename || file.newFilename || file.name || ""
      );
      const newName = Date.now() + ext;
      const newPath = path.join(uploadDir, newName); // file.filepath là đường dẫn tạm thời tiêu chuẩn trong formidable

      const oldPath = file.filepath || file.path || file.newFilename;

      try {
        fs.renameSync(oldPath, newPath);
      } catch (renameErr) {
        console.error("Error moving uploaded file:", renameErr);
        return res
          .status(500)
          .json({
            status: "error",
            message: "Error saving file",
            error: renameErr.message,
          });
      } // set uploadedFile and merge fields into req.body

      req.uploadedFile = {
        filename: newName,
        path: `/upload/${subfolder}/${newName}`,
        mimetype: file.mimetype || file.type || "",
      };
      req.body = Object.assign({}, req.body, fields);

      next();
    });
  };
};

module.exports = {
  // Chỉ định isMandatory: true cho những middleware cần file là bắt buộc
  uploadProduct: handleUpload("products", { isMandatory: true }),
  uploadLogo: handleUpload("logo"),
  uploadAd: handleUpload("ads"),
  uploadSlider: handleUpload("sliders"),
  uploadBanner: handleUpload("banners"),
};
